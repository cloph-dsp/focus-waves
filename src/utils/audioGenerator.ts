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

// Play the sorted array as a satisfying ascending scale
const playSortedArray = async (array: number[], size: number, visualCallback?: VisualCallback) => {
  const ctx = getAudioContext();
  const noteDuration = 0.03;
  
  for (let i = 0; i < array.length && !activeLoop.stop; i++) {
    playTone(valueToFrequency(array[i], size), noteDuration, ctx.currentTime);
    
    if (visualCallback) {
      visualCallback([...array], [i]);
      await delay(15);
    }
  }
  
  await delay(300);
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
  { id: 'bogo', name: 'Bogo Sort', description: 'Chaotic random shuffling until sorted', category: 'Chaos', complexity: 'O((n+1)!)', color: 'from-red-500 to-orange-500' },
  { id: 'bitonic', name: 'Bitonic Sort', description: 'Parallel network with symmetrical patterns', category: 'Parallel', complexity: 'O(log²n)', color: 'from-teal-500 to-cyan-500' },
  { id: 'cycle', name: 'Cycle Sort', description: 'Minimal writes with deliberate placement', category: 'Optimization', complexity: 'O(n²)', color: 'from-green-500 to-emerald-500' },
  { id: 'pancake', name: 'Pancake Sort', description: 'Flipping subarrays creates unique rhythms', category: 'Flip', complexity: 'O(n²)', color: 'from-amber-500 to-orange-500' },
  { id: 'stooge', name: 'Stooge Sort', description: 'Recursive silly pattern with overlaps', category: 'Recursive', complexity: 'O(n^2.7)', color: 'from-pink-500 to-purple-500' },
  { id: 'bead', name: 'Bead Sort', description: 'Gravity simulation with cascading falls', category: 'Physics', complexity: 'O(n) or O(S)', color: 'from-stone-500 to-zinc-500' },
  { id: 'slow', name: 'Slow Sort', description: 'Deliberately inefficient multiply-and-surrender', category: 'Silly', complexity: 'Ω(n^(log n / 2))', color: 'from-slate-500 to-gray-500' },
  { id: 'bogobogo', name: 'Bogobogo Sort', description: 'Extreme chaos - bogo sort recursively', category: 'Chaos', complexity: 'O(∞)', color: 'from-rose-500 to-red-500' },
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
    
    await playSortedArray(array, size, visualCallback);
    
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
    
    await playSortedArray(array, size, visualCallback);
    
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
    
    await playSortedArray(array, size, visualCallback);
    
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
    
    await playSortedArray(array, size, visualCallback);
    
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
    
    await playSortedArray(array, size, visualCallback);
    
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
    
    await playSortedArray(array, size, visualCallback);
    
    if (!loop || activeLoop.stop) break;
    await delay(500);
  }
};

// Shell Sort - Gap sequence creates rhythmic patterns
export const generateShellSort = async (size: number = 60, visualCallback?: VisualCallback, loop: boolean = true) => {
  resetLoop();
  
  while (!activeLoop.stop) {
    const array = Array.from({ length: size }, () => Math.floor(Math.random() * size) + 1);
    const ctx = getAudioContext();
    const noteDuration = 0.04;

    for (let gap = Math.floor(array.length / 2); gap > 0 && !activeLoop.stop; gap = Math.floor(gap / 2)) {
      for (let i = gap; i < array.length && !activeLoop.stop; i++) {
        const temp = array[i];
        let j = i;
        
        while (j >= gap && array[j - gap] > temp && !activeLoop.stop) {
          array[j] = array[j - gap];
          playTone(valueToFrequency(array[j], size), noteDuration, ctx.currentTime);
          
          if (visualCallback) {
            visualCallback([...array], [j, j - gap]);
            await delay(35);
          }
          j -= gap;
        }
        array[j] = temp;
      }
    }
    
    await playSortedArray(array, size, visualCallback);
    
    if (!loop || activeLoop.stop) break;
    await delay(500);
  }
};

