import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Pause, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { SortingAlgorithm } from "@/utils/audioGenerator";

interface AlgorithmCardProps {
  algorithm: SortingAlgorithm;
  isPlaying: boolean;
  onPlay: () => void;
  onStop: () => void;
}

export const AlgorithmCard = ({ algorithm, isPlaying, onPlay, onStop }: AlgorithmCardProps) => {
  return (
    <Card className="group relative overflow-hidden bg-gradient-card backdrop-blur-md border-border/50 hover:border-primary/50 transition-all duration-300 hover:shadow-glow-primary hover:-translate-y-1">
      <div className={`absolute inset-0 bg-gradient-to-br ${algorithm.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
      
      <div className="relative p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-xl font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
              {algorithm.name}
            </h3>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {algorithm.description}
            </p>
          </div>
          
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0 text-muted-foreground hover:text-foreground"
          >
            <Info className="w-4 h-4" />
          </Button>
        </div>

        {/* Badges */}
        <div className="flex flex-wrap gap-2 mb-4">
          <Badge variant="secondary" className="text-xs">
            {algorithm.category}
          </Badge>
          <Badge variant="outline" className="text-xs font-mono">
            {algorithm.complexity}
          </Badge>
        </div>

        {/* Visualization Bars */}
        <div className="flex items-end gap-1 h-16 mb-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className={`flex-1 bg-gradient-to-t ${algorithm.color} rounded-sm transition-all duration-300 ${
                isPlaying ? 'animate-pulse' : ''
              }`}
              style={{
                height: `${20 + Math.random() * 80}%`,
                animationDelay: `${i * 0.1}s`,
              }}
            />
          ))}
        </div>

        {/* Play Button */}
        <Button
          onClick={isPlaying ? onStop : onPlay}
          className={`w-full group/btn ${
            isPlaying 
              ? 'bg-destructive hover:bg-destructive/90' 
              : 'bg-primary hover:bg-primary/90'
          } text-primary-foreground transition-all duration-300`}
        >
          {isPlaying ? (
            <>
              <Pause className="w-4 h-4 mr-2" />
              Stop
            </>
          ) : (
            <>
              <Play className="w-4 h-4 mr-2 group-hover/btn:translate-x-0.5 transition-transform" />
              Play
            </>
          )}
        </Button>
      </div>
    </Card>
  );
};
