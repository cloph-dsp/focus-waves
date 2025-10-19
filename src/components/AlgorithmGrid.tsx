import { useRef, useState } from "react";
import { AlgorithmCard } from "./AlgorithmCard";
import { sortingAlgorithms, sortingFunctions, stopAllSorting, type VisualCallback } from "@/utils/audioGenerator";
import { Input } from "@/components/ui/input";
import { Search, Pause } from "lucide-react";
import { toast } from "sonner";

export const AlgorithmGrid = () => {
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [visualArrays, setVisualArrays] = useState<Record<string, number[]>>({});
  const [highlightIndices, setHighlightIndices] = useState<Record<string, number[]>>({});
  const runRef = useRef<Promise<void> | null>(null);

  const filteredAlgorithms = sortingAlgorithms.filter(algo =>
    algo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    algo.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    algo.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handlePlay = async (id: string) => {
    // If clicking the same algorithm, stop it
    if (playingId === id) {
      handleStop();
      return;
    }

    // Always stop any currently playing algorithm first
    stopAllSorting();
    setVisualArrays({});
    setHighlightIndices({});

    // Wait for any ongoing run to finish to prevent overlap
    try { await runRef.current; } catch {}

    setPlayingId(id);
    toast.success(`Playing ${sortingAlgorithms.find(a => a.id === id)?.name}`);
    
    try {
      const sortFn = sortingFunctions[id];
      if (sortFn) {
        const visualCallback: VisualCallback = (array, indices) => {
          setVisualArrays(prev => ({ ...prev, [id]: array }));
          setHighlightIndices(prev => ({ ...prev, [id]: indices || [] }));
        };
        const p = sortFn(60, visualCallback, true) as Promise<void>;
        runRef.current = p;
        await p;
      }
    } catch (error) {
      console.error('Error playing algorithm:', error);
      toast.error("Error playing algorithm");
    } finally {
      // Clean up if this algorithm is still marked as playing
      setPlayingId(prev => prev === id ? null : prev);
      if (runRef.current && typeof runRef.current.then === 'function') {
        // Clear ref if it belongs to this run
        runRef.current = null;
      }
    }
  };

  const handleStop = () => {
    stopAllSorting();
    setPlayingId(null);
    setVisualArrays({});
    setHighlightIndices({});
    toast.info("Stopped");
  };

  const currentAlgorithm = playingId ? sortingAlgorithms.find(a => a.id === playingId) : null;
  const maxValue = visualArrays[playingId || ''] ? Math.max(...visualArrays[playingId || '']) : 60;

  return (
    <section className="h-screen flex flex-col px-3 py-2 overflow-hidden">
      <div className="container mx-auto flex-1 flex flex-col min-h-0 max-w-7xl">
        {/* Compact Header */}
        <div className="text-center mb-2">
          <h1 className="text-base font-bold bg-gradient-primary bg-clip-text text-transparent tracking-tight">
            Sort Your Mind
          </h1>
        </div>

        {/* Expanded Visualizer */}
        <div className="relative flex flex-col bg-gradient-visualizer backdrop-blur-xl border border-border/30 rounded-xl p-2.5 mb-2 h-[48vh] sm:h-[50vh] md:h-[52vh] lg:h-[55vh] shadow-glow-subtle">
          {playingId && (
            <button
              onClick={handleStop}
              className="absolute top-2 right-2 bg-destructive/90 hover:bg-destructive text-destructive-foreground py-1 px-2.5 rounded-lg transition-fast flex items-center gap-1.5 text-[10px] font-semibold shadow-lg hover:shadow-xl"
            >
              <Pause className="w-3 h-3" />
              Stop
            </button>
          )}

          <div className="flex-1 flex items-end gap-[1px] bg-background/30 rounded-lg p-2.5 min-h-0 backdrop-blur-sm border border-border/20">
            {visualArrays[playingId || ''] && visualArrays[playingId || ''].length > 0 ? (
              visualArrays[playingId || ''].map((value, i) => {
                const isHighlighted = highlightIndices[playingId || '']?.includes(i);
                return (
                  <div
                    key={i}
                    className={`flex-1 rounded-t-sm transition-all duration-100 ${
                      isHighlighted && currentAlgorithm
                        ? `bg-gradient-to-t ${currentAlgorithm.color} shadow-lg` 
                        : 'bg-gradient-to-t from-muted/80 to-muted-foreground/40'
                    }`}
                    style={{
                      height: `${(value / maxValue) * 100}%`,
                      minWidth: '1.5px',
                      filter: isHighlighted ? 'brightness(1.2)' : 'brightness(0.9)',
                    }}
                  />
                );
              })
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-muted-foreground/60 text-[11px] font-medium">
                  Select an algorithm to begin
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Algorithm Options Below */}
        <div className="flex flex-col min-h-0 flex-1">
          {/* Search */}
          <div className="mb-2">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground/60" />
              <Input
                type="text"
                placeholder="Search algorithms..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-7 h-7 text-[11px] bg-card/60 backdrop-blur-sm border-border/40 focus:border-primary/60 transition-fast rounded-lg"
              />
            </div>
          </div>

          {/* Ultra Compact Scrollable Grid */}
          <div className="flex-1 overflow-y-auto pr-1 min-h-0 scrollbar-thin">
            <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-9 xl:grid-cols-10 2xl:grid-cols-12 gap-1">
              {filteredAlgorithms.map((algorithm) => (
                <AlgorithmCard
                  key={algorithm.id}
                  algorithm={algorithm}
                  isPlaying={playingId === algorithm.id}
                  onPlay={() => handlePlay(algorithm.id)}
                />
              ))}
            </div>

            {filteredAlgorithms.length === 0 && (
              <div className="text-center py-6">
                <p className="text-[11px] text-muted-foreground/60">No algorithms found</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