// Cocktail Sort - Bidirectional bubble creates flowing back-and-forth sounds
export const generateCocktailSort = async (size: number = 60, visualCallback?: VisualCallback, loop: boolean = true) => {
  resetLoop();
  
  while (!activeLoop.stop) {
    const array = Array.from({ length: size }, () => Math.floor(Math.random() * size) + 1);
    const ctx = getAudioContext();
    const noteDuration = 0.05;
    let swapped = true;
    let start = 0;
    let end = array.length - 1;

    while (swapped && !activeLoop.stop) {
      swapped = false;
      
      // Forward pass
      for (let i = start; i < end && !activeLoop.stop; i++) {
        if (array[i] > array[i + 1]) {
          [array[i], array[i + 1]] = [array[i + 1], array[i]];
          playTone(valueToFrequency(array[i], size), noteDuration, ctx.currentTime);
          swapped = true;
          
          if (visualCallback) {
            visualCallback([...array], [i, i + 1]);
            await delay(45);
          }
        }
      }
      end--;
      
      if (!swapped || activeLoop.stop) break;
      swapped = false;
      
      // Backward pass
      for (let i = end - 1; i >= start && !activeLoop.stop; i--) {
        if (array[i] > array[i + 1]) {
          [array[i], array[i + 1]] = [array[i + 1], array[i]];
          playTone(valueToFrequency(array[i + 1], size), noteDuration, ctx.currentTime);
          swapped = true;
          
          if (visualCallback) {
            visualCallback([...array], [i, i + 1]);
            await delay(45);
          }
        }
      }
      start++;
    }
    
    await playSortedArray(array, size, visualCallback);
    
    if (!loop || activeLoop.stop) break;
    await delay(500);
  }
};

// Comb Sort - Shrinking gaps create interesting pitch patterns
export const generateCombSort = async (size: number = 60, visualCallback?: VisualCallback, loop: boolean = true) => {
  resetLoop();
  
  while (!activeLoop.stop) {
    const array = Array.from({ length: size }, () => Math.floor(Math.random() * size) + 1);
    const ctx = getAudioContext();
    const noteDuration = 0.04;
    const shrink = 1.3;
    let gap = array.length;
    let sorted = false;

    while (!sorted && !activeLoop.stop) {
      gap = Math.floor(gap / shrink);
      if (gap <= 1) {
        gap = 1;
        sorted = true;
      }

      for (let i = 0; i + gap < array.length && !activeLoop.stop; i++) {
        if (array[i] > array[i + gap]) {
          [array[i], array[i + gap]] = [array[i + gap], array[i]];
          playTone(valueToFrequency(array[i], size), noteDuration, ctx.currentTime);
          sorted = false;
          
          if (visualCallback) {
            visualCallback([...array], [i, i + gap]);
            await delay(30);
          }
        }
      }
    }
    
    await playSortedArray(array, size, visualCallback);
    
    if (!loop || activeLoop.stop) break;
    await delay(500);
  }
};

// Gnome Sort - Simple back-and-forth creates a unique rhythm
export const generateGnomeSort = async (size: number = 60, visualCallback?: VisualCallback, loop: boolean = true) => {
  resetLoop();
  
  while (!activeLoop.stop) {
    const array = Array.from({ length: size }, () => Math.floor(Math.random() * size) + 1);
    const ctx = getAudioContext();
    const noteDuration = 0.05;
    let i = 0;

    while (i < array.length && !activeLoop.stop) {
      if (i === 0 || array[i] >= array[i - 1]) {
        playTone(valueToFrequency(array[i], size), noteDuration / 2, ctx.currentTime);
        i++;
      } else {
        [array[i], array[i - 1]] = [array[i - 1], array[i]];
        playTone(valueToFrequency(array[i - 1], size), noteDuration, ctx.currentTime);
        
        if (visualCallback) {
          visualCallback([...array], [i, i - 1]);
          await delay(40);
        }
        i--;
      }
    }
    
    await playSortedArray(array, size, visualCallback);
    
    if (!loop || activeLoop.stop) break;
    await delay(500);
  }
};

