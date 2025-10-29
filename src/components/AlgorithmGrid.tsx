import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  sortingAlgorithms,
  runSortingGenerator,
  ensureAudioContextRunning,
  configureAudioScene,
  getAudioStressLevel,
  type SortingAlgorithm,
} from "@/utils/audio";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { ChevronsUpDown, Pause, Play } from "lucide-react";

const DEFAULT_SAMPLE_SIZE = 64;
const MAX_DISPLAY_BARS = 512;

const createBaselineArray = (size: number) => {
  const length = Math.min(size, MAX_DISPLAY_BARS);
  return Array.from({ length }, (_, index) => index + 1);
};

const createDisplaySnapshot = (
  array: number[],
  highlightIndices: number[],
  maxItems: number,
) => {
  if (array.length === 0) {
    return {
      values: [],
      highlights: [],
    };
  }

  const targetLength = Math.min(maxItems, array.length);
  if (array.length <= targetLength) {
    return {
      values: [...array],
      highlights: highlightIndices
        .map((index) => Math.min(index, array.length - 1))
        .filter((value, position, self) => self.indexOf(value) === position)
        .sort((a, b) => a - b),
    };
  }

  const step = array.length / targetLength;
  const values: number[] = new Array(targetLength);
  const highlightBuckets = new Set<number>();

  for (let i = 0; i < targetLength; i++) {
    const start = Math.floor(i * step);
    const end = Math.min(array.length, Math.floor((i + 1) * step));
    let bucketMax = 0;
    for (let j = start; j < end; j++) {
      if (array[j] > bucketMax) bucketMax = array[j];
    }
    values[i] = bucketMax || array[Math.min(array.length - 1, start)];
  }

  for (const index of highlightIndices) {
    const bucket = Math.min(Math.floor(index / step), targetLength - 1);
    highlightBuckets.add(bucket);
  }

  return {
    values,
    highlights: Array.from(highlightBuckets).sort((a, b) => a - b),
  };
};

const isAbortError = (error: unknown): boolean => {
  if (error instanceof DOMException) {
    return error.name === "AbortError";
  }

  if (!error || typeof error !== "object") {
    return false;
  }

  return (error as { name?: string }).name === "AbortError";
};

type AlgorithmComboboxProps = {
  algorithms: SortingAlgorithm[];
  value: string | null;
  onChange: (value: string) => void;
  searchQuery: string;
  onSearchChange: (value: string) => void;
};

