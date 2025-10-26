import { useRef, useState } from "react";
import { AlgorithmCard } from "./AlgorithmCard";
import { sortingAlgorithms, sortingFunctions, stopAllSorting, type VisualCallback } from "@/utils/audioGenerator";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Pause } from "lucide-react";
import { toast } from "sonner";

export const AlgorithmGrid = () => {
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sampleSize, setSampleSize] = useState<number>(64);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [visualArrays, setVisualArrays] = useState<Record<string, number[]>>({});
  const [highlightIndices, setHighlightIndices] = useState<Record<string, number[]>>({});
  const runRef = useRef<Promise<void> | null>(null);

  // Get unique categories
  const categories = ["All", ...Array.from(new Set(sortingAlgorithms.map(algo => algo.category)))];

  const filteredAlgorithms = sortingAlgorithms.filter(algo => {
    const matchesSearch = algo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      algo.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      algo.category.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === "All" || algo.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

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
        let updateCounter = 0;
        let lastUpdateTime = 0;
        
        // Minimal visual callback - prioritize audio performance
        const visualCallback: VisualCallback = sampleSize <= 256 ? (array, indices) => {
          updateCounter++;
          // Only update visuals occasionally for small arrays
          if (updateCounter % 10 === 0) {
            setVisualArrays(prev => ({ ...prev, [id]: [...array] }));
            setHighlightIndices(prev => ({ ...prev, [id]: indices || [] }));
          }
        } : undefined; // No visual updates for large arrays - audio only
        
        const p = sortFn(sampleSize, visualCallback, true) as Promise<void>;
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
  const maxValue = visualArrays[playingId || ''] ? Math.max(...visualArrays[playingId || '']) : sampleSize;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="container mx-auto px-6 py-8 max-w-7xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent mb-4">
            Sort Your Mind
          </h1>
          <p className="text-lg text-slate-300 max-w-2xl mx-auto">
            Experience the beauty of sorting algorithms through sound and visualization
          </p>
        </div>

        {/* Controls Section */}
        <div className="mb-8 space-y-6">
          {/* Current Algorithm Info */}
          {currentAlgorithm && (
            <div className="bg-slate-800/90 backdrop-blur-lg rounded-2xl p-6 border border-slate-700 shadow-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-4 h-4 rounded-full bg-gradient-to-r ${currentAlgorithm.color} animate-pulse`} />
                  <div>
                    <h2 className="text-2xl font-bold text-white">{currentAlgorithm.name}</h2>
                    <p className="text-slate-300">{currentAlgorithm.description}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-sm bg-blue-900/70 text-blue-200 px-3 py-1 rounded-full">
                        {currentAlgorithm.category}
                      </span>
                      <span className="text-sm bg-purple-900/70 text-purple-200 px-3 py-1 rounded-full font-mono">
                        {currentAlgorithm.complexity}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleStop}
                  className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-xl transition-all duration-200 flex items-center gap-2 shadow-lg hover:shadow-xl"
                >
                  <Pause className="w-5 h-5" />
                  Stop
                </button>
              </div>
            </div>
          )}

          {/* Simplified Audio Visualizer */}
          <div className="bg-slate-800/90 backdrop-blur-lg rounded-2xl p-6 border border-slate-700 shadow-xl">
            <div className="h-32 flex items-center justify-center bg-slate-900 rounded-xl relative overflow-hidden">
              {playingId && currentAlgorithm ? (
                <div className="text-center relative z-10">
                  <div className={`w-20 h-20 rounded-full bg-gradient-to-r ${currentAlgorithm.color} animate-pulse mb-4 mx-auto shadow-2xl`} />
                  <p className="text-white text-xl font-bold">{currentAlgorithm.name}</p>
                  <p className="text-slate-300 text-sm mt-1">🎵 Audio-focused sorting</p>
                  <p className="text-slate-400 text-xs mt-2">{sampleSize} elements • Optimized for audio</p>
                </div>
              ) : (
                <div className="text-center">
                  <div className="w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center mb-4 mx-auto">
                    <Search className="w-8 h-8 text-slate-400" />
                  </div>
                  <p className="text-slate-300 text-lg font-medium">
                    Select an algorithm to begin
                  </p>
                  <p className="text-slate-400 text-sm mt-2">
                    🎧 Pure audio experience • Zero lag
                  </p>
                </div>
              )}
              
              {/* Minimal visual bars for small arrays only */}
              {playingId && sampleSize <= 256 && visualArrays[playingId] && (
                <div className="absolute bottom-0 left-0 right-0 h-8 flex items-end gap-[1px] px-4 opacity-30">
                  {visualArrays[playingId].slice(0, 50).map((value, i) => (
                    <div
                      key={i}
                      className="flex-1 bg-white/40 rounded-t-sm"
                      style={{
                        height: `${(value / maxValue) * 100}%`,
                        minWidth: '1px'
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Controls */}
          <div className="bg-slate-800/90 backdrop-blur-lg rounded-2xl p-6 border border-slate-700 shadow-xl">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Search */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-200">Search Algorithms</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    type="text"
                    placeholder="Search by name or description..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 h-11 bg-slate-900/70 border-slate-600 text-slate-200 placeholder:text-slate-400"
                  />
                </div>
              </div>

              {/* Category Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-200">Category</label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="h-11 bg-slate-900/70 border-slate-600 text-slate-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Sample Size */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-200">Sample Size</label>
                <Select value={sampleSize.toString()} onValueChange={(value) => setSampleSize(Number(value))}>
                  <SelectTrigger className="h-11 bg-slate-900/70 border-slate-600 text-slate-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[2, 4, 8, 16, 32, 64, 128, 256, 512, 1024, 2048, 4096].map((size) => (
                      <SelectItem key={size} value={size.toString()}>
                        {size} elements
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-slate-800/90 backdrop-blur-lg rounded-xl p-4 text-center border border-slate-700">
            <div className="text-2xl font-bold text-blue-400">{sortingAlgorithms.length}</div>
            <div className="text-sm text-slate-300">Total Algorithms</div>
          </div>
          <div className="bg-slate-800/90 backdrop-blur-lg rounded-xl p-4 text-center border border-slate-700">
            <div className="text-2xl font-bold text-purple-400">{categories.length - 1}</div>
            <div className="text-sm text-slate-300">Categories</div>
          </div>
          <div className="bg-slate-800/90 backdrop-blur-lg rounded-xl p-4 text-center border border-slate-700">
            <div className="text-2xl font-bold text-green-400">{sampleSize}</div>
            <div className="text-sm text-slate-300">Sample Size</div>
          </div>
          <div className="bg-slate-800/90 backdrop-blur-lg rounded-xl p-4 text-center border border-slate-700">
            <div className="text-2xl font-bold text-orange-400">{playingId ? '1' : '0'}</div>
            <div className="text-sm text-slate-300">Now Playing</div>
          </div>
        </div>

        {/* Algorithm Grid */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-bold text-white">
              Choose an Algorithm
            </h2>
            <div className="text-slate-300 bg-slate-800/70 px-4 py-2 rounded-full border border-slate-600">
              {filteredAlgorithms.length} of {sortingAlgorithms.length} algorithms
            </div>
          </div>

          {filteredAlgorithms.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-slate-700 rounded-full flex items-center justify-center mb-6 mx-auto">
                <Search className="w-12 h-12 text-slate-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">No algorithms found</h3>
              <p className="text-slate-300">Try adjusting your search or filter criteria</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredAlgorithms.map((algorithm) => (
                <AlgorithmCard
                  key={algorithm.id}
                  algorithm={algorithm}
                  isPlaying={playingId === algorithm.id}
                  onPlay={() => handlePlay(algorithm.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
