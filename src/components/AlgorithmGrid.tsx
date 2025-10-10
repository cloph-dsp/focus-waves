import { useState } from "react";
import { AlgorithmCard } from "./AlgorithmCard";
import { sortingAlgorithms, sortingFunctions } from "@/utils/audioGenerator";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { toast } from "sonner";

export const AlgorithmGrid = () => {
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredAlgorithms = sortingAlgorithms.filter(algo =>
    algo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    algo.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    algo.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handlePlay = async (id: string) => {
    if (playingId) {
      toast.info("Stop the current algorithm first");
      return;
    }

    setPlayingId(id);
    toast.success(`Playing ${sortingAlgorithms.find(a => a.id === id)?.name}`);
    
    try {
      const sortFn = sortingFunctions[id];
      if (sortFn) {
        await sortFn();
      }
    } catch (error) {
      console.error('Error playing algorithm:', error);
      toast.error("Error playing algorithm");
    } finally {
      setPlayingId(null);
    }
  };

  const handleStop = () => {
    setPlayingId(null);
    toast.info("Stopped");
  };

  return (
    <section className="min-h-screen py-20 px-4">
      <div className="container mx-auto">
        {/* Header */}
        <div className="text-center mb-12 animate-slide-up">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-primary bg-clip-text text-transparent">
            Choose Your Algorithm
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Each algorithm creates unique sound patterns. Find your perfect ambient backdrop.
          </p>
        </div>

        {/* Search */}
        <div className="max-w-xl mx-auto mb-12 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search algorithms..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-card/50 backdrop-blur-sm border-border/50 focus:border-primary/50 transition-colors"
            />
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAlgorithms.map((algorithm, index) => (
            <div
              key={algorithm.id}
              className="animate-slide-up"
              style={{ animationDelay: `${0.1 + index * 0.05}s` }}
            >
              <AlgorithmCard
                algorithm={algorithm}
                isPlaying={playingId === algorithm.id}
                onPlay={() => handlePlay(algorithm.id)}
                onStop={handleStop}
              />
            </div>
          ))}
        </div>

        {filteredAlgorithms.length === 0 && (
          <div className="text-center py-20">
            <p className="text-lg text-muted-foreground">No algorithms found. Try a different search.</p>
          </div>
        )}
      </div>
    </section>
  );
};
