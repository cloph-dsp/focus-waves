import { Button } from "@/components/ui/button";
import { Volume2 } from "lucide-react";
import heroImage from "@/assets/hero-bg.jpg";

interface HeroProps {
  onExplore: () => void;
}

export const Hero = ({ onExplore }: HeroProps) => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image with Overlay */}
      <div 
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `url(${heroImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 text-center">
        <div className="animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-card/50 backdrop-blur-sm border border-primary/30 mb-8">
            <Volume2 className="w-4 h-4 text-primary" />
            <span className="text-sm text-muted-foreground">Audio-Based Algorithm Visualization</span>
          </div>

          <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold mb-6 bg-gradient-primary bg-clip-text text-transparent leading-tight">
            Sort Your Mind
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-2xl mx-auto leading-relaxed">
            Experience the soothing sounds of 100+ sorting algorithms.
            <br />
            <span className="text-foreground">Perfect for sleep, study, or meditation.</span>
          </p>

          <Button 
            onClick={onExplore}
            size="lg"
            className="group relative overflow-hidden bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-6 text-lg rounded-full transition-all duration-300 hover:shadow-glow-primary hover:scale-105"
          >
            <span className="relative z-10 flex items-center gap-2">
              Explore Algorithms
              <Volume2 className="w-5 h-5 group-hover:animate-pulse" />
            </span>
          </Button>
        </div>
      </div>

      {/* Floating Elements */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/10 rounded-full blur-3xl animate-glow-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/10 rounded-full blur-3xl animate-glow-pulse" style={{ animationDelay: '1s' }} />
      </div>
    </section>
  );
};
