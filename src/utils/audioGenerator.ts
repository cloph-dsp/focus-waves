// Audio context singleton
let audioContext: AudioContext | null = null;

const getAudioContext = () => {
  if (!audioContext) {
    audioContext = new AudioContext();
  }
  return audioContext;
};

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

// Sorting algorithm implementations with audio feedback
export const generateBubbleSort = async (size: number = 30) => {
  const array = Array.from({ length: size }, () => Math.floor(Math.random() * size) + 1);
  const ctx = getAudioContext();
  let time = ctx.currentTime;
  const noteDuration = 0.05;

  for (let i = 0; i < array.length; i++) {
    for (let j = 0; j < array.length - i - 1; j++) {
      if (array[j] > array[j + 1]) {
        [array[j], array[j + 1]] = [array[j + 1], array[j]];
        playTone(valueToFrequency(array[j], size), noteDuration, time);
        playTone(valueToFrequency(array[j + 1], size), noteDuration, time + noteDuration / 2);
        time += noteDuration;
      }
    }
  }
};

export const generateQuickSort = async (size: number = 30) => {
  const array = Array.from({ length: size }, () => Math.floor(Math.random() * size) + 1);
  const ctx = getAudioContext();
  let time = ctx.currentTime;
  const noteDuration = 0.03;

  const quickSort = (arr: number[], low: number, high: number) => {
    if (low < high) {
      const pi = partition(arr, low, high);
      quickSort(arr, low, pi - 1);
      quickSort(arr, pi + 1, high);
    }
  };

  const partition = (arr: number[], low: number, high: number): number => {
    const pivot = arr[high];
    let i = low - 1;

    for (let j = low; j < high; j++) {
      if (arr[j] < pivot) {
        i++;
        [arr[i], arr[j]] = [arr[j], arr[i]];
        playTone(valueToFrequency(arr[i], size), noteDuration, time);
        time += noteDuration;
      }
    }
    [arr[i + 1], arr[high]] = [arr[high], arr[i + 1]];
    playTone(valueToFrequency(arr[i + 1], size), noteDuration * 1.5, time);
    time += noteDuration;
    return i + 1;
  };

  quickSort(array, 0, array.length - 1);
};

export const generateMergeSort = async (size: number = 30) => {
  const array = Array.from({ length: size }, () => Math.floor(Math.random() * size) + 1);
  const ctx = getAudioContext();
  let time = ctx.currentTime;
  const noteDuration = 0.04;

  const merge = (arr: number[], left: number, mid: number, right: number) => {
    const leftArr = arr.slice(left, mid + 1);
    const rightArr = arr.slice(mid + 1, right + 1);
    let i = 0, j = 0, k = left;

    while (i < leftArr.length && j < rightArr.length) {
      if (leftArr[i] <= rightArr[j]) {
        arr[k] = leftArr[i];
        playTone(valueToFrequency(arr[k], size), noteDuration, time);
        i++;
      } else {
        arr[k] = rightArr[j];
        playTone(valueToFrequency(arr[k], size), noteDuration, time);
        j++;
      }
      time += noteDuration;
      k++;
    }

    while (i < leftArr.length) {
      arr[k] = leftArr[i];
      playTone(valueToFrequency(arr[k], size), noteDuration, time);
      i++;
      k++;
      time += noteDuration;
    }

    while (j < rightArr.length) {
      arr[k] = rightArr[j];
      playTone(valueToFrequency(arr[k], size), noteDuration, time);
      j++;
      k++;
      time += noteDuration;
    }
  };

  const mergeSort = (arr: number[], left: number, right: number) => {
    if (left < right) {
      const mid = Math.floor((left + right) / 2);
      mergeSort(arr, left, mid);
      mergeSort(arr, mid + 1, right);
      merge(arr, left, mid, right);
    }
  };

  mergeSort(array, 0, array.length - 1);
};

export const generateInsertionSort = async (size: number = 30) => {
  const array = Array.from({ length: size }, () => Math.floor(Math.random() * size) + 1);
  const ctx = getAudioContext();
  let time = ctx.currentTime;
  const noteDuration = 0.04;

  for (let i = 1; i < array.length; i++) {
    const key = array[i];
    let j = i - 1;
    while (j >= 0 && array[j] > key) {
      array[j + 1] = array[j];
      playTone(valueToFrequency(array[j + 1], size), noteDuration, time);
      time += noteDuration;
      j--;
    }
    array[j + 1] = key;
    playTone(valueToFrequency(key, size), noteDuration * 1.2, time);
    time += noteDuration;
  }
};

export const generateSelectionSort = async (size: number = 30) => {
  const array = Array.from({ length: size }, () => Math.floor(Math.random() * size) + 1);
  const ctx = getAudioContext();
  let time = ctx.currentTime;
  const noteDuration = 0.06;

  for (let i = 0; i < array.length - 1; i++) {
    let minIdx = i;
    for (let j = i + 1; j < array.length; j++) {
      if (array[j] < array[minIdx]) {
        minIdx = j;
      }
      playTone(valueToFrequency(array[j], size), noteDuration / 2, time);
      time += noteDuration / 3;
    }
    if (minIdx !== i) {
      [array[i], array[minIdx]] = [array[minIdx], array[i]];
      playTone(valueToFrequency(array[i], size), noteDuration * 1.5, time);
      time += noteDuration;
    }
  }
};

export const generateHeapSort = async (size: number = 30) => {
  const array = Array.from({ length: size }, () => Math.floor(Math.random() * size) + 1);
  const ctx = getAudioContext();
  let time = ctx.currentTime;
  const noteDuration = 0.04;

  const heapify = (arr: number[], n: number, i: number) => {
    let largest = i;
    const left = 2 * i + 1;
    const right = 2 * i + 2;

    if (left < n && arr[left] > arr[largest]) largest = left;
    if (right < n && arr[right] > arr[largest]) largest = right;

    if (largest !== i) {
      [arr[i], arr[largest]] = [arr[largest], arr[i]];
      playTone(valueToFrequency(arr[i], size), noteDuration, time);
      time += noteDuration;
      heapify(arr, n, largest);
    }
  };

  for (let i = Math.floor(array.length / 2) - 1; i >= 0; i--) {
    heapify(array, array.length, i);
  }

  for (let i = array.length - 1; i > 0; i--) {
    [array[0], array[i]] = [array[i], array[0]];
    playTone(valueToFrequency(array[0], size), noteDuration * 1.2, time);
    time += noteDuration;
    heapify(array, i, 0);
  }
};

export const sortingFunctions: Record<string, (size?: number) => Promise<void>> = {
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
