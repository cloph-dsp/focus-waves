export type VisualCallback = (array: number[], highlightIndices?: number[]) => void;

export type SortingGenerator = (
  size?: number,
  visualCallback?: VisualCallback,
  loop?: boolean
) => Promise<void>;

export interface SortingRunOptions {
  id: string;
  size?: number;
  visualCallback?: VisualCallback;
  loop?: boolean;
  signal?: AbortSignal;
}

export interface SortingAlgorithm {
  id: string;
  name: string;
  description: string;
  category: string;
  complexity: string;
  color: string;
}