// Odd-Even Sort - Alternating phases create distinct patterns
export const generateOddEvenSort = async (size: number = 60, visualCallback?: VisualCallback, loop: boolean = true) => {
  resetLoop();
  
  while (!activeLoop.stop) {
    const array = Array.from({ length: size }, () => Math.floor(Math.random() * size) + 1);
    const ctx = getAudioContext();
    const noteDuration = 0.04;
    let sorted = false;

    while (!sorted && !activeLoop.stop) {
      sorted = true;
      
      // Odd phase
      for (let i = 1; i < array.length - 1 && !activeLoop.stop; i += 2) {
        if (array[i] > array[i + 1]) {
          [array[i], array[i + 1]] = [array[i + 1], array[i]];
          playTone(valueToFrequency(array[i], size), noteDuration, ctx.currentTime);
          sorted = false;
          
          if (visualCallback) {
            visualCallback([...array], [i, i + 1]);
            await delay(35);
          }
        }
      }
      
      // Even phase
      for (let i = 0; i < array.length - 1 && !activeLoop.stop; i += 2) {
        if (array[i] > array[i + 1]) {
          [array[i], array[i + 1]] = [array[i + 1], array[i]];
          playTone(valueToFrequency(array[i + 1], size), noteDuration, ctx.currentTime);
          sorted = false;
          
          if (visualCallback) {
            visualCallback([...array], [i, i + 1]);
            await delay(35);
          }
        }
      }
    }
    
    await playSortedArray(array, size, visualCallback);
    
    if (!loop || activeLoop.stop) break;
    await delay(500);
  }
};

// Radix Sort - Digit processing creates layered harmonic patterns
export const generateRadixSort = async (size: number = 60, visualCallback?: VisualCallback, loop: boolean = true) => {
  resetLoop();
  
  while (!activeLoop.stop) {
    const array = Array.from({ length: size }, () => Math.floor(Math.random() * size) + 1);
    const ctx = getAudioContext();
    const noteDuration = 0.03;
    
    const getMax = (arr: number[]) => Math.max(...arr);
    
    const countingSort = async (arr: number[], exp: number) => {
      const output = new Array(arr.length);
      const count = new Array(10).fill(0);
      
      for (let i = 0; i < arr.length; i++) {
        const digit = Math.floor(arr[i] / exp) % 10;
        count[digit]++;
      }
      
      for (let i = 1; i < 10; i++) {
        count[i] += count[i - 1];
      }
      
      for (let i = arr.length - 1; i >= 0 && !activeLoop.stop; i--) {
        const digit = Math.floor(arr[i] / exp) % 10;
        output[count[digit] - 1] = arr[i];
        playTone(valueToFrequency(arr[i], size), noteDuration, ctx.currentTime);
        count[digit]--;
        
        if (visualCallback) {
          const tempArr = [...arr];
          for (let j = 0; j < output.length; j++) {
            if (output[j] !== undefined) tempArr[j] = output[j];
          }
          visualCallback(tempArr, [i]);
          await delay(25);
        }
      }
      
      for (let i = 0; i < arr.length; i++) {
        arr[i] = output[i];
      }
    };
    
    const max = getMax(array);
    for (let exp = 1; Math.floor(max / exp) > 0 && !activeLoop.stop; exp *= 10) {
      await countingSort(array, exp);
    }
    
    await playSortedArray(array, size, visualCallback);
    
    if (!loop || activeLoop.stop) break;
    await delay(500);
  }
};

// Counting Sort - Integer counting creates clear sequential tones
export const generateCountingSort = async (size: number = 60, visualCallback?: VisualCallback, loop: boolean = true) => {
  resetLoop();
  
  while (!activeLoop.stop) {
    const array = Array.from({ length: size }, () => Math.floor(Math.random() * size) + 1);
    const ctx = getAudioContext();
    const noteDuration = 0.04;
    
    const max = Math.max(...array);
    const count = new Array(max + 1).fill(0);
    
    for (let i = 0; i < array.length && !activeLoop.stop; i++) {
      count[array[i]]++;
    }
    
    let index = 0;
    for (let i = 0; i <= max && !activeLoop.stop; i++) {
      while (count[i] > 0 && !activeLoop.stop) {
        array[index] = i;
        playTone(valueToFrequency(i, size), noteDuration, ctx.currentTime);
        
        if (visualCallback) {
          visualCallback([...array], [index]);
          await delay(30);
        }
        
        index++;
        count[i]--;
      }
    }
    
    await playSortedArray(array, size, visualCallback);
    
    if (!loop || activeLoop.stop) break;
    await delay(500);
  }
};