const AlgorithmCombobox = ({ algorithms, value, onChange, searchQuery, onSearchChange }: AlgorithmComboboxProps) => {
  const [open, setOpen] = useState(false);
  const selectedAlgorithm = useMemo(
    () => algorithms.find((algorithm) => algorithm.id === value),
    [algorithms, value],
  );

  const handleSelect = useCallback(
    (algorithmId: string) => {
      onChange(algorithmId);
      setOpen(false);
    },
    [onChange, setOpen],
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="h-12 justify-between rounded-xl border border-slate-800/80 bg-slate-950/60 px-5 text-sm font-medium text-slate-200 hover:bg-slate-900/80"
        >
          <span className="truncate text-left">
            {selectedAlgorithm ? selectedAlgorithm.name : "Select algorithm"}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-60" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[320px] border border-slate-800/80 bg-slate-950/90 p-0 shadow-2xl backdrop-blur-xl">
        <Command className="bg-transparent text-slate-200" filter={() => 1}>
          <CommandInput
            placeholder="Search algorithms"
            className="h-11"
            value={searchQuery}
            onValueChange={onSearchChange}
          />
          <CommandList className="max-h-[280px]">
            {algorithms.length === 0 ? (
              <div className="py-6 text-center text-sm text-slate-500">No algorithms found.</div>
            ) : (
              <CommandGroup className="space-y-2 p-2">
                {algorithms.map((algorithm) => {
                  const isActive = algorithm.id === value;
                  return (
                    <CommandItem
                      key={algorithm.id}
                      value={algorithm.id}
                      className={`flex flex-col gap-2 rounded-lg px-3 py-3 text-slate-200 transition-colors ${
                        isActive ? "bg-slate-900/70 text-slate-100" : "bg-transparent"
                      }`}
                      onSelect={() => handleSelect(algorithm.id)}
                    >
                      <span className="text-sm font-medium text-slate-100">{algorithm.name}</span>
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <Badge
                          variant="outline"
                          className="border-slate-700/80 bg-transparent px-2 py-0.5 text-[10px] uppercase tracking-wide text-slate-400"
                        >
                          {algorithm.category}
                        </Badge>
                        <Badge
                          variant="outline"
                          className="border-slate-700/80 bg-transparent px-2 py-0.5 text-[10px] font-mono text-slate-500"
                        >
                          {algorithm.complexity}
                        </Badge>
                      </div>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export const AlgorithmGrid = () => {
  const [selectedAlgorithmId, setSelectedAlgorithmId] = useState<string | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [sampleSize, setSampleSize] = useState<number>(DEFAULT_SAMPLE_SIZE);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [visualArray, setVisualArray] = useState<number[]>(() => createBaselineArray(DEFAULT_SAMPLE_SIZE));
  const [highlightIndices, setHighlightIndices] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const abortControllerRef = useRef<AbortController | null>(null);
  const runPromiseRef = useRef<Promise<void> | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      abortControllerRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      setDebouncedSearch(searchQuery.trim().toLowerCase());
    }, 150);

    return () => {
      window.clearTimeout(handle);
    };
  }, [searchQuery]);

  const categories = useMemo(
    () => ["All", ...Array.from(new Set(sortingAlgorithms.map((algorithm) => algorithm.category)))],
    [],
  );

  const algorithmsByCategory = useMemo(() => {
    if (selectedCategory === "All") {
      return sortingAlgorithms;
    }

    return sortingAlgorithms.filter((algorithm) => algorithm.category === selectedCategory);
  }, [selectedCategory]);

  const filteredAlgorithms = useMemo(() => {
    if (!debouncedSearch) {
      return algorithmsByCategory;
    }

    return algorithmsByCategory.filter((algorithm) => {
      const haystack = `${algorithm.name} ${algorithm.description} ${algorithm.category} ${algorithm.complexity}`.toLowerCase();
      return haystack.includes(debouncedSearch);
    });
  }, [algorithmsByCategory, debouncedSearch]);

  useEffect(() => {
    if (
      selectedAlgorithmId &&
      !filteredAlgorithms.some((algorithm) => algorithm.id === selectedAlgorithmId)
    ) {
      setSelectedAlgorithmId(null);
    }
  }, [filteredAlgorithms, selectedAlgorithmId]);

  useEffect(() => {
    if (!playingId) {
      setVisualArray(createBaselineArray(sampleSize));
      setHighlightIndices([]);
    }
  }, [playingId, sampleSize]);

  const handleStop = () => {
    abortControllerRef.current?.abort();

    if (!isMountedRef.current) {
      return;
    }

    setPlayingId(null);
    setHighlightIndices([]);
    setVisualArray(createBaselineArray(sampleSize));
  };

  const startAlgorithm = async (id: string) => {
    abortControllerRef.current?.abort();

    const previousRun = runPromiseRef.current;
    if (previousRun) {
      try {
        await previousRun;
      } catch (error) {
        if (!isAbortError(error)) {
          console.error("Error finishing previous algorithm:", error);
        }
      }
    }

    if (!isMountedRef.current) {
      return;
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    setPlayingId(id);
    setVisualArray(createBaselineArray(sampleSize));
    setHighlightIndices([]);

    try {
      await ensureAudioContextRunning();
    } catch (error) {
      console.warn("Unable to resume audio context", error);
    }

    configureAudioScene({ sampleSize });

    let updateCounter = 0;
    const throttleRate = sampleSize > 1024 ? 160 : sampleSize > 512 ? 100 : sampleSize > 256 ? 60 : sampleSize > 128 ? 40 : 20;
    const minIntervalMs = sampleSize > 2048 ? 450 : sampleSize > 1024 ? 320 : sampleSize > 512 ? 220 : sampleSize > 256 ? 150 : 90;
    const maxDisplayItems = Math.min(sampleSize, MAX_DISPLAY_BARS);
    let lastVisualUpdate = 0;

    const runPromise = runSortingGenerator({
      id,
      size: sampleSize,
      loop: true,
      signal: controller.signal,
      visualCallback: (array, indices) => {
        if (!isMountedRef.current || controller.signal.aborted) {
          return;
        }

        updateCounter++;
        const now = performance.now();
        const audioStress = getAudioStressLevel();
        const audioStressed = audioStress > 0.35;
        const throttleMultiplier = audioStressed ? 1.8 + audioStress * 2.6 : 1;
        const effectiveThrottleRate = Math.max(1, Math.round(throttleRate * throttleMultiplier));
        const effectiveMinInterval = minIntervalMs * throttleMultiplier;
        const shouldUpdate =
          updateCounter % effectiveThrottleRate === 0 || now - lastVisualUpdate >= effectiveMinInterval;
        if (!shouldUpdate) {
          return;
        }

        if (audioStress > 0.75 && now - lastVisualUpdate < effectiveMinInterval * 1.6) {
          return;
        }

        lastVisualUpdate = now;

        const highlightSnapshot = indices ? [...indices] : [];
  const effectiveMaxItems = audioStress > 0.6 ? Math.min(maxDisplayItems, 256) : maxDisplayItems;
  const { values, highlights } = createDisplaySnapshot(array, highlightSnapshot, effectiveMaxItems);

        requestAnimationFrame(() => {
          if (!isMountedRef.current || controller.signal.aborted) {
            return;
          }

          setVisualArray(values);
          if (audioStress > 0.6) {
            setHighlightIndices(highlights.slice(0, Math.min(32, highlights.length)));
          } else {
            setHighlightIndices(highlights);
          }
        });
      },
    });

    runPromiseRef.current = runPromise;

    try {
      await runPromise;
    } catch (error) {
      if (!isAbortError(error)) {
        console.error("Error playing algorithm:", error);
      }
    } finally {
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null;
      }

      if (runPromiseRef.current === runPromise) {
        runPromiseRef.current = null;
      }

      if (isMountedRef.current) {
        setPlayingId((previous) => (previous === id ? null : previous));
      }
    }
  };

  const handlePlayPause = () => {
    if (!selectedAlgorithmId) {
      return;
    }

    if (playingId === selectedAlgorithmId) {
      handleStop();
      return;
    }

    void startAlgorithm(selectedAlgorithmId);
  };

  const displayArray = visualArray.length ? visualArray : createBaselineArray(sampleSize);
  const maxValue = displayArray.reduce((max, value) => (value > max ? value : max), 1);
  const highlightSet = useMemo(() => new Set(highlightIndices), [highlightIndices]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-6 py-12">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,2.2fr)_minmax(0,1fr)_minmax(0,1fr)]">
          <AlgorithmCombobox
            algorithms={filteredAlgorithms}
            value={selectedAlgorithmId}
            onChange={setSelectedAlgorithmId}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="h-12 rounded-xl border border-slate-800/80 bg-slate-950/60 px-4 text-sm text-slate-200">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent className="border border-slate-800/80 bg-slate-950/90 text-slate-200">
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sampleSize.toString()} onValueChange={(value) => setSampleSize(Number(value))}>
            <SelectTrigger className="h-12 rounded-xl border border-slate-800/80 bg-slate-950/60 px-4 text-sm text-slate-200">
              <SelectValue placeholder="Sample size" />
            </SelectTrigger>
            <SelectContent className="border border-slate-800/80 bg-slate-950/90 text-slate-200">
              {[16, 32, 64, 128, 256, 512, 1024, 2048, 4096].map((size) => (
                <SelectItem key={size} value={size.toString()}>
                  {size} elements
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex justify-center">
          <Button
            onClick={handlePlayPause}
            disabled={!selectedAlgorithmId}
            className="h-12 w-40 rounded-xl border border-slate-800/80 bg-slate-200/10 text-sm font-semibold uppercase tracking-wide text-slate-100 transition-colors hover:bg-slate-200/20 disabled:cursor-not-allowed disabled:border-slate-800/30 disabled:text-slate-600"
          >
            {playingId === selectedAlgorithmId ? (
              <span className="flex items-center justify-center gap-2">
                <Pause className="h-4 w-4" />
                Pause
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <Play className="h-4 w-4" />
                Play
              </span>
            )}
          </Button>
        </div>

        <div className="overflow-hidden rounded-3xl border border-slate-800/80 bg-slate-950/80 p-8 shadow-[0_0_120px_-60px_rgba(148,163,184,0.5)]">
          <div className="relative flex h-[22rem] items-center justify-center">
            {displayArray.length === 0 ? (
              <div className="text-sm text-slate-500">Select an algorithm to begin</div>
            ) : (
              <div
                className="flex h-full w-full items-end justify-center"
                style={{
                  display: "grid",
                  gridTemplateColumns: `repeat(${displayArray.length}, minmax(0,1fr))`,
                  gap: displayArray.length > 256 ? "1px" : "2px",
                  alignItems: "end",
                }}
              >
                {displayArray.map((value, index) => {
                  const height = (value / maxValue) * 100;
                  const isHighlighted = highlightSet.has(index);

                  return (
                    <div
                      key={`bar-${index}`}
                      className="rounded-sm transition-all duration-150"
                      style={{
                        height: `${height}%`,
                        background: isHighlighted
                          ? "linear-gradient(180deg, rgba(148,163,184,0.9) 0%, rgba(71,85,105,0.6) 100%)"
                          : "linear-gradient(180deg, rgba(30,41,59,0.75) 0%, rgba(15,23,42,0.55) 100%)",
                        boxShadow: isHighlighted ? "0 0 12px rgba(148,163,184,0.35)" : "none",
                      }}
                    />
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
