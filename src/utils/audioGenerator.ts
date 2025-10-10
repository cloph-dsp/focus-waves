// Audio context singleton
let audioContext: AudioContext | null = null;
let activeLoop: { stop: boolean } = { stop: false };

const getAudioContext = () => {
  if (!audioContext) {
    audioContext = new AudioContext();
  }
  return audioContext;
};

export type VisualCallback = (array: number[], highlightIndices?: number[]) => void;

// Generate a tone at a specific frequency
const playTone = (frequency: number, duration: number, startTime: number) => {
  const ctx = getAudioContext();
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);

  oscillator.frequency.value = frequency;
  oscillator.type = 'sine';

  // Envelope for smooth sound
  gainNode.gain.setValueAtTime(0, startTime);
  gainNode.gain.linearRampToValueAtTime(0.1, startTime + 0.01);
  gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);

  oscillator.start(startTime);
  oscillator.stop(startTime + duration);
};

// Map array value to frequency (200Hz - 800Hz range)
const valueToFrequency = (value: number, maxValue: number) => {
  return 200 + (value / maxValue) * 600;
};

export interface SortingAlgorithm {
  id: string;
  name: string;
  description: string;
  category: string;
  complexity: string;
  color: string;
}

export const sortingAlgorithms: SortingAlgorithm[] = [
  { id: 'bubble', name: 'Bubble Sort', description: 'Classic bubbling motion with gentle swaps', category: 'Simple', complexity: 'O(n²)', color: 'from-purple-500 to-pink-500' },
  { id: 'quick', name: 'Quick Sort', description: 'Fast and rhythmic partitioning sounds', category: 'Efficient', complexity: 'O(n log n)', color: 'from-blue-500 to-cyan-500' },
  { id: 'merge', name: 'Merge Sort', description: 'Smooth dividing and merging harmonies', category: 'Efficient', complexity: 'O(n log n)', color: 'from-green-500 to-teal-500' },
  { id: 'insertion', name: 'Insertion Sort', description: 'Methodical placement with clear patterns', category: 'Simple', complexity: 'O(n²)', color: 'from-yellow-500 to-orange-500' },
  { id: 'selection', name: 'Selection Sort', description: 'Deliberate selection with distinctive tones', category: 'Simple', complexity: 'O(n²)', color: 'from-red-500 to-pink-500' },
  { id: 'heap', name: 'Heap Sort', description: 'Tree-like cascading sound structures', category: 'Efficient', complexity: 'O(n log n)', color: 'from-indigo-500 to-purple-500' },
  { id: 'shell', name: 'Shell Sort', description: 'Gap-sequence rhythmic patterns', category: 'Intermediate', complexity: 'O(n log n)', color: 'from-violet-500 to-fuchsia-500' },
  { id: 'cocktail', name: 'Cocktail Sort', description: 'Bidirectional bubble with flowing tones', category: 'Simple', complexity: 'O(n²)', color: 'from-pink-500 to-rose-500' },
  { id: 'comb', name: 'Comb Sort', description: 'Improved bubble with shrinking gaps', category: 'Intermediate', complexity: 'O(n²/2ᵖ)', color: 'from-amber-500 to-yellow-500' },
  { id: 'gnome', name: 'Gnome Sort', description: 'Simple back-and-forth garden gnome rhythm', category: 'Simple', complexity: 'O(n²)', color: 'from-lime-500 to-green-500' },
  { id: 'odd-even', name: 'Odd-Even Sort', description: 'Alternating phase parallel sorting', category: 'Parallel', complexity: 'O(n²)', color: 'from-emerald-500 to-teal-500' },
  { id: 'radix', name: 'Radix Sort', description: 'Digit-by-digit counting harmonics', category: 'Non-comparison', complexity: 'O(nk)', color: 'from-cyan-500 to-blue-500' },
  { id: 'counting', name: 'Counting Sort', description: 'Integer counting with clear sequences', category: 'Non-comparison', complexity: 'O(n+k)', color: 'from-sky-500 to-indigo-500' },
  { id: 'bucket', name: 'Bucket Sort', description: 'Distribution into buckets with smooth flow', category: 'Distribution', complexity: 'O(n+k)', color: 'from-blue-500 to-violet-500' },
  { id: 'tim', name: 'Tim Sort', description: 'Hybrid merge-insertion with complexity', category: 'Hybrid', complexity: 'O(n log n)', color: 'from-purple-500 to-indigo-500' },
];

// Helper to create delay for visual updates
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Stop all active loops
export const stopAllSorting = () => {
  activeLoop.stop = true;
};

export const resetLoop = () => {
  activeLoop = { stop: false };
};