// Bucket Sort - Distribution creates smooth flowing sounds
export const generateBucketSort = async (size: number = 60, visualCallback?: VisualCallback, loop: boolean = true) => {
  resetLoop();
  
  while (!activeLoop.stop) {
    const array = Array.from({ length: size }, () => Math.floor(Math.random() * size) + 1);
    const ctx = getAudioContext();
    const noteDuration = 0.04;
    
    const bucketCount = 10;
    const buckets: number[][] = Array.from({ length: bucketCount }, () => []);
    const max = Math.max(...array);
    
    // Distribute into buckets
    for (let i = 0; i < array.length && !activeLoop.stop; i++) {
      const bucketIndex = Math.min(Math.floor((array[i] / max) * (bucketCount - 1)), bucketCount - 1);
      buckets[bucketIndex].push(array[i]);
      playTone(valueToFrequency(array[i], size), noteDuration / 2, ctx.currentTime);
    }
    
    // Sort each bucket and place back
    let index = 0;
    for (let i = 0; i < bucketCount && !activeLoop.stop; i++) {
      buckets[i].sort((a, b) => a - b);
      for (let j = 0; j < buckets[i].length && !activeLoop.stop; j++) {
        array[index] = buckets[i][j];
        playTone(valueToFrequency(array[index], size), noteDuration, ctx.currentTime);
        
        if (visualCallback) {
          visualCallback([...array], [index]);
          await delay(35);
        }
        index++;
      }
    }
    
    await playSortedArray(array, size, visualCallback);
    
    if (!loop || activeLoop.stop) break;
    await delay(500);
  }
};

// Tim Sort - Hybrid approach creates complex layered patterns
export const generateTimSort = async (size: number = 60, visualCallback?: VisualCallback, loop: boolean = true) => {
  resetLoop();
  
  while (!activeLoop.stop) {
    const array = Array.from({ length: size }, () => Math.floor(Math.random() * size) + 1);
    const ctx = getAudioContext();
    const noteDuration = 0.03;
    const RUN = 32;
    
    // Insertion sort for small runs
    const insertionSort = async (arr: number[], left: number, right: number) => {
      for (let i = left + 1; i <= right && !activeLoop.stop; i++) {
        const temp = arr[i];
        let j = i - 1;
        while (j >= left && arr[j] > temp && !activeLoop.stop) {
          arr[j + 1] = arr[j];
          playTone(valueToFrequency(arr[j + 1], size), noteDuration, ctx.currentTime);
          
          if (visualCallback) {
            visualCallback([...arr], [j, j + 1]);
            await delay(25);
          }
          j--;
        }
        arr[j + 1] = temp;
      }
    };
    
    // Merge function
    const merge = async (arr: number[], l: number, m: number, r: number) => {
      const len1 = m - l + 1;
      const len2 = r - m;
      const left = arr.slice(l, m + 1);
      const right = arr.slice(m + 1, r + 1);
      
      let i = 0, j = 0, k = l;
      
      while (i < len1 && j < len2 && !activeLoop.stop) {
        if (left[i] <= right[j]) {
          arr[k] = left[i];
          i++;
        } else {
          arr[k] = right[j];
          j++;
        }
        playTone(valueToFrequency(arr[k], size), noteDuration, ctx.currentTime);
        
        if (visualCallback) {
          visualCallback([...arr], [k]);
          await delay(25);
        }
        k++;
      }
      
      while (i < len1 && !activeLoop.stop) {
        arr[k] = left[i];
        i++;
        k++;
      }
      
      while (j < len2 && !activeLoop.stop) {
        arr[k] = right[j];
        j++;
        k++;
      }
    };
    
    // Sort individual runs
    for (let i = 0; i < array.length && !activeLoop.stop; i += RUN) {
      await insertionSort(array, i, Math.min(i + RUN - 1, array.length - 1));
    }
    
    // Merge runs
    for (let runSize = RUN; runSize < array.length && !activeLoop.stop; runSize *= 2) {
      for (let left = 0; left < array.length && !activeLoop.stop; left += runSize * 2) {
        const mid = left + runSize - 1;
        const right = Math.min(left + runSize * 2 - 1, array.length - 1);
        
        if (mid < right) {
          await merge(array, left, mid, right);
        }
      }
    }
    
    await playSortedArray(array, size, visualCallback);
    
    if (!loop || activeLoop.stop) break;
    await delay(500);
  }
};

