import { useState } from "react";
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

  const filteredAlgorithms = sortingAlgorithms.filter(algo =>
    algo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    algo.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    algo.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handlePlay = async (id: string) => {
    if (playingId) {
      stopAllSorting();
      setPlayingId(null);
      setVisualArrays({});
      setHighlightIndices({});
      toast.info("Stopped current algorithm");
    }

    setPlayingId(id);
    toast.success(`Playing ${sortingAlgorithms.find(a => a.id === id)?.name}`);
    
    try {
      const sortFn = sortingFunctions[id];
      if (sortFn) {
        const visualCallback: VisualCallback = (array, indices) => {
          setVisualArrays(prev => ({ ...prev, [id]: array }));
          setHighlightIndices(prev => ({ ...prev, [id]: indices || [] }));
        };
        
        await sortFn(60, visualCallback, true);
      }
    } catch (error) {
      console.error('Error playing algorithm:', error);
      toast.error("Error playing algorithm");
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
    <section className="h-screen flex flex-col px-4 py-3 overflow-hidden">
      <div className="container mx-auto flex-1 flex flex-col min-h-0">
        {/* Smaller Header */}
        <div className="text-center mb-3">
          <h1 className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Sort Your Mind
          </h1>
        </div>

        {/* Central Visualizer */}
        <div className="flex flex-col bg-gradient-card backdrop-blur-md border border-border/50 rounded-lg p-4 mb-4 h-[45vh]">
          <div className="mb-3">
            <h2 className="text-base font-semibold text-foreground mb-1">
              {currentAlgorithm ? currentAlgorithm.name : 'Visualizer'}
            </h2>
            {currentAlgorithm && (
              <p className="text-xs text-muted-foreground">
                {currentAlgorithm.description}
              </p>
            )}
          </div>

          <div className="flex-1 flex items-end gap-0.5 bg-background/50 rounded-md p-3 min-h-0">
            {visualArrays[playingId || ''] && visualArrays[playingId || ''].length > 0 ? (
              visualArrays[playingId || ''].map((value, i) => {
                const isHighlighted = highlightIndices[playingId || '']?.includes(i);
                return (
                  <div
                    key={i}
                    className={`flex-1 rounded-sm transition-all duration-150 ${
                      isHighlighted && currentAlgorithm
                        ? `bg-gradient-to-t ${currentAlgorithm.color}` 
                        : 'bg-gradient-to-t from-muted to-muted-foreground/30'
                    }`}
                    style={{
                      height: `${(value / maxValue) * 100}%`,
                      minWidth: '2px',
                    }}
                  />
                );
              })
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-muted-foreground text-sm">
                  Select an algorithm to begin
                </p>
              </div>
            )}
          </div>

          {playingId && (
            <div className="mt-3">
              <button
                onClick={handleStop}
                className="w-full bg-destructive hover:bg-destructive/90 text-destructive-foreground py-2 px-4 rounded-md transition-colors flex items-center justify-center gap-2 text-sm"
              >
                <Pause className="w-4 h-4" />
                Stop
              </button>
            </div>
          )}
        </div>

        {/* Algorithm Options Below */}
        <div className="flex flex-col min-h-0 flex-1">
          {/* Search */}
          <div className="mb-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search algorithms..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 bg-card/50 backdrop-blur-sm border-border/50 focus:border-primary/50 transition-colors"
              />
            </div>
          </div>

          {/* Scrollable Grid */}
          <div className="flex-1 overflow-y-auto pr-2 min-h-0">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
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
              <div className="text-center py-12">
                <p className="text-sm text-muted-foreground">No algorithms found</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
