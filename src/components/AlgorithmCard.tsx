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
    <Card className={`group relative overflow-hidden backdrop-blur-xl transition-fast cursor-pointer ${
      isPlaying 
        ? 'bg-primary/25 border-primary/70 shadow-glow-subtle scale-[0.98]' 
        : 'bg-gradient-card border-border/40 hover:border-primary/60 hover:shadow-glow-subtle hover:scale-[1.01]'
    }`} onClick={onPlay}>
      <div className={`absolute inset-0 bg-gradient-to-br ${algorithm.color} opacity-0 group-hover:opacity-15 transition-opacity duration-300`} />
      
      <div className="relative p-1.5">
        <div className="flex items-start justify-between gap-1">
          <div className="flex-1 min-w-0">
            <h3 className={`text-[9px] font-bold mb-0.5 transition-fast line-clamp-2 leading-tight tracking-wide ${
              isPlaying ? 'text-primary' : 'text-foreground/90 group-hover:text-primary'
            }`}>
              {algorithm.name}
            </h3>
            <div className="flex flex-wrap gap-0.5">
              <Badge variant="secondary" className="text-[7px] py-0 px-0.5 w-fit h-3 leading-none">
                {algorithm.category}
              </Badge>
              <Badge variant="outline" className="text-[7px] font-mono py-0 px-0.5 w-fit h-3 leading-none">
                {algorithm.complexity}
              </Badge>
            </div>
          </div>
          {isPlaying && (
            <div className="flex-shrink-0 mt-0.5">
              <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};