// Bogo Sort - Completely random chaos
export const generateBogoSort = async (size: number = 60, visualCallback?: VisualCallback, loop: boolean = true) => {
  resetLoop();
  
  while (!activeLoop.stop) {
    const array = Array.from({ length: size }, () => Math.floor(Math.random() * size) + 1);
    const ctx = getAudioContext();
    const noteDuration = 0.02;
    
    const isSorted = (arr: number[]) => {
      for (let i = 0; i < arr.length - 1; i++) {
        if (arr[i] > arr[i + 1]) return false;
      }
      return true;
    };
    
    const shuffle = async (arr: number[]) => {
      for (let i = arr.length - 1; i > 0 && !activeLoop.stop; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
        playTone(valueToFrequency(arr[i], size), noteDuration, ctx.currentTime);
        
        if (visualCallback) {
          visualCallback([...arr], [i, j]);
          await delay(20);
        }
      }
    };
    
    while (!isSorted(array) && !activeLoop.stop) {
      await shuffle(array);
    }
    
    await playSortedArray(array, size, visualCallback);
    
    if (!loop || activeLoop.stop) break;
    await delay(500);
  }
};

// Bitonic Sort - Parallel sorting network with beautiful symmetry
export const generateBitonicSort = async (size: number = 64, visualCallback?: VisualCallback, loop: boolean = true) => {
  resetLoop();
  
  while (!activeLoop.stop) {
    const paddedSize = Math.pow(2, Math.ceil(Math.log2(size)));
    const array = Array.from({ length: paddedSize }, (_, i) => 
      i < size ? Math.floor(Math.random() * size) + 1 : 0
    );
    const ctx = getAudioContext();
    const noteDuration = 0.03;
    
    const compAndSwap = async (arr: number[], i: number, j: number, dir: boolean) => {
      if ((arr[i] > arr[j] && dir) || (arr[i] < arr[j] && !dir)) {
        [arr[i], arr[j]] = [arr[j], arr[i]];
        playTone(valueToFrequency(arr[i], size), noteDuration, ctx.currentTime);
        
        if (visualCallback) {
          visualCallback([...arr].slice(0, size), [i, j]);
          await delay(25);
        }
      }
    };
    
    const bitonicMerge = async (arr: number[], low: number, cnt: number, dir: boolean) => {
      if (cnt > 1 && !activeLoop.stop) {
        const k = Math.floor(cnt / 2);
        for (let i = low; i < low + k && !activeLoop.stop; i++) {
          await compAndSwap(arr, i, i + k, dir);
        }
        await bitonicMerge(arr, low, k, dir);
        await bitonicMerge(arr, low + k, k, dir);
      }
    };
    
    const bitonicSort = async (arr: number[], low: number, cnt: number, dir: boolean) => {
      if (cnt > 1 && !activeLoop.stop) {
        const k = Math.floor(cnt / 2);
        await bitonicSort(arr, low, k, true);
        await bitonicSort(arr, low + k, k, false);
        await bitonicMerge(arr, low, cnt, dir);
      }
    };
    
    await bitonicSort(array, 0, paddedSize, true);
    
    await playSortedArray(array.slice(0, size), size, visualCallback);
    
    if (!loop || activeLoop.stop) break;
    await delay(500);
  }
};

// Cycle Sort - Minimal writes with intentional placement
export const generateCycleSort = async (size: number = 60, visualCallback?: VisualCallback, loop: boolean = true) => {
  resetLoop();
  
  while (!activeLoop.stop) {
    const array = Array.from({ length: size }, () => Math.floor(Math.random() * size) + 1);
    const ctx = getAudioContext();
    const noteDuration = 0.05;
    
    for (let cycleStart = 0; cycleStart < array.length - 1 && !activeLoop.stop; cycleStart++) {
      let item = array[cycleStart];
      let pos = cycleStart;
      
      for (let i = cycleStart + 1; i < array.length; i++) {
        if (array[i] < item) pos++;
      }
      
      if (pos === cycleStart) continue;
      
      while (item === array[pos]) pos++;
      
      [item, array[pos]] = [array[pos], item];
      playTone(valueToFrequency(array[pos], size), noteDuration, ctx.currentTime);
      
      if (visualCallback) {
        visualCallback([...array], [cycleStart, pos]);
        await delay(60);
      }
      
      while (pos !== cycleStart && !activeLoop.stop) {
        pos = cycleStart;
        for (let i = cycleStart + 1; i < array.length; i++) {
          if (array[i] < item) pos++;
        }
        
        while (item === array[pos]) pos++;
        
        [item, array[pos]] = [array[pos], item];
        playTone(valueToFrequency(array[pos], size), noteDuration, ctx.currentTime);
        
        if (visualCallback) {
          visualCallback([...array], [pos]);
          await delay(60);
        }
      }
    }
    
    await playSortedArray(array, size, visualCallback);
    
    if (!loop || activeLoop.stop) break;
    await delay(500);
  }
};

