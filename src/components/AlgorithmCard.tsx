import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Pause, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import type { SortingAlgorithm } from "@/utils/audioGenerator";

interface AlgorithmCardProps {
  algorithm: SortingAlgorithm;
  isPlaying: boolean;
  onPlay: () => void;
}

export const AlgorithmCard = ({ algorithm, isPlaying, onPlay }: AlgorithmCardProps) => {
  return (
    <Card className={`group relative overflow-hidden backdrop-blur-md transition-all duration-300 cursor-pointer ${
      isPlaying 
        ? 'bg-primary/20 border-primary shadow-glow-primary' 
        : 'bg-gradient-card border-border/50 hover:border-primary/50 hover:-translate-y-0.5'
    }`} onClick={onPlay}>
      <div className={`absolute inset-0 bg-gradient-to-br ${algorithm.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
      
      <div className="relative p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h3 className={`text-sm font-semibold mb-1 transition-colors ${
              isPlaying ? 'text-primary' : 'text-foreground group-hover:text-primary'
            }`}>
              {algorithm.name}
            </h3>
            <div className="flex gap-2">
              <Badge variant="secondary" className="text-xs">
                {algorithm.category}
              </Badge>
              <Badge variant="outline" className="text-xs font-mono">
                {algorithm.complexity}
              </Badge>
            </div>
          </div>
          {isPlaying && (
            <div className="ml-2">
              <Pause className="w-5 h-5 text-primary animate-pulse" />
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};
