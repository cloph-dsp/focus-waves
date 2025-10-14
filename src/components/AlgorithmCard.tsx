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
    <Card className={`group relative overflow-hidden backdrop-blur-md transition-all duration-200 cursor-pointer ${
      isPlaying 
        ? 'bg-primary/20 border-primary shadow-glow-primary' 
        : 'bg-gradient-card border-border/50 hover:border-primary/50 hover:-translate-y-0.5'
    }`} onClick={onPlay}>
      <div className={`absolute inset-0 bg-gradient-to-br ${algorithm.color} opacity-0 group-hover:opacity-10 transition-opacity duration-200`} />
      
      <div className="relative p-2.5">
        <div className="flex items-start justify-between gap-1.5">
          <div className="flex-1 min-w-0">
            <h3 className={`text-xs font-semibold mb-1.5 transition-colors line-clamp-1 ${
              isPlaying ? 'text-primary' : 'text-foreground group-hover:text-primary'
            }`}>
              {algorithm.name}
            </h3>
            <div className="flex flex-col gap-1">
              <Badge variant="secondary" className="text-[10px] py-0 px-1.5 w-fit">
                {algorithm.category}
              </Badge>
              <Badge variant="outline" className="text-[10px] font-mono py-0 px-1.5 w-fit">
                {algorithm.complexity}
              </Badge>
            </div>
          </div>
          {isPlaying && (
            <div className="flex-shrink-0">
              <Pause className="w-4 h-4 text-primary animate-pulse" />
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};