// Pancake Sort - Flipping creates unique audio patterns
export const generatePancakeSort = async (size: number = 60, visualCallback?: VisualCallback, loop: boolean = true) => {
  resetLoop();
  
  while (!activeLoop.stop) {
    const array = Array.from({ length: size }, () => Math.floor(Math.random() * size) + 1);
    const ctx = getAudioContext();
    const noteDuration = 0.03;
    
    const flip = async (arr: number[], k: number) => {
      let left = 0;
      while (left < k && !activeLoop.stop) {
        [arr[left], arr[k]] = [arr[k], arr[left]];
        playTone(valueToFrequency(arr[left], size), noteDuration, ctx.currentTime);
        playTone(valueToFrequency(arr[k], size), noteDuration, ctx.currentTime + noteDuration / 2);
        
        if (visualCallback) {
          visualCallback([...arr], [left, k]);
          await delay(25);
        }
        left++;
        k--;
      }
    };
    
    const findMax = (arr: number[], n: number) => {
      let maxIdx = 0;
      for (let i = 0; i < n; i++) {
        if (arr[i] > arr[maxIdx]) maxIdx = i;
      }
      return maxIdx;
    };
    
    for (let currSize = array.length; currSize > 1 && !activeLoop.stop; currSize--) {
      const maxIdx = findMax(array, currSize);
      
      if (maxIdx !== currSize - 1) {
        if (maxIdx !== 0) {
          await flip(array, maxIdx);
        }
        await flip(array, currSize - 1);
      }
    }
    
    await playSortedArray(array, size, visualCallback);
    
    if (!loop || activeLoop.stop) break;
    await delay(500);
  }
};

// Stooge Sort - Silly recursive pattern
export const generateStoogeSort = async (size: number = 40, visualCallback?: VisualCallback, loop: boolean = true) => {
  resetLoop();
  
  while (!activeLoop.stop) {
    const array = Array.from({ length: size }, () => Math.floor(Math.random() * size) + 1);
    const ctx = getAudioContext();
    const noteDuration = 0.04;
    
    const stoogeSort = async (arr: number[], l: number, h: number) => {
      if (l >= h || activeLoop.stop) return;
      
      if (arr[l] > arr[h]) {
        [arr[l], arr[h]] = [arr[h], arr[l]];
        playTone(valueToFrequency(arr[l], size), noteDuration, ctx.currentTime);
        
        if (visualCallback) {
          visualCallback([...arr], [l, h]);
          await delay(35);
        }
      }
      
      if (h - l + 1 > 2) {
        const t = Math.floor((h - l + 1) / 3);
        await stoogeSort(arr, l, h - t);
        await stoogeSort(arr, l + t, h);
        await stoogeSort(arr, l, h - t);
      }
    };
    
    await stoogeSort(array, 0, array.length - 1);
    
    await playSortedArray(array, size, visualCallback);
    
    if (!loop || activeLoop.stop) break;
    await delay(500);
  }
};

// Bead Sort - Gravity simulation (positive integers only)
export const generateBeadSort = async (size: number = 60, visualCallback?: VisualCallback, loop: boolean = true) => {
  resetLoop();
  
  while (!activeLoop.stop) {
    const array = Array.from({ length: size }, () => Math.floor(Math.random() * size) + 1);
    const ctx = getAudioContext();
    const noteDuration = 0.02;
    
    const max = Math.max(...array);
    const beads: boolean[][] = Array.from({ length: array.length }, () => 
      Array(max).fill(false)
    );
    
    // Setup beads
    for (let i = 0; i < array.length; i++) {
      for (let j = 0; j < array[i]; j++) {
        beads[i][j] = true;
      }
    }
    
    // Let beads fall (gravity)
    for (let j = 0; j < max && !activeLoop.stop; j++) {
      let sum = 0;
      for (let i = 0; i < array.length; i++) {
        sum += beads[i][j] ? 1 : 0;
        beads[i][j] = false;
      }
      
      for (let i = array.length - sum; i < array.length && !activeLoop.stop; i++) {
        beads[i][j] = true;
        
        // Count current value for this row
        let currentValue = 0;
        for (let k = 0; k < max; k++) {
          if (beads[i][k]) currentValue++;
        }
        
        array[i] = currentValue;
        playTone(valueToFrequency(currentValue || 1, size), noteDuration, ctx.currentTime);
        
        if (visualCallback) {
          visualCallback([...array], [i]);
          await delay(15);
        }
      }
    }
    
    await playSortedArray(array, size, visualCallback);
    
    if (!loop || activeLoop.stop) break;
    await delay(500);
  }
};

