import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Pause } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { SortingAlgorithm } from "@/utils/audio";

interface AlgorithmCardProps {
  algorithm: SortingAlgorithm;
  isPlaying: boolean;
  onPlay: () => void;
}

export const AlgorithmCard = ({ algorithm, isPlaying, onPlay }: AlgorithmCardProps) => {
  return (
    <Card 
      className={`group relative overflow-hidden transition-all duration-200 cursor-pointer ${
        isPlaying 
          ? 'bg-slate-800/95 ring-1 ring-slate-600 scale-[1.02] border-slate-600' 
          : 'bg-slate-900/90 hover:bg-slate-850/95 border-slate-700/50'
      }`} 
      onClick={onPlay}
    >
      {/* Subtle gradient overlay - minimal */}
      <div className={`absolute inset-0 bg-gradient-to-br ${algorithm.color} opacity-5 group-hover:opacity-8 transition-opacity duration-200`} />
      
      {/* Simple playing indicator */}
      {isPlaying && (
        <div className="absolute top-3 right-3 z-10">
          <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse" />
        </div>
      )}
      
      <div className="relative p-5">
        {/* Algorithm name */}
        <div className="mb-3">
          <h3 className={`text-lg font-semibold mb-1.5 transition-colors ${
            isPlaying ? 'text-slate-200' : 'text-slate-300 group-hover:text-slate-200'
          }`}>
            {algorithm.name}
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
            {algorithm.description}
          </p>
        </div>

        {/* Badges - minimal style */}
        <div className="flex flex-wrap gap-2 mb-3">
          <Badge 
            variant="secondary" 
            className={`px-2 py-0.5 text-xs font-normal ${
              isPlaying 
                ? 'bg-slate-700/80 text-slate-300 border-slate-600/50' 
                : 'bg-slate-800/80 text-slate-400 border-slate-700/50'
            }`}
          >
            {algorithm.category}
          </Badge>
          <Badge 
            variant="outline" 
            className={`px-2 py-0.5 text-xs font-mono ${
              isPlaying 
                ? 'border-slate-600/70 text-slate-400' 
                : 'border-slate-700/50 text-slate-500'
            }`}
          >
            {algorithm.complexity}
          </Badge>
        </div>

        {/* Simple play button */}
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-full bg-gradient-to-r ${algorithm.color} opacity-60 group-hover:opacity-75 transition-all duration-200 flex items-center justify-center`}>
            {isPlaying ? (
              <Pause className="w-3.5 h-3.5 text-white" />
            ) : (
              <Play className="w-3.5 h-3.5 text-white ml-0.5" />
            )}
          </div>
          <div>
            <div className={`text-xs font-medium transition-colors ${
              isPlaying ? 'text-slate-300' : 'text-slate-400'
            }`}>
              {isPlaying ? 'Playing' : 'Ready'}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};
