import { useRef } from "react";
import { Hero } from "@/components/Hero";
import { AlgorithmGrid } from "@/components/AlgorithmGrid";

const Index = () => {
  const algorithmGridRef = useRef<HTMLDivElement>(null);

  const scrollToAlgorithms = () => {
    algorithmGridRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <main className="min-h-screen bg-gradient-hero">
      <Hero onExplore={scrollToAlgorithms} />
      <div ref={algorithmGridRef}>
        <AlgorithmGrid />
      </div>
    </main>
  );
};

export default Index;
