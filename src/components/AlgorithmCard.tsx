import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Pause } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { SortingAlgorithm } from "@/utils/audioGenerator";

interface AlgorithmCardProps {
  algorithm: SortingAlgorithm;
  isPlaying: boolean;
  onPlay: () => void;
}

export const AlgorithmCard = ({ algorithm, isPlaying, onPlay }: AlgorithmCardProps) => {
  return (
    <Card 
      className={`group relative overflow-hidden backdrop-blur-lg transition-all duration-300 cursor-pointer border shadow-lg hover:shadow-2xl ${
        isPlaying 
          ? 'bg-slate-800/90 ring-2 ring-blue-400 scale-105 border-slate-600' 
          : 'bg-slate-900/80 hover:bg-slate-800/90 hover:scale-105 border-slate-700 hover:border-slate-600'
      }`} 
      onClick={onPlay}
    >
      {/* Gradient overlay */}
      <div className={`absolute inset-0 bg-gradient-to-br ${algorithm.color} opacity-10 group-hover:opacity-20 transition-opacity duration-300`} />
      
      {/* Playing indicator */}
      {isPlaying && (
        <div className="absolute top-4 right-4 z-10">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse animation-delay-100" />
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse animation-delay-200" />
          </div>
        </div>
      )}
      
      <div className="relative p-6">
        {/* Algorithm name */}
        <div className="mb-4">
          <h3 className={`text-xl font-bold mb-2 transition-colors ${
            isPlaying ? 'text-blue-400' : 'text-slate-200 group-hover:text-blue-400'
          }`}>
            {algorithm.name}
          </h3>
          <p className="text-sm text-slate-400 leading-relaxed line-clamp-2">
            {algorithm.description}
          </p>
        </div>

        {/* Badges */}
        <div className="flex flex-wrap gap-2 mb-4">
          <Badge 
            variant="secondary" 
            className={`px-3 py-1 text-xs font-medium ${
              isPlaying 
                ? 'bg-blue-900/70 text-blue-300 border-blue-700' 
                : 'bg-slate-800 text-slate-300 border-slate-600'
            }`}
          >
            {algorithm.category}
          </Badge>
          <Badge 
            variant="outline" 
            className={`px-3 py-1 text-xs font-mono ${
              isPlaying 
                ? 'border-blue-600 text-blue-300' 
                : 'border-slate-600 text-slate-400'
            }`}
          >
            {algorithm.complexity}
          </Badge>
        </div>

        {/* Play section */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-full bg-gradient-to-r ${algorithm.color} opacity-80 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center shadow-lg`}>
              {isPlaying ? (
                <Pause className="w-5 h-5 text-white" />
              ) : (
                <Play className="w-5 h-5 text-white ml-0.5" />
              )}
            </div>
            <div>
              <div className={`text-sm font-semibold transition-colors ${
                isPlaying ? 'text-blue-400' : 'text-slate-300'
              }`}>
                {isPlaying ? 'Now Playing' : 'Ready to Play'}
              </div>
              <div className="text-xs text-slate-400">
                Click to {isPlaying ? 'stop' : 'start'}
              </div>
            </div>
          </div>
          
          {isPlaying && (
            <div className="flex items-center gap-1">
              <div className="w-1 h-6 bg-blue-400 rounded-full animate-pulse" />
              <div className="w-1 h-4 bg-blue-300 rounded-full animate-pulse animation-delay-100" />
              <div className="w-1 h-8 bg-blue-500 rounded-full animate-pulse animation-delay-200" />
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};