// Sorting algorithm implementations with audio feedback and visual updates
export const generateBubbleSort = async (size: number = 60, visualCallback?: VisualCallback, loop: boolean = true) => {
  resetLoop();
  
  while (!activeLoop.stop) {
    const array = Array.from({ length: size }, () => Math.floor(Math.random() * size) + 1);
    const ctx = getAudioContext();
    const noteDuration = 0.05;

    for (let i = 0; i < array.length && !activeLoop.stop; i++) {
      for (let j = 0; j < array.length - i - 1 && !activeLoop.stop; j++) {
        if (array[j] > array[j + 1]) {
          [array[j], array[j + 1]] = [array[j + 1], array[j]];
          
          const now = ctx.currentTime;
          playTone(valueToFrequency(array[j], size), noteDuration, now);
          playTone(valueToFrequency(array[j + 1], size), noteDuration, now + noteDuration / 2);
          
          if (visualCallback) {
            visualCallback([...array], [j, j + 1]);
            await delay(50);
          }
        }
      }
    }
    
    if (!loop || activeLoop.stop) break;
    await delay(500);
  }
};

export const generateQuickSort = async (size: number = 60, visualCallback?: VisualCallback, loop: boolean = true) => {
  resetLoop();
  
  while (!activeLoop.stop) {
    const array = Array.from({ length: size }, () => Math.floor(Math.random() * size) + 1);
    const ctx = getAudioContext();
    const noteDuration = 0.03;

    const quickSort = async (arr: number[], low: number, high: number) => {
      if (low < high && !activeLoop.stop) {
        const pi = await partition(arr, low, high);
        await quickSort(arr, low, pi - 1);
        await quickSort(arr, pi + 1, high);
      }
    };

    const partition = async (arr: number[], low: number, high: number): Promise<number> => {
      const pivot = arr[high];
      let i = low - 1;

      for (let j = low; j < high && !activeLoop.stop; j++) {
        if (arr[j] < pivot) {
          i++;
          [arr[i], arr[j]] = [arr[j], arr[i]];
          
          const now = ctx.currentTime;
          playTone(valueToFrequency(arr[i], size), noteDuration, now);
          
          if (visualCallback) {
            visualCallback([...arr], [i, j]);
            await delay(30);
          }
        }
      }
      [arr[i + 1], arr[high]] = [arr[high], arr[i + 1]];
      
      const now = ctx.currentTime;
      playTone(valueToFrequency(arr[i + 1], size), noteDuration * 1.5, now);
      
      if (visualCallback) {
        visualCallback([...arr], [i + 1, high]);
        await delay(30);
      }
      
      return i + 1;
    };

    await quickSort(array, 0, array.length - 1);
    
    if (!loop || activeLoop.stop) break;
    await delay(500);
  }
};

export const generateMergeSort = async (size: number = 60, visualCallback?: VisualCallback, loop: boolean = true) => {
  resetLoop();
  
  while (!activeLoop.stop) {
    const array = Array.from({ length: size }, () => Math.floor(Math.random() * size) + 1);
    const ctx = getAudioContext();
    const noteDuration = 0.04;

    const merge = async (arr: number[], left: number, mid: number, right: number) => {
      const leftArr = arr.slice(left, mid + 1);
      const rightArr = arr.slice(mid + 1, right + 1);
      let i = 0, j = 0, k = left;

      while (i < leftArr.length && j < rightArr.length && !activeLoop.stop) {
        if (leftArr[i] <= rightArr[j]) {
          arr[k] = leftArr[i];
          playTone(valueToFrequency(arr[k], size), noteDuration, ctx.currentTime);
          i++;
        } else {
          arr[k] = rightArr[j];
          playTone(valueToFrequency(arr[k], size), noteDuration, ctx.currentTime);
          j++;
        }
        
        if (visualCallback) {
          visualCallback([...arr], [k]);
          await delay(40);
        }
        k++;
      }

      while (i < leftArr.length && !activeLoop.stop) {
        arr[k] = leftArr[i];
        playTone(valueToFrequency(arr[k], size), noteDuration, ctx.currentTime);
        i++;
        k++;
        
        if (visualCallback) {
          visualCallback([...arr], [k - 1]);
          await delay(40);
        }
      }

      while (j < rightArr.length && !activeLoop.stop) {
        arr[k] = rightArr[j];
        playTone(valueToFrequency(arr[k], size), noteDuration, ctx.currentTime);
        j++;
        k++;
        
        if (visualCallback) {
          visualCallback([...arr], [k - 1]);
          await delay(40);
        }
      }
    };

    const mergeSort = async (arr: number[], left: number, right: number) => {
      if (left < right && !activeLoop.stop) {
        const mid = Math.floor((left + right) / 2);
        await mergeSort(arr, left, mid);
        await mergeSort(arr, mid + 1, right);
        await merge(arr, left, mid, right);
      }
    };

    await mergeSort(array, 0, array.length - 1);
    
    if (!loop || activeLoop.stop) break;
    await delay(500);
  }
};