// Slow Sort - Deliberately inefficient multiply-and-surrender
export const generateSlowSort = async (size: number = 30, visualCallback?: VisualCallback, loop: boolean = true) => {
  resetLoop();
  
  while (!activeLoop.stop) {
    const array = Array.from({ length: size }, () => Math.floor(Math.random() * size) + 1);
    const ctx = getAudioContext();
    const noteDuration = 0.05;
    
    const slowSort = async (arr: number[], i: number, j: number) => {
      if (i >= j || activeLoop.stop) return;
      
      const m = Math.floor((i + j) / 2);
      await slowSort(arr, i, m);
      await slowSort(arr, m + 1, j);
      
      if (arr[m] > arr[j]) {
        [arr[m], arr[j]] = [arr[j], arr[m]];
        playTone(valueToFrequency(arr[j], size), noteDuration, ctx.currentTime);
        
        if (visualCallback) {
          visualCallback([...arr], [m, j]);
          await delay(50);
        }
      }
      
      await slowSort(arr, i, j - 1);
    };
    
    await slowSort(array, 0, array.length - 1);
    
    await playSortedArray(array, size, visualCallback);
    
    if (!loop || activeLoop.stop) break;
    await delay(500);
  }
};

// Bogobogo Sort - Extreme chaos (limited iterations for sanity)
export const generateBogobogoSort = async (size: number = 20, visualCallback?: VisualCallback, loop: boolean = true) => {
  resetLoop();
  
  while (!activeLoop.stop) {
    const array = Array.from({ length: size }, () => Math.floor(Math.random() * size) + 1);
    const ctx = getAudioContext();
    const noteDuration = 0.02;
    let attempts = 0;
    const maxAttempts = 1000; // Safety limit
    
    const isSorted = (arr: number[], n: number) => {
      for (let i = 0; i < n - 1; i++) {
        if (arr[i] > arr[i + 1]) return false;
      }
      return true;
    };
    
    const shuffle = async (arr: number[], n: number) => {
      for (let i = n - 1; i > 0 && !activeLoop.stop; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
        playTone(valueToFrequency(arr[i], size), noteDuration, ctx.currentTime);
        
        if (visualCallback) {
          visualCallback([...arr], [i, j]);
          await delay(15);
        }
      }
    };
    
    const bogobogoSort = async (arr: number[], n: number): Promise<void> => {
      if (n <= 1 || activeLoop.stop || attempts >= maxAttempts) return;
      
      while (!isSorted(arr, n) && !activeLoop.stop && attempts < maxAttempts) {
        await bogobogoSort(arr, n - 1);
        await shuffle(arr, n);
        attempts++;
      }
    };
    
    await bogobogoSort(array, array.length);
    
    // Force sort if it didn't finish (for demo purposes)
    if (attempts >= maxAttempts) {
      array.sort((a, b) => a - b);
    }
    
    await playSortedArray(array, size, visualCallback);
    
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
  shell: generateShellSort,
  cocktail: generateCocktailSort,
  comb: generateCombSort,
  gnome: generateGnomeSort,
  'odd-even': generateOddEvenSort,
  radix: generateRadixSort,
  counting: generateCountingSort,
  bucket: generateBucketSort,
  tim: generateTimSort,
  bogo: generateBogoSort,
  bitonic: generateBitonicSort,
  cycle: generateCycleSort,
  pancake: generatePancakeSort,
  stooge: generateStoogeSort,
  bead: generateBeadSort,
  slow: generateSlowSort,
  bogobogo: generateBogobogoSort,
};