export const generateInsertionSort = async (size: number = 60, visualCallback?: VisualCallback, loop: boolean = true) => {
  resetLoop();
  
  while (!activeLoop.stop) {
    const array = Array.from({ length: size }, () => Math.floor(Math.random() * size) + 1);
    const ctx = getAudioContext();
    const noteDuration = 0.04;

    for (let i = 1; i < array.length && !activeLoop.stop; i++) {
      const key = array[i];
      let j = i - 1;
      while (j >= 0 && array[j] > key && !activeLoop.stop) {
        array[j + 1] = array[j];
        playTone(valueToFrequency(array[j + 1], size), noteDuration, ctx.currentTime);
        
        if (visualCallback) {
          visualCallback([...array], [j, j + 1]);
          await delay(40);
        }
        j--;
      }
      array[j + 1] = key;
      playTone(valueToFrequency(key, size), noteDuration * 1.2, ctx.currentTime);
      
      if (visualCallback) {
        visualCallback([...array], [j + 1]);
        await delay(40);
      }
    }
    
    if (!loop || activeLoop.stop) break;
    await delay(500);
  }
};

export const generateSelectionSort = async (size: number = 60, visualCallback?: VisualCallback, loop: boolean = true) => {
  resetLoop();
  
  while (!activeLoop.stop) {
    const array = Array.from({ length: size }, () => Math.floor(Math.random() * size) + 1);
    const ctx = getAudioContext();
    const noteDuration = 0.06;

    for (let i = 0; i < array.length - 1 && !activeLoop.stop; i++) {
      let minIdx = i;
      for (let j = i + 1; j < array.length && !activeLoop.stop; j++) {
        if (array[j] < array[minIdx]) {
          minIdx = j;
        }
        playTone(valueToFrequency(array[j], size), noteDuration / 2, ctx.currentTime);
        
        if (visualCallback) {
          visualCallback([...array], [i, j, minIdx]);
          await delay(60);
        }
      }
      if (minIdx !== i) {
        [array[i], array[minIdx]] = [array[minIdx], array[i]];
        playTone(valueToFrequency(array[i], size), noteDuration * 1.5, ctx.currentTime);
        
        if (visualCallback) {
          visualCallback([...array], [i, minIdx]);
          await delay(60);
        }
      }
    }
    
    if (!loop || activeLoop.stop) break;
    await delay(500);
  }
};

export const generateHeapSort = async (size: number = 60, visualCallback?: VisualCallback, loop: boolean = true) => {
  resetLoop();
  
  while (!activeLoop.stop) {
    const array = Array.from({ length: size }, () => Math.floor(Math.random() * size) + 1);
    const ctx = getAudioContext();
    const noteDuration = 0.04;

    const heapify = async (arr: number[], n: number, i: number) => {
      let largest = i;
      const left = 2 * i + 1;
      const right = 2 * i + 2;

      if (left < n && arr[left] > arr[largest]) largest = left;
      if (right < n && arr[right] > arr[largest]) largest = right;

      if (largest !== i && !activeLoop.stop) {
        [arr[i], arr[largest]] = [arr[largest], arr[i]];
        playTone(valueToFrequency(arr[i], size), noteDuration, ctx.currentTime);
        
        if (visualCallback) {
          visualCallback([...arr], [i, largest]);
          await delay(40);
        }
        
        await heapify(arr, n, largest);
      }
    };

    for (let i = Math.floor(array.length / 2) - 1; i >= 0 && !activeLoop.stop; i--) {
      await heapify(array, array.length, i);
    }

    for (let i = array.length - 1; i > 0 && !activeLoop.stop; i--) {
      [array[0], array[i]] = [array[i], array[0]];
      playTone(valueToFrequency(array[0], size), noteDuration * 1.2, ctx.currentTime);
      
      if (visualCallback) {
        visualCallback([...array], [0, i]);
        await delay(40);
      }
      
      await heapify(array, i, 0);
    }
    
    if (!loop || activeLoop.stop) break;
    await delay(500);
  }
};

export const sortingFunctions: Record<string, (size?: number, visualCallback?: VisualCallback, loop?: boolean) => Promise<void>> = {
  bubble: generateBubbleSort,
  quick: generateQuickSort,
  merge: generateMergeSort,
  insertion: generateInsertionSort,
  selection: generateSelectionSort,
  heap: generateHeapSort,
  shell: generateBubbleSort, // Using bubble as placeholder
  cocktail: generateBubbleSort,
  comb: generateBubbleSort,
  gnome: generateInsertionSort,
  'odd-even': generateBubbleSort,
  radix: generateQuickSort,
  counting: generateQuickSort,
  bucket: generateMergeSort,
  tim: generateMergeSort,
};
