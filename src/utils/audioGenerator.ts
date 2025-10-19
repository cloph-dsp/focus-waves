// Audio context singleton
let audioContext: AudioContext | null = null;
let activeLoop: { stop: boolean } = { stop: false };
let activeOscillators: { oscillator: OscillatorNode; gainNode: GainNode }[] = [];
let compressor: DynamicsCompressorNode | null = null;
let runGain: GainNode | null = null;

const getAudioContext = () => {
  if (!audioContext) {
    audioContext = new AudioContext();
  }
  return audioContext;
};

const ensureOutputChain = () => {
  const ctx = getAudioContext();

  // Master high-pass to remove DC/very low rumble
  if (!(globalThis as any).__hpf) {
    const hpf = ctx.createBiquadFilter();
    hpf.type = 'highpass';
    hpf.frequency.value = 30; // cut sub-bass/DC
    hpf.Q.value = 0.707;
    ;(globalThis as any).__hpf = hpf;
  }
  const highpass: BiquadFilterNode = (globalThis as any).__hpf;

  // Dynamics compressor as gentle limiter
  if (!compressor) {
    compressor = ctx.createDynamicsCompressor();
    compressor.threshold.value = -16;
    compressor.knee.value = 24;
    compressor.ratio.value = 6;
    compressor.attack.value = 0.003;
    compressor.release.value = 0.18;
    compressor.connect(highpass);
  }

  // Per-run gain (faded in/out by reset/stop)
  if (!runGain) {
    runGain = ctx.createGain();
    runGain.gain.value = 0.9;
    runGain.connect(compressor);
  }
  // Ensure end of chain goes to speakers
  if (highpass.numberOfOutputs && highpass.context && highpass.disconnect) {
    try { highpass.disconnect(); } catch {}
    highpass.connect(ctx.destination);
  }

  return { ctx, output: runGain };
};

export type VisualCallback = (array: number[], highlightIndices?: number[]) => void;

// Generate a tone at a specific frequency with smooth envelope to prevent clicking
const playTone = (frequency: number, duration: number, startTime: number) => {
  const { ctx, output } = ensureOutputChain();
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(output);

  oscillator.frequency.value = frequency;
  oscillator.type = 'sine';

  // Smooth envelope to prevent clicking noise
  const attackTime = 0.003; // ~3ms attack
  const releaseTime = 0.025; // ~25ms release
  const peakGain = 0.07; // Slightly lower volume to prevent clipping
  
  gainNode.gain.setValueAtTime(0, startTime);
  gainNode.gain.linearRampToValueAtTime(peakGain, startTime + attackTime);
  // Hold, then exponential-ish release to zero
  gainNode.gain.setValueAtTime(peakGain, startTime + Math.max(attackTime, duration - releaseTime));
  gainNode.gain.exponentialRampToValueAtTime(Math.max(peakGain * 0.001, 0.0001), startTime + duration);

  oscillator.start(startTime);
  oscillator.stop(startTime + duration);

  // Track active oscillators
  activeOscillators.push({ oscillator, gainNode });

  // Clean up after the oscillator stops
  oscillator.onended = () => {
    const index = activeOscillators.findIndex(ao => ao.oscillator === oscillator);
    if (index > -1) {
      activeOscillators.splice(index, 1);
    }
  };
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
  { id: 'binary-insertion', name: 'Binary Insertion', description: 'Optimized insertion with binary search', category: 'Simple', complexity: 'O(n²)', color: 'from-orange-500 to-amber-500' },
  { id: 'tree', name: 'Tree Sort', description: 'Binary search tree in-order traversal', category: 'Tree-based', complexity: 'O(n log n)', color: 'from-green-500 to-lime-500' },
  { id: 'intro', name: 'Intro Sort', description: 'Hybrid quick-heap-insertion (used in std::sort)', category: 'Hybrid', complexity: 'O(n log n)', color: 'from-violet-500 to-purple-500' },
  { id: 'smooth', name: 'Smooth Sort', description: 'Leonardo heap with smooth transitions', category: 'Efficient', complexity: 'O(n log n)', color: 'from-indigo-500 to-blue-500' },
  { id: 'strand', name: 'Strand Sort', description: 'Extract sorted sublists and merge', category: 'Merge-based', complexity: 'O(n²)', color: 'from-cyan-500 to-sky-500' },
  { id: 'pigeonhole', name: 'Pigeonhole Sort', description: 'Pigeonhole distribution with integer sorting', category: 'Distribution', complexity: 'O(n+k)', color: 'from-fuchsia-500 to-pink-500' },
  { id: 'flash', name: 'Flash Sort', description: 'Distribution sort with classification', category: 'Distribution', complexity: 'O(n)', color: 'from-yellow-500 to-red-500' },
  { id: 'library', name: 'Library Sort', description: 'Insertion with gaps like library shelves', category: 'Insertion-based', complexity: 'O(n log n)', color: 'from-amber-500 to-orange-500' },
  { id: 'block', name: 'Block Sort', description: 'Block merge with O(1) memory', category: 'Merge-based', complexity: 'O(n log n)', color: 'from-slate-500 to-stone-500' },
  { id: 'patience', name: 'Patience Sort', description: 'Card game inspired pile sorting', category: 'Pile-based', complexity: 'O(n log n)', color: 'from-teal-500 to-emerald-500' },
  { id: 'tournament', name: 'Tournament Sort', description: 'Tree tournament bracket elimination', category: 'Tree-based', complexity: 'O(n log n)', color: 'from-indigo-500 to-violet-500' },
  { id: 'tag', name: 'Tag Sort', description: 'Sort indices then rearrange data', category: 'Indirect', complexity: 'O(n log n)', color: 'from-pink-500 to-rose-500' },
  { id: 'american-flag', name: 'American Flag Sort', description: 'In-place string bucket distribution', category: 'String', complexity: 'O(nk)', color: 'from-red-500 to-blue-500' },
  { id: 'burst', name: 'Burst Sort', description: 'Hybrid burst trie string sorting', category: 'String', complexity: 'O(n)', color: 'from-orange-500 to-yellow-500' },
  { id: 'sleep', name: 'Sleep Sort', description: 'Thread sleep based on value (silly!)', category: 'Silly', complexity: 'O(max(n))', color: 'from-purple-500 to-blue-500' },
  { id: 'stalin', name: 'Stalin Sort', description: 'Remove elements until sorted (cheating!)', category: 'Silly', complexity: 'O(n)', color: 'from-red-500 to-gray-500' },
  { id: 'miracle', name: 'Miracle Sort', description: 'Wait for quantum miracle to sort', category: 'Chaos', complexity: 'O(∞) or O(1)', color: 'from-white to-yellow-500' },
  { id: 'intelligent-design', name: 'Intelligent Design', description: 'Assume array is already sorted', category: 'Silly', complexity: 'O(1)', color: 'from-blue-500 to-white' },
  { id: 'quantum-bogo', name: 'Quantum Bogosort', description: 'Quantum parallel universe sorting', category: 'Chaos', complexity: 'O(n) or O(∞)', color: 'from-purple-500 to-pink-500' },
  { id: 'postman', name: 'Postman Sort', description: 'Multi-pass distribution like mail routes', category: 'Distribution', complexity: 'O(nk)', color: 'from-blue-500 to-green-500' },
  { id: 'merge-insertion', name: 'Merge-Insertion', description: 'Ford-Johnson optimal comparisons', category: 'Hybrid', complexity: 'O(n log n)', color: 'from-emerald-500 to-cyan-500' },
  { id: 'cartesian-tree', name: 'Cartesian Tree Sort', description: 'Build cartesian tree and traverse', category: 'Tree-based', complexity: 'O(n log n)', color: 'from-lime-500 to-teal-500' },
  { id: 'double-selection', name: 'Double Selection', description: 'Select min and max simultaneously', category: 'Simple', complexity: 'O(n²)', color: 'from-red-500 to-yellow-500' },
  { id: 'gravity', name: 'Gravity Sort', description: 'Abacus-like gravity simulation', category: 'Physics', complexity: 'O(n²)', color: 'from-gray-500 to-blue-500' },
  { id: 'network', name: 'Network Sort', description: 'Fixed sorting network comparisons', category: 'Parallel', complexity: 'O(log²n)', color: 'from-cyan-500 to-indigo-500' },
  { id: 'splay', name: 'Splaysort', description: 'Splay tree based adaptive sort', category: 'Tree-based', complexity: 'O(n log n)', color: 'from-violet-500 to-fuchsia-500' },
  { id: 'franceschini', name: 'Franceschini Sort', description: 'Merge sort with O(1) space', category: 'Merge-based', complexity: 'O(n log n)', color: 'from-orange-500 to-red-500' },
  { id: 'wiki', name: 'Wiki Sort', description: 'Stable block merge with O(1) memory', category: 'Merge-based', complexity: 'O(n log n)', color: 'from-blue-500 to-purple-500' },
  { id: 'cube', name: 'Cube Sort', description: '3D array sorting with spatial patterns', category: 'Multidimensional', complexity: 'O(n log n)', color: 'from-indigo-500 to-pink-500' },
  { id: 'weak-heap', name: 'Weak-Heap Sort', description: 'Relaxed heap with fewer comparisons', category: 'Heap-based', complexity: 'O(n log n)', color: 'from-purple-500 to-blue-500' },
  { id: 'oscillating', name: 'Oscillating Merge', description: 'Alternating merge direction patterns', category: 'Merge-based', complexity: 'O(n log n)', color: 'from-teal-500 to-cyan-500' },
  { id: 'grail', name: 'Grail Sort', description: 'Holy grail in-place stable merge', category: 'Merge-based', complexity: 'O(n log n)', color: 'from-yellow-500 to-amber-500' },
  { id: 'adaptive-merge', name: 'Adaptive Merge', description: 'Detects pre-sorted runs adaptively', category: 'Adaptive', complexity: 'O(n log n)', color: 'from-green-500 to-lime-500' },
  { id: 'lazy', name: 'Lazy Sort', description: 'Delays operations until necessary', category: 'Lazy', complexity: 'O(n log n)', color: 'from-slate-500 to-gray-500' },
  { id: 'spread', name: 'Spreadsort', description: 'Integer/float hybrid radix sort', category: 'Hybrid', complexity: 'O(n log n)', color: 'from-orange-500 to-red-500' },
  { id: 'pdq', name: 'PDQ Sort', description: 'Pattern-defeating quicksort', category: 'Hybrid', complexity: 'O(n log n)', color: 'from-rose-500 to-pink-500' },
  { id: 'dual-pivot', name: 'Dual-Pivot Quick', description: 'Quicksort with two pivot elements', category: 'Efficient', complexity: 'O(n log n)', color: 'from-cyan-500 to-blue-500' },
  { id: '3-way', name: '3-Way Quicksort', description: 'Handles duplicates efficiently', category: 'Efficient', complexity: 'O(n log n)', color: 'from-violet-500 to-indigo-500' },
  { id: 'brick', name: 'Brick Sort', description: 'Parallel odd-even transposition', category: 'Parallel', complexity: 'O(n²)', color: 'from-amber-500 to-orange-500' },
  { id: 'shear', name: 'Shear Sort', description: '2D mesh network sorting', category: 'Parallel', complexity: 'O(√n log n)', color: 'from-emerald-500 to-green-500' },
  { id: 'columnsort', name: 'Columnsort', description: 'Rectangle matrix column sorting', category: 'Parallel', complexity: 'O(log n)', color: 'from-fuchsia-500 to-purple-500' },
  { id: 'samplesort', name: 'Samplesort', description: 'Parallel divide-and-conquer with samples', category: 'Parallel', complexity: 'O(n log n)', color: 'from-lime-500 to-emerald-500' },
];

// Helper to create delay for visual updates
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Stop all active loops and audio
export const stopAllSorting = () => {
  activeLoop.stop = true;
  
  // Fade out and disconnect run gain to instantly silence any previous run
  try {
    const { ctx } = ensureOutputChain();
    if (runGain) {
      const now = ctx.currentTime;
      runGain.gain.cancelScheduledValues(now);
      runGain.gain.setValueAtTime(runGain.gain.value, now);
      runGain.gain.linearRampToValueAtTime(0, now + 0.02);
      // Disconnect slightly later to avoid clicks
      setTimeout(() => {
        try { runGain && runGain.disconnect(); } catch {}
        // Clear reference so next run creates a fresh gain
        runGain = null;
      }, 30);
    }
  } catch {}
  
  // Stop all active oscillators immediately to prevent overlap
  activeOscillators.forEach(({ oscillator, gainNode }) => {
    try {
      const ctx = getAudioContext();
      const now = ctx.currentTime;
      // Quick fade out to prevent clicking
      gainNode.gain.cancelScheduledValues(now);
      gainNode.gain.setValueAtTime(gainNode.gain.value, now);
      gainNode.gain.linearRampToValueAtTime(0, now + 0.01);
      oscillator.stop(now + 0.01);
    } catch (e) {
      // Oscillator might already be stopped
    }
  });
  activeOscillators = [];
};

export const resetLoop = (): { stop: boolean } => {
  // Start a new loop reference and fresh run gain with a short fade-in
  const { ctx } = ensureOutputChain();
  const previousRunGain = runGain;
  runGain = ctx.createGain();
  runGain.gain.setValueAtTime(0, ctx.currentTime);
  if (compressor) runGain.connect(compressor);

  // Fade out old run gain if exists
  if (previousRunGain) {
    const now = ctx.currentTime;
    previousRunGain.gain.cancelScheduledValues(now);
    previousRunGain.gain.setValueAtTime(previousRunGain.gain.value, now);
    previousRunGain.gain.linearRampToValueAtTime(0, now + 0.02);
    setTimeout(() => {
      try { previousRunGain.disconnect(); } catch {}
    }, 30);
  }

  // Fade in new run
  const now = ctx.currentTime;
  runGain.gain.linearRampToValueAtTime(0.9, now + 0.03);

  // Critical: create a brand new loop token so old generators don't get re-enabled
  activeLoop = { stop: false };
  return activeLoop;
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

// Binary Insertion Sort - Uses binary search to find insertion point
export const generateBinaryInsertionSort = async (size: number = 60, visualCallback?: VisualCallback, loop: boolean = true) => {
  resetLoop();
  
  while (!activeLoop.stop) {
    const array = Array.from({ length: size }, () => Math.floor(Math.random() * size) + 1);
    const ctx = getAudioContext();
    const noteDuration = 0.04;
    
    const binarySearch = (arr: number[], item: number, low: number, high: number) => {
      while (low <= high) {
        const mid = Math.floor((low + high) / 2);
        if (item < arr[mid]) {
          high = mid - 1;
        } else {
          low = mid + 1;
        }
      }
      return low;
    };
    
    for (let i = 1; i < array.length && !activeLoop.stop; i++) {
      const key = array[i];
      const pos = binarySearch(array, key, 0, i - 1);
      
      playTone(valueToFrequency(key, size), noteDuration * 1.3, ctx.currentTime);
      
      for (let j = i - 1; j >= pos && !activeLoop.stop; j--) {
        array[j + 1] = array[j];
        playTone(valueToFrequency(array[j + 1], size), noteDuration, ctx.currentTime);
        
        if (visualCallback) {
          visualCallback([...array], [j, j + 1]);
          await delay(35);
        }
      }
      array[pos] = key;
      
      if (visualCallback) {
        visualCallback([...array], [pos]);
        await delay(35);
      }
    }
    
    await playSortedArray(array, size, visualCallback);
    
    if (!loop || activeLoop.stop) break;
    await delay(500);
  }
};

// Tree Sort - Binary Search Tree based
export const generateTreeSort = async (size: number = 60, visualCallback?: VisualCallback, loop: boolean = true) => {
  resetLoop();
  
  while (!activeLoop.stop) {
    const array = Array.from({ length: size }, () => Math.floor(Math.random() * size) + 1);
    const ctx = getAudioContext();
    const noteDuration = 0.04;
    
    class TreeNode {
      value: number;
      left: TreeNode | null = null;
      right: TreeNode | null = null;
      
      constructor(value: number) {
        this.value = value;
      }
    }
    
    const insert = async (root: TreeNode | null, value: number): Promise<TreeNode> => {
      if (!root) {
        playTone(valueToFrequency(value, size), noteDuration, ctx.currentTime);
        return new TreeNode(value);
      }
      
      if (value < root.value) {
        root.left = await insert(root.left, value);
      } else {
        root.right = await insert(root.right, value);
      }
      
      return root;
    };
    
    const inorderTraversal = async (root: TreeNode | null, result: number[]) => {
      if (root && !activeLoop.stop) {
        await inorderTraversal(root.left, result);
        result.push(root.value);
        playTone(valueToFrequency(root.value, size), noteDuration, ctx.currentTime);
        
        if (visualCallback) {
          visualCallback([...result, ...Array(array.length - result.length).fill(0)], [result.length - 1]);
          await delay(40);
        }
        
        await inorderTraversal(root.right, result);
      }
    };
    
    let root: TreeNode | null = null;
    for (let i = 0; i < array.length && !activeLoop.stop; i++) {
      root = await insert(root, array[i]);
    }
    
    const sorted: number[] = [];
    await inorderTraversal(root, sorted);
    
    for (let i = 0; i < sorted.length; i++) {
      array[i] = sorted[i];
    }
    
    await playSortedArray(array, size, visualCallback);
    
    if (!loop || activeLoop.stop) break;
    await delay(500);
  }
};

// Intro Sort - Hybrid of QuickSort, HeapSort, and InsertionSort
export const generateIntroSort = async (size: number = 60, visualCallback?: VisualCallback, loop: boolean = true) => {
  resetLoop();
  
  while (!activeLoop.stop) {
    const array = Array.from({ length: size }, () => Math.floor(Math.random() * size) + 1);
    const ctx = getAudioContext();
    const noteDuration = 0.03;
    const maxDepth = Math.floor(Math.log2(array.length)) * 2;
    
    const insertionSort = async (arr: number[], left: number, right: number) => {
      for (let i = left + 1; i <= right && !activeLoop.stop; i++) {
        const key = arr[i];
        let j = i - 1;
        while (j >= left && arr[j] > key && !activeLoop.stop) {
          arr[j + 1] = arr[j];
          playTone(valueToFrequency(arr[j + 1], size), noteDuration, ctx.currentTime);
          
          if (visualCallback) {
            visualCallback([...arr], [j, j + 1]);
            await delay(30);
          }
          j--;
        }
        arr[j + 1] = key;
      }
    };
    
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
          await delay(30);
        }
        
        await heapify(arr, n, largest);
      }
    };
    
    const heapSort = async (arr: number[], left: number, right: number) => {
      const n = right - left + 1;
      
      for (let i = Math.floor(n / 2) - 1; i >= 0 && !activeLoop.stop; i--) {
        await heapify(arr.slice(left, right + 1), n, i);
      }
      
      const temp = arr.slice(left, right + 1);
      for (let i = n - 1; i > 0 && !activeLoop.stop; i--) {
        [temp[0], temp[i]] = [temp[i], temp[0]];
        await heapify(temp, i, 0);
      }
      
      for (let i = 0; i < n; i++) {
        arr[left + i] = temp[i];
      }
    };
    
    const partition = async (arr: number[], low: number, high: number): Promise<number> => {
      const pivot = arr[high];
      let i = low - 1;
      
      for (let j = low; j < high && !activeLoop.stop; j++) {
        if (arr[j] < pivot) {
          i++;
          [arr[i], arr[j]] = [arr[j], arr[i]];
          playTone(valueToFrequency(arr[i], size), noteDuration, ctx.currentTime);
          
          if (visualCallback) {
            visualCallback([...arr], [i, j]);
            await delay(30);
          }
        }
      }
      [arr[i + 1], arr[high]] = [arr[high], arr[i + 1]];
      return i + 1;
    };
    
    const introSortUtil = async (arr: number[], low: number, high: number, depth: number) => {
      const size = high - low + 1;
      
      if (size < 16 || activeLoop.stop) {
        await insertionSort(arr, low, high);
        return;
      }
      
      if (depth === 0) {
        await heapSort(arr, low, high);
        return;
      }
      
      const pivot = await partition(arr, low, high);
      await introSortUtil(arr, low, pivot - 1, depth - 1);
      await introSortUtil(arr, pivot + 1, high, depth - 1);
    };
    
    await introSortUtil(array, 0, array.length - 1, maxDepth);
    
    await playSortedArray(array, size, visualCallback);
    
    if (!loop || activeLoop.stop) break;
    await delay(500);
  }
};

// Smooth Sort - Leonardo heap variant
export const generateSmoothSort = async (size: number = 60, visualCallback?: VisualCallback, loop: boolean = true) => {
  resetLoop();
  
  while (!activeLoop.stop) {
    const array = Array.from({ length: size }, () => Math.floor(Math.random() * size) + 1);
    const ctx = getAudioContext();
    const noteDuration = 0.04;
    
    // Simplified smooth sort (using heap-like behavior with smooth transitions)
    const leonardo = [1, 1];
    while (leonardo[leonardo.length - 1] < array.length) {
      const next = leonardo[leonardo.length - 1] + leonardo[leonardo.length - 2] + 1;
      leonardo.push(next);
    }
    
    const sift = async (arr: number[], root: number, size: number) => {
      while (root > 0 && !activeLoop.stop) {
        const left = root - 1;
        if (left >= 0 && arr[left] > arr[root]) {
          [arr[left], arr[root]] = [arr[root], arr[left]];
          playTone(valueToFrequency(arr[root], size), noteDuration, ctx.currentTime);
          
          if (visualCallback) {
            visualCallback([...arr], [left, root]);
            await delay(35);
          }
          root = left;
        } else {
          break;
        }
      }
    };
    
    // Build heaps
    for (let i = 0; i < array.length && !activeLoop.stop; i++) {
      await sift(array, i, array.length);
    }
    
    // Sort by extracting
    for (let i = array.length - 1; i > 0 && !activeLoop.stop; i--) {
      [array[0], array[i]] = [array[i], array[0]];
      playTone(valueToFrequency(array[0], size), noteDuration, ctx.currentTime);
      
      if (visualCallback) {
        visualCallback([...array], [0, i]);
        await delay(35);
      }
      
      await sift(array, 0, i);
    }
    
    await playSortedArray(array, size, visualCallback);
    
    if (!loop || activeLoop.stop) break;
    await delay(500);
  }
};

// Strand Sort - Extract sorted sublists and merge
export const generateStrandSort = async (size: number = 60, visualCallback?: VisualCallback, loop: boolean = true) => {
  resetLoop();
  
  while (!activeLoop.stop) {
    const array = Array.from({ length: size }, () => Math.floor(Math.random() * size) + 1);
    const ctx = getAudioContext();
    const noteDuration = 0.04;
    
    const merge = (left: number[], right: number[]): number[] => {
      const result: number[] = [];
      let i = 0, j = 0;
      
      while (i < left.length && j < right.length) {
        if (left[i] <= right[j]) {
          result.push(left[i++]);
        } else {
          result.push(right[j++]);
        }
      }
      
      return result.concat(left.slice(i)).concat(right.slice(j));
    };
    
    let input = [...array];
    let result: number[] = [];
    
    while (input.length > 0 && !activeLoop.stop) {
      const sublist: number[] = [input[0]];
      const remaining: number[] = [];
      
      for (let i = 1; i < input.length && !activeLoop.stop; i++) {
        if (input[i] >= sublist[sublist.length - 1]) {
          sublist.push(input[i]);
          playTone(valueToFrequency(input[i], size), noteDuration, ctx.currentTime);
          
          if (visualCallback) {
            const display = [...result, ...sublist, ...remaining];
            visualCallback(display.slice(0, array.length), [result.length + sublist.length - 1]);
            await delay(40);
          }
        } else {
          remaining.push(input[i]);
        }
      }
      
      result = merge(result, sublist);
      input = remaining;
      
      if (visualCallback) {
        visualCallback([...result, ...input].slice(0, array.length), []);
        await delay(40);
      }
    }
    
    for (let i = 0; i < array.length; i++) {
      array[i] = result[i];
    }
    
    await playSortedArray(array, size, visualCallback);
    
    if (!loop || activeLoop.stop) break;
    await delay(500);
  }
};

// Pigeonhole Sort - Distribution into pigeonholes
export const generatePigeonholeSort = async (size: number = 60, visualCallback?: VisualCallback, loop: boolean = true) => {
  resetLoop();
  
  while (!activeLoop.stop) {
    const array = Array.from({ length: size }, () => Math.floor(Math.random() * size) + 1);
    const ctx = getAudioContext();
    const noteDuration = 0.03;
    
    const min = Math.min(...array);
    const max = Math.max(...array);
    const range = max - min + 1;
    const holes = Array.from({ length: range }, () => [] as number[]);
    
    for (let i = 0; i < array.length && !activeLoop.stop; i++) {
      holes[array[i] - min].push(array[i]);
      playTone(valueToFrequency(array[i], size), noteDuration, ctx.currentTime);
      
      if (visualCallback) {
        visualCallback([...array], [i]);
        await delay(30);
      }
    }
    
    let index = 0;
    for (let i = 0; i < range && !activeLoop.stop; i++) {
      for (const value of holes[i]) {
        array[index] = value;
        playTone(valueToFrequency(value, size), noteDuration, ctx.currentTime);
        
        if (visualCallback) {
          visualCallback([...array], [index]);
          await delay(30);
        }
        index++;
      }
    }
    
    await playSortedArray(array, size, visualCallback);
    
    if (!loop || activeLoop.stop) break;
    await delay(500);
  }
};

// Flash Sort - Classification-based distribution
export const generateFlashSort = async (size: number = 60, visualCallback?: VisualCallback, loop: boolean = true) => {
  resetLoop();
  
  while (!activeLoop.stop) {
    const array = Array.from({ length: size }, () => Math.floor(Math.random() * size) + 1);
    const ctx = getAudioContext();
    const noteDuration = 0.03;
    const m = Math.floor(size * 0.43);
    
    const min = Math.min(...array);
    const max = Math.max(...array);
    const c1 = (m - 1) / (max - min);
    const L = new Array(m).fill(0);
    
    for (let i = 0; i < array.length && !activeLoop.stop; i++) {
      const k = Math.floor(c1 * (array[i] - min));
      L[k]++;
      playTone(valueToFrequency(array[i], size), noteDuration, ctx.currentTime);
      
      if (visualCallback) {
        visualCallback([...array], [i]);
        await delay(25);
      }
    }
    
    for (let i = 1; i < m; i++) L[i] += L[i - 1];
    
    for (let i = 0; i < array.length && !activeLoop.stop; i++) {
      const k = Math.floor(c1 * (array[i] - min));
      while (i >= L[k] && !activeLoop.stop) {
        const j = L[k] - 1;
        [array[i], array[j]] = [array[j], array[i]];
        playTone(valueToFrequency(array[j], size), noteDuration, ctx.currentTime);
        
        if (visualCallback) {
          visualCallback([...array], [i, j]);
          await delay(25);
        }
        L[k]--;
      }
    }
    
    await generateInsertionSort(size, visualCallback, false);
    
    await playSortedArray(array, size, visualCallback);
    
    if (!loop || activeLoop.stop) break;
    await delay(500);
  }
};

// Library Sort - Insertion with gaps
export const generateLibrarySort = async (size: number = 60, visualCallback?: VisualCallback, loop: boolean = true) => {
  resetLoop();
  
  while (!activeLoop.stop) {
    const array = Array.from({ length: size }, () => Math.floor(Math.random() * size) + 1);
    const ctx = getAudioContext();
    const noteDuration = 0.04;
    const epsilon = 1;
    const lib = new Array(array.length * (1 + epsilon)).fill(null);
    
    lib[0] = array[0];
    let libSize = 1;
    
    for (let i = 1; i < array.length && !activeLoop.stop; i++) {
      let pos = 0;
      for (let j = 0; j < libSize; j++) {
        if (lib[j] !== null && lib[j] < array[i]) pos = j + 1;
      }
      
      for (let j = libSize; j > pos && !activeLoop.stop; j--) {
        lib[j] = lib[j - 1];
      }
      lib[pos] = array[i];
      playTone(valueToFrequency(array[i], size), noteDuration, ctx.currentTime);
      
      if (visualCallback) {
        const display = lib.filter(x => x !== null).slice(0, array.length);
        visualCallback([...display], [pos]);
        await delay(35);
      }
      libSize++;
    }
    
    const sorted = lib.filter(x => x !== null);
    for (let i = 0; i < array.length; i++) array[i] = sorted[i];
    
    await playSortedArray(array, size, visualCallback);
    
    if (!loop || activeLoop.stop) break;
    await delay(500);
  }
};

// Block Sort - In-place stable merge
export const generateBlockSort = async (size: number = 60, visualCallback?: VisualCallback, loop: boolean = true) => {
  resetLoop();
  
  while (!activeLoop.stop) {
    const array = Array.from({ length: size }, () => Math.floor(Math.random() * size) + 1);
    const ctx = getAudioContext();
    const noteDuration = 0.04;
    
    const blockSize = Math.floor(Math.sqrt(array.length));
    
    for (let i = 0; i < array.length && !activeLoop.stop; i += blockSize) {
      const end = Math.min(i + blockSize, array.length);
      for (let j = i + 1; j < end && !activeLoop.stop; j++) {
        const key = array[j];
        let k = j - 1;
        while (k >= i && array[k] > key && !activeLoop.stop) {
          array[k + 1] = array[k];
          playTone(valueToFrequency(array[k + 1], size), noteDuration, ctx.currentTime);
          
          if (visualCallback) {
            visualCallback([...array], [k, k + 1]);
            await delay(30);
          }
          k--;
        }
        array[k + 1] = key;
      }
    }
    
    await playSortedArray(array, size, visualCallback);
    
    if (!loop || activeLoop.stop) break;
    await delay(500);
  }
};

// Patience Sort - Card game piles
export const generatePatienceSort = async (size: number = 60, visualCallback?: VisualCallback, loop: boolean = true) => {
  resetLoop();
  
  while (!activeLoop.stop) {
    const array = Array.from({ length: size }, () => Math.floor(Math.random() * size) + 1);
    const ctx = getAudioContext();
    const noteDuration = 0.03;
    const piles: number[][] = [];
    
    for (let i = 0; i < array.length && !activeLoop.stop; i++) {
      let placed = false;
      for (let j = 0; j < piles.length && !activeLoop.stop; j++) {
        if (piles[j][piles[j].length - 1] >= array[i]) {
          piles[j].push(array[i]);
          playTone(valueToFrequency(array[i], size), noteDuration, ctx.currentTime);
          placed = true;
          
          if (visualCallback) {
            visualCallback([...array], [i]);
            await delay(30);
          }
          break;
        }
      }
      if (!placed) {
        piles.push([array[i]]);
        playTone(valueToFrequency(array[i], size), noteDuration * 1.2, ctx.currentTime);
        
        if (visualCallback) {
          visualCallback([...array], [i]);
          await delay(30);
        }
      }
    }
    
    let index = 0;
    while (piles.some(p => p.length > 0) && !activeLoop.stop) {
      let minPile = -1;
      let minValue = Infinity;
      for (let i = 0; i < piles.length; i++) {
        if (piles[i].length > 0 && piles[i][piles[i].length - 1] < minValue) {
          minValue = piles[i][piles[i].length - 1];
          minPile = i;
        }
      }
      array[index++] = piles[minPile].pop()!;
      playTone(valueToFrequency(array[index - 1], size), noteDuration, ctx.currentTime);
      
      if (visualCallback) {
        visualCallback([...array], [index - 1]);
        await delay(30);
      }
    }
    
    await playSortedArray(array, size, visualCallback);
    
    if (!loop || activeLoop.stop) break;
    await delay(500);
  }
};

// Tournament Sort - Binary tree tournament
export const generateTournamentSort = async (size: number = 60, visualCallback?: VisualCallback, loop: boolean = true) => {
  resetLoop();
  
  while (!activeLoop.stop) {
    const array = Array.from({ length: size }, () => Math.floor(Math.random() * size) + 1);
    const ctx = getAudioContext();
    const noteDuration = 0.04;
    const tree = [...array];
    
    for (let i = 0; i < array.length && !activeLoop.stop; i++) {
      let minIdx = 0;
      for (let j = 1; j < tree.length; j++) {
        if (tree[j] < tree[minIdx]) minIdx = j;
        playTone(valueToFrequency(tree[j], size), noteDuration / 2, ctx.currentTime);
        
        if (visualCallback) {
          visualCallback([...tree], [j, minIdx]);
          await delay(25);
        }
      }
      array[i] = tree[minIdx];
      tree[minIdx] = Infinity;
      playTone(valueToFrequency(array[i], size), noteDuration * 1.5, ctx.currentTime);
      
      if (visualCallback) {
        visualCallback([...array], [i]);
        await delay(40);
      }
    }
    
    await playSortedArray(array, size, visualCallback);
    
    if (!loop || activeLoop.stop) break;
    await delay(500);
  }
};

// Tag Sort - Sort indices then rearrange
export const generateTagSort = async (size: number = 60, visualCallback?: VisualCallback, loop: boolean = true) => {
  resetLoop();
  
  while (!activeLoop.stop) {
    const array = Array.from({ length: size }, () => Math.floor(Math.random() * size) + 1);
    const ctx = getAudioContext();
    const noteDuration = 0.03;
    const tags = array.map((val, idx) => ({ val, idx }));
    
    tags.sort((a, b) => {
      playTone(valueToFrequency(a.val, size), noteDuration / 3, ctx.currentTime);
      return a.val - b.val;
    });
    
    for (let i = 0; i < tags.length && !activeLoop.stop; i++) {
      array[i] = tags[i].val;
      playTone(valueToFrequency(array[i], size), noteDuration, ctx.currentTime);
      
      if (visualCallback) {
        visualCallback([...array], [i]);
        await delay(25);
      }
    }
    
    await playSortedArray(array, size, visualCallback);
    
    if (!loop || activeLoop.stop) break;
    await delay(500);
  }
};

// American Flag Sort - In-place string/integer bucket sort
export const generateAmericanFlagSort = async (size: number = 60, visualCallback?: VisualCallback, loop: boolean = true) => {
  resetLoop();
  
  while (!activeLoop.stop) {
    const array = Array.from({ length: size }, () => Math.floor(Math.random() * size) + 1);
    const ctx = getAudioContext();
    const noteDuration = 0.03;
    const maxDigits = Math.max(...array).toString().length;
    
    for (let digit = maxDigits - 1; digit >= 0 && !activeLoop.stop; digit--) {
      const buckets: number[][] = Array.from({ length: 10 }, () => []);
      
      for (let i = 0; i < array.length && !activeLoop.stop; i++) {
        const d = Math.floor(array[i] / Math.pow(10, digit)) % 10;
        buckets[d].push(array[i]);
        playTone(valueToFrequency(array[i], size), noteDuration, ctx.currentTime);
        
        if (visualCallback) {
          visualCallback([...array], [i]);
          await delay(25);
        }
      }
      
      let index = 0;
      for (const bucket of buckets) {
        for (const val of bucket) {
          array[index++] = val;
        }
      }
    }
    
    await playSortedArray(array, size, visualCallback);
    
    if (!loop || activeLoop.stop) break;
    await delay(500);
  }
};

// Burst Sort - Trie-based string sort
export const generateBurstSort = async (size: number = 60, visualCallback?: VisualCallback, loop: boolean = true) => {
  resetLoop();
  
  while (!activeLoop.stop) {
    const array = Array.from({ length: size }, () => Math.floor(Math.random() * size) + 1);
    const ctx = getAudioContext();
    const noteDuration = 0.03;
    
    const buckets: Map<number, number[]> = new Map();
    for (let i = 0; i < array.length && !activeLoop.stop; i++) {
      const key = Math.floor(array[i] / 10);
      if (!buckets.has(key)) buckets.set(key, []);
      buckets.get(key)!.push(array[i]);
      playTone(valueToFrequency(array[i], size), noteDuration, ctx.currentTime);
      
      if (visualCallback) {
        visualCallback([...array], [i]);
        await delay(25);
      }
    }
    
    let index = 0;
    for (const [_, bucket] of Array.from(buckets.entries()).sort((a, b) => a[0] - b[0])) {
      bucket.sort((a, b) => a - b);
      for (const val of bucket) {
        array[index++] = val;
        playTone(valueToFrequency(val, size), noteDuration, ctx.currentTime);
        
        if (visualCallback) {
          visualCallback([...array], [index - 1]);
          await delay(25);
        }
      }
    }
    
    await playSortedArray(array, size, visualCallback);
    
    if (!loop || activeLoop.stop) break;
    await delay(500);
  }
};

// Sleep Sort - Silly thread-based sort
export const generateSleepSort = async (size: number = 60, visualCallback?: VisualCallback, loop: boolean = true) => {
  resetLoop();
  
  while (!activeLoop.stop) {
    const array = Array.from({ length: size }, () => Math.floor(Math.random() * size) + 1);
    const ctx = getAudioContext();
    const noteDuration = 0.03;
    const result: number[] = [];
    const promises: Promise<void>[] = [];
    
    for (let i = 0; i < array.length && !activeLoop.stop; i++) {
      const value = array[i];
      promises.push(
        new Promise<void>(resolve => {
          setTimeout(() => {
            result.push(value);
            playTone(valueToFrequency(value, size), noteDuration, ctx.currentTime);
            resolve();
          }, value * 5);
        })
      );
    }
    
    await Promise.all(promises);
    
    for (let i = 0; i < result.length && !activeLoop.stop; i++) {
      array[i] = result[i];
      if (visualCallback) {
        visualCallback([...array], [i]);
        await delay(20);
      }
    }
    
    await playSortedArray(array, size, visualCallback);
    
    if (!loop || activeLoop.stop) break;
    await delay(500);
  }
};

// Stalin Sort - Remove non-ascending elements (cheating!)
export const generateStalinSort = async (size: number = 60, visualCallback?: VisualCallback, loop: boolean = true) => {
  resetLoop();
  
  while (!activeLoop.stop) {
    const array = Array.from({ length: size }, () => Math.floor(Math.random() * size) + 1);
    const ctx = getAudioContext();
    const noteDuration = 0.04;
    const result = [array[0]];
    
    playTone(valueToFrequency(array[0], size), noteDuration, ctx.currentTime);
    
    for (let i = 1; i < array.length && !activeLoop.stop; i++) {
      if (array[i] >= result[result.length - 1]) {
        result.push(array[i]);
        playTone(valueToFrequency(array[i], size), noteDuration, ctx.currentTime);
        
        if (visualCallback) {
          visualCallback([...result], [result.length - 1]);
          await delay(40);
        }
      } else {
        playTone(valueToFrequency(array[i], size) * 0.5, noteDuration * 0.5, ctx.currentTime);
        
        if (visualCallback) {
          await delay(30);
        }
      }
    }
    
    for (let i = 0; i < result.length; i++) array[i] = result[i];
    
    await playSortedArray(result, size, visualCallback);
    
    if (!loop || activeLoop.stop) break;
    await delay(500);
  }
};

// Miracle Sort - Wait for cosmic rays
export const generateMiracleSort = async (size: number = 60, visualCallback?: VisualCallback, loop: boolean = true) => {
  resetLoop();
  
  while (!activeLoop.stop) {
    const array = Array.from({ length: size }, () => Math.floor(Math.random() * size) + 1);
    const ctx = getAudioContext();
    const noteDuration = 0.1;
    
    const isSorted = () => {
      for (let i = 0; i < array.length - 1; i++) {
        if (array[i] > array[i + 1]) return false;
      }
      return true;
    };
    
    let checks = 0;
    while (!isSorted() && checks < 100 && !activeLoop.stop) {
      for (let i = 0; i < array.length; i++) {
        playTone(valueToFrequency(array[i], size), noteDuration / 4, ctx.currentTime);
      }
      
      if (visualCallback) {
        visualCallback([...array], []);
        await delay(100);
      }
      checks++;
    }
    
    if (!isSorted()) array.sort((a, b) => a - b);
    
    await playSortedArray(array, size, visualCallback);
    
    if (!loop || activeLoop.stop) break;
    await delay(500);
  }
};

// Intelligent Design Sort - Assume it's sorted
export const generateIntelligentDesignSort = async (size: number = 60, visualCallback?: VisualCallback, loop: boolean = true) => {
  resetLoop();
  
  while (!activeLoop.stop) {
    const array = Array.from({ length: size }, () => Math.floor(Math.random() * size) + 1);
    const ctx = getAudioContext();
    const noteDuration = 0.02;
    
    for (let i = 0; i < array.length && !activeLoop.stop; i++) {
      playTone(valueToFrequency(array[i], size), noteDuration, ctx.currentTime);
      
      if (visualCallback) {
        visualCallback([...array], [i]);
        await delay(15);
      }
    }
    
    array.sort((a, b) => a - b);
    
    await playSortedArray(array, size, visualCallback);
    
    if (!loop || activeLoop.stop) break;
    await delay(500);
  }
};

// Quantum Bogosort - Destroy universe if not sorted
export const generateQuantumBogoSort = async (size: number = 60, visualCallback?: VisualCallback, loop: boolean = true) => {
  resetLoop();
  
  while (!activeLoop.stop) {
    const array = Array.from({ length: size }, () => Math.floor(Math.random() * size) + 1);
    const ctx = getAudioContext();
    const noteDuration = 0.03;
    
    const isSorted = () => {
      for (let i = 0; i < array.length - 1; i++) {
        if (array[i] > array[i + 1]) return false;
      }
      return true;
    };
    
    let attempts = 0;
    while (!isSorted() && attempts < 50 && !activeLoop.stop) {
      for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
        playTone(valueToFrequency(array[i], size), noteDuration, ctx.currentTime);
      }
      
      if (visualCallback) {
        visualCallback([...array], []);
        await delay(50);
      }
      attempts++;
    }
    
    if (!isSorted()) array.sort((a, b) => a - b);
    
    await playSortedArray(array, size, visualCallback);
    
    if (!loop || activeLoop.stop) break;
    await delay(500);
  }
};

// Postman Sort - Multi-pass distribution
export const generatePostmanSort = async (size: number = 60, visualCallback?: VisualCallback, loop: boolean = true) => {
  resetLoop();
  
  while (!activeLoop.stop) {
    const array = Array.from({ length: size }, () => Math.floor(Math.random() * size) + 1);
    const ctx = getAudioContext();
    const noteDuration = 0.03;
    const buckets = 10;
    
    for (let pass = 0; pass < 2 && !activeLoop.stop; pass++) {
      const bins: number[][] = Array.from({ length: buckets }, () => []);
      
      for (let i = 0; i < array.length && !activeLoop.stop; i++) {
        const bin = Math.floor((array[i] / size) * (buckets - 1));
        bins[bin].push(array[i]);
        playTone(valueToFrequency(array[i], size), noteDuration, ctx.currentTime);
        
        if (visualCallback) {
          visualCallback([...array], [i]);
          await delay(25);
        }
      }
      
      let index = 0;
      for (const bin of bins) {
        bin.sort((a, b) => a - b);
        for (const val of bin) {
          array[index++] = val;
        }
      }
    }
    
    await playSortedArray(array, size, visualCallback);
    
    if (!loop || activeLoop.stop) break;
    await delay(500);
  }
};

// Merge-Insertion Sort (Ford-Johnson)
export const generateMergeInsertionSort = async (size: number = 60, visualCallback?: VisualCallback, loop: boolean = true) => {
  resetLoop();
  
  while (!activeLoop.stop) {
    const array = Array.from({ length: size }, () => Math.floor(Math.random() * size) + 1);
    const ctx = getAudioContext();
    const noteDuration = 0.04;
    
    if (array.length <= 1) {
      await playSortedArray(array, size, visualCallback);
      if (!loop || activeLoop.stop) break;
      await delay(500);
      continue;
    }
    
    const pairs: [number, number][] = [];
    for (let i = 0; i < array.length - 1 && !activeLoop.stop; i += 2) {
      if (array[i] > array[i + 1]) {
        pairs.push([array[i + 1], array[i]]);
      } else {
        pairs.push([array[i], array[i + 1]]);
      }
      playTone(valueToFrequency(array[i], size), noteDuration, ctx.currentTime);
      
      if (visualCallback) {
        visualCallback([...array], [i, i + 1]);
        await delay(35);
      }
    }
    
    const sorted = pairs.map(p => p[0]).sort((a, b) => a - b);
    for (const [_, larger] of pairs) {
      let pos = sorted.findIndex(x => x > larger);
      if (pos === -1) pos = sorted.length;
      sorted.splice(pos, 0, larger);
      playTone(valueToFrequency(larger, size), noteDuration, ctx.currentTime);
      
      if (visualCallback) {
        visualCallback([...sorted], [pos]);
        await delay(35);
      }
    }
    
    for (let i = 0; i < sorted.length; i++) array[i] = sorted[i];
    
    await playSortedArray(array, size, visualCallback);
    
    if (!loop || activeLoop.stop) break;
    await delay(500);
  }
};

// Cartesian Tree Sort
export const generateCartesianTreeSort = async (size: number = 60, visualCallback?: VisualCallback, loop: boolean = true) => {
  resetLoop();
  
  while (!activeLoop.stop) {
    const array = Array.from({ length: size }, () => Math.floor(Math.random() * size) + 1);
    const ctx = getAudioContext();
    const noteDuration = 0.04;
    
    interface Node {
      value: number;
      left?: Node;
      right?: Node;
    }
    
    const buildTree = (arr: number[]): Node | undefined => {
      if (arr.length === 0) return undefined;
      const minIdx = arr.indexOf(Math.min(...arr));
      return {
        value: arr[minIdx],
        left: buildTree(arr.slice(0, minIdx)),
        right: buildTree(arr.slice(minIdx + 1))
      };
    };
    
    const inorder = async (node: Node | undefined, result: number[]) => {
      if (!node || activeLoop.stop) return;
      await inorder(node.left, result);
      result.push(node.value);
      playTone(valueToFrequency(node.value, size), noteDuration, ctx.currentTime);
      
      if (visualCallback) {
        visualCallback([...result], [result.length - 1]);
        await delay(35);
      }
      await inorder(node.right, result);
    };
    
    const tree = buildTree(array);
    const result: number[] = [];
    await inorder(tree, result);
    
    for (let i = 0; i < result.length; i++) array[i] = result[i];
    
    await playSortedArray(array, size, visualCallback);
    
    if (!loop || activeLoop.stop) break;
    await delay(500);
  }
};

// Double Selection Sort - Select min and max simultaneously
export const generateDoubleSelectionSort = async (size: number = 60, visualCallback?: VisualCallback, loop: boolean = true) => {
  resetLoop();
  
  while (!activeLoop.stop) {
    const array = Array.from({ length: size }, () => Math.floor(Math.random() * size) + 1);
    const ctx = getAudioContext();
    const noteDuration = 0.05;
    
    for (let i = 0; i < array.length / 2 && !activeLoop.stop; i++) {
      let minIdx = i, maxIdx = i;
      
      for (let j = i; j < array.length - i && !activeLoop.stop; j++) {
        if (array[j] < array[minIdx]) minIdx = j;
        if (array[j] > array[maxIdx]) maxIdx = j;
        playTone(valueToFrequency(array[j], size), noteDuration / 3, ctx.currentTime);
        
        if (visualCallback) {
          visualCallback([...array], [j, minIdx, maxIdx]);
          await delay(30);
        }
      }
      
      if (minIdx !== i) {
        [array[i], array[minIdx]] = [array[minIdx], array[i]];
        if (maxIdx === i) maxIdx = minIdx;
      }
      
      const maxPos = array.length - 1 - i;
      if (maxIdx !== maxPos) {
        [array[maxPos], array[maxIdx]] = [array[maxIdx], array[maxPos]];
      }
      
      playTone(valueToFrequency(array[i], size), noteDuration, ctx.currentTime);
      playTone(valueToFrequency(array[maxPos], size), noteDuration, ctx.currentTime + noteDuration / 2);
      
      if (visualCallback) {
        visualCallback([...array], [i, maxPos]);
        await delay(50);
      }
    }
    
    await playSortedArray(array, size, visualCallback);
    
    if (!loop || activeLoop.stop) break;
    await delay(500);
  }
};

// Gravity Sort - Abacus simulation
export const generateGravitySort = async (size: number = 60, visualCallback?: VisualCallback, loop: boolean = true) => {
  resetLoop();
  
  while (!activeLoop.stop) {
    const array = Array.from({ length: size }, () => Math.floor(Math.random() * size) + 1);
    const ctx = getAudioContext();
    const noteDuration = 0.03;
    const max = Math.max(...array);
    const abacus: number[][] = Array.from({ length: array.length }, () => []);
    
    for (let i = 0; i < array.length && !activeLoop.stop; i++) {
      for (let j = 0; j < array[i]; j++) {
        abacus[i].push(1);
      }
      playTone(valueToFrequency(array[i], size), noteDuration, ctx.currentTime);
      
      if (visualCallback) {
        visualCallback([...array], [i]);
        await delay(25);
      }
    }
    
    for (let col = 0; col < max && !activeLoop.stop; col++) {
      let sum = 0;
      for (let row = 0; row < array.length; row++) {
        if (col < abacus[row].length) sum++;
      }
      for (let row = array.length - 1, count = sum; count > 0; row--, count--) {
        while (abacus[row].length <= col) abacus[row].push(0);
        abacus[row][col] = 1;
      }
    }
    
    for (let i = 0; i < array.length && !activeLoop.stop; i++) {
      array[i] = abacus[i].filter(x => x === 1).length;
      playTone(valueToFrequency(array[i], size), noteDuration, ctx.currentTime);
      
      if (visualCallback) {
        visualCallback([...array], [i]);
        await delay(25);
      }
    }
    
    await playSortedArray(array, size, visualCallback);
    
    if (!loop || activeLoop.stop) break;
    await delay(500);
  }
};

// Network Sort - Fixed comparator network
export const generateNetworkSort = async (size: number = 60, visualCallback?: VisualCallback, loop: boolean = true) => {
  resetLoop();
  
  while (!activeLoop.stop) {
    const array = Array.from({ length: size }, () => Math.floor(Math.random() * size) + 1);
    const ctx = getAudioContext();
    const noteDuration = 0.04;
    
    const compare = async (i: number, j: number) => {
      if (i < array.length && j < array.length && array[i] > array[j]) {
        [array[i], array[j]] = [array[j], array[i]];
        playTone(valueToFrequency(array[i], size), noteDuration, ctx.currentTime);
        playTone(valueToFrequency(array[j], size), noteDuration, ctx.currentTime + noteDuration / 2);
        
        if (visualCallback) {
          visualCallback([...array], [i, j]);
          await delay(35);
        }
      }
    };
    
    const n = array.length;
    for (let k = 2; k <= n && !activeLoop.stop; k *= 2) {
      for (let j = k / 2; j > 0 && !activeLoop.stop; j /= 2) {
        for (let i = 0; i < n && !activeLoop.stop; i++) {
          const l = i ^ j;
          if (l > i) {
            if ((i & k) === 0) {
              await compare(i, l);
            } else {
              await compare(l, i);
            }
          }
        }
      }
    }
    
    await playSortedArray(array, size, visualCallback);
    
    if (!loop || activeLoop.stop) break;
    await delay(500);
  }
};

// Splaysort - Splay tree based
export const generateSplaysort = async (size: number = 60, visualCallback?: VisualCallback, loop: boolean = true) => {
  resetLoop();
  
  while (!activeLoop.stop) {
    const array = Array.from({ length: size }, () => Math.floor(Math.random() * size) + 1);
    const ctx = getAudioContext();
    const noteDuration = 0.04;
    
    interface Node {
      value: number;
      left?: Node;
      right?: Node;
    }
    
    const insert = (root: Node | undefined, value: number): Node => {
      if (!root) return { value };
      if (value < root.value) {
        root.left = insert(root.left, value);
      } else {
        root.right = insert(root.right, value);
      }
      return root;
    };
    
    const inorder = async (node: Node | undefined, result: number[]) => {
      if (!node || activeLoop.stop) return;
      await inorder(node.left, result);
      result.push(node.value);
      playTone(valueToFrequency(node.value, size), noteDuration, ctx.currentTime);
      
      if (visualCallback) {
        visualCallback([...result], [result.length - 1]);
        await delay(35);
      }
      await inorder(node.right, result);
    };
    
    let root: Node | undefined;
    for (let i = 0; i < array.length && !activeLoop.stop; i++) {
      root = insert(root, array[i]);
      playTone(valueToFrequency(array[i], size), noteDuration / 2, ctx.currentTime);
      
      if (visualCallback) {
        visualCallback([...array], [i]);
        await delay(25);
      }
    }
    
    const result: number[] = [];
    await inorder(root, result);
    
    for (let i = 0; i < result.length; i++) array[i] = result[i];
    
    await playSortedArray(array, size, visualCallback);
    
    if (!loop || activeLoop.stop) break;
    await delay(500);
  }
};

// Franceschini Sort - In-place merge with O(1) space
export const generateFranceschiniSort = async (size: number = 60, visualCallback?: VisualCallback, loop: boolean = true) => {
  resetLoop();
  
  while (!activeLoop.stop) {
    const array = Array.from({ length: size }, () => Math.floor(Math.random() * size) + 1);
    const ctx = getAudioContext();
    const noteDuration = 0.04;
    
    const mergeInPlace = async (left: number, mid: number, right: number) => {
      let start = left;
      let start2 = mid + 1;
      
      while (start <= mid && start2 <= right && !activeLoop.stop) {
        if (array[start] <= array[start2]) {
          start++;
        } else {
          const value = array[start2];
          let index = start2;
          
          while (index !== start && !activeLoop.stop) {
            array[index] = array[index - 1];
            playTone(valueToFrequency(array[index], size), noteDuration, ctx.currentTime);
            
            if (visualCallback) {
              visualCallback([...array], [index, index - 1]);
              await delay(30);
            }
            index--;
          }
          array[start] = value;
          start++;
          mid++;
          start2++;
        }
      }
    };
    
    const mergeSort = async (left: number, right: number) => {
      if (left < right && !activeLoop.stop) {
        const mid = Math.floor((left + right) / 2);
        await mergeSort(left, mid);
        await mergeSort(mid + 1, right);
        await mergeInPlace(left, mid, right);
      }
    };
    
    await mergeSort(0, array.length - 1);
    
    await playSortedArray(array, size, visualCallback);
    
    if (!loop || activeLoop.stop) break;
    await delay(500);
  }
};

// Wiki Sort (Block Merge Sort)
const generateWikiSort = async (size = 50, visualCallback?: VisualCallback, loop = true) => {
  resetLoop();
  
  while (!activeLoop.stop) {
    const array = Array.from({ length: size }, () => Math.floor(Math.random() * 100));
    const audioCtx = getAudioContext();
    
    const wikiSortHelper = async (arr: number[], start: number, end: number) => {
      if (end - start <= 1) return;
      
      const mid = Math.floor((start + end) / 2);
      await wikiSortHelper(arr, start, mid);
      await wikiSortHelper(arr, mid, end);
      
      const temp: number[] = [];
      let i = start, j = mid;
      
      while (i < mid && j < end) {
        if (activeLoop.stop) return;
        if (arr[i] <= arr[j]) {
          temp.push(arr[i++]);
        } else {
          temp.push(arr[j++]);
        }
      }
      
      while (i < mid) temp.push(arr[i++]);
      while (j < end) temp.push(arr[j++]);
      
      for (let k = 0; k < temp.length; k++) {
        if (activeLoop.stop) return;
        arr[start + k] = temp[k];
        playTone(valueToFrequency(arr[start + k], 100), 0.02, audioCtx.currentTime);
        visualCallback?.(arr, [start + k]);
        await delay(25);
      }
    };
    
    await wikiSortHelper(array, 0, size);
    await playSortedArray(array, size, visualCallback);
    
    if (!loop || activeLoop.stop) break;
    await delay(500);
  }
};

// Cube Sort
const generateCubeSort = async (size = 50, visualCallback?: VisualCallback, loop = true) => {
  resetLoop();
  
  while (!activeLoop.stop) {
    const array = Array.from({ length: size }, () => Math.floor(Math.random() * 100));
    const audioCtx = getAudioContext();
    
    const cubeRoot = Math.ceil(Math.cbrt(size));
    
    for (let phase = 0; phase < 3; phase++) {
      for (let block = 0; block < cubeRoot; block++) {
        for (let i = block * cubeRoot; i < Math.min((block + 1) * cubeRoot, size); i++) {
          for (let j = i + 1; j < Math.min((block + 1) * cubeRoot, size); j++) {
            if (activeLoop.stop) return;
            if (array[i] > array[j]) {
              [array[i], array[j]] = [array[j], array[i]];
              playTone(valueToFrequency(array[i], 100), 0.02, audioCtx.currentTime);
              visualCallback?.(array, [i, j]);
              await delay(30);
            }
          }
        }
      }
    }
    
    await playSortedArray(array, size, visualCallback);
    
    if (!loop || activeLoop.stop) break;
    await delay(500);
  }
};

// Weak-Heap Sort
const generateWeakHeapSort = async (size = 50, visualCallback?: VisualCallback, loop = true) => {
  resetLoop();
  
  while (!activeLoop.stop) {
    const array = Array.from({ length: size }, () => Math.floor(Math.random() * 100));
    const audioCtx = getAudioContext();
    const reverse = new Array(size).fill(0);
    
    const weakHeapify = async (i: number, n: number) => {
      let j = i;
      while (2 * j + 1 < n) {
        const child = 2 * j + 1 + reverse[j];
        if (array[child] > array[j]) {
          [array[j], array[child]] = [array[child], array[j]];
          reverse[j] = 1 - reverse[j];
          j = child;
        } else {
          break;
        }
      }
    };
    
    for (let i = size - 1; i > 0; i--) {
      if (activeLoop.stop) return;
      await weakHeapify(i, size);
    }
    
    for (let i = size - 1; i > 0; i--) {
      if (activeLoop.stop) return;
      [array[0], array[i]] = [array[i], array[0]];
      playTone(valueToFrequency(array[0], 100), 0.02, audioCtx.currentTime);
      visualCallback?.(array, [0, i]);
      await delay(40);
      await weakHeapify(0, i);
    }
    
    await playSortedArray(array, size, visualCallback);
    
    if (!loop || activeLoop.stop) break;
    await delay(500);
  }
};

// Oscillating Merge Sort
const generateOscillatingMergeSort = async (size = 50, visualCallback?: VisualCallback, loop = true) => {
  resetLoop();
  
  while (!activeLoop.stop) {
    const array = Array.from({ length: size }, () => Math.floor(Math.random() * 100));
    const audioCtx = getAudioContext();
    
    const oscillatingMerge = async (arr: number[], start: number, end: number, direction: boolean) => {
      if (end - start <= 1) return;
      
      const mid = Math.floor((start + end) / 2);
      await oscillatingMerge(arr, start, mid, !direction);
      await oscillatingMerge(arr, mid, end, !direction);
      
      const temp: number[] = [];
      let i = direction ? start : mid - 1;
      let j = direction ? mid : end - 1;
      
      while ((direction ? i < mid && j < end : i >= start && j >= mid)) {
        if (activeLoop.stop) return;
        if (direction ? arr[i] <= arr[j] : arr[i] >= arr[j]) {
          temp.push(arr[i]);
          i += direction ? 1 : -1;
        } else {
          temp.push(arr[j]);
          j += direction ? 1 : -1;
        }
      }
      
      while (direction ? i < mid : i >= start) {
        temp.push(arr[i]);
        i += direction ? 1 : -1;
      }
      while (direction ? j < end : j >= mid) {
        temp.push(arr[j]);
        j += direction ? 1 : -1;
      }
      
      for (let k = 0; k < temp.length; k++) {
        if (activeLoop.stop) return;
        arr[start + k] = temp[k];
        playTone(valueToFrequency(arr[start + k], 100), 0.02, audioCtx.currentTime);
        visualCallback?.(arr, [start + k]);
        await delay(30);
      }
    };
    
    await oscillatingMerge(array, 0, size, true);
    await playSortedArray(array, size, visualCallback);
    
    if (!loop || activeLoop.stop) break;
    await delay(500);
  }
};

// Grail Sort
const generateGrailSort = async (size = 50, visualCallback?: VisualCallback, loop = true) => {
  resetLoop();
  
  while (!activeLoop.stop) {
    const array = Array.from({ length: size }, () => Math.floor(Math.random() * 100));
    const audioCtx = getAudioContext();
    
    const rotate = async (arr: number[], start: number, mid: number, end: number) => {
      while (start < mid && mid < end) {
        if (activeLoop.stop) return;
        [arr[start], arr[mid]] = [arr[mid], arr[start]];
        playTone(valueToFrequency(arr[start], 100), 0.02, audioCtx.currentTime);
        visualCallback?.(arr, [start, mid]);
        await delay(25);
        start++;
        mid++;
      }
    };
    
    const grailMerge = async (arr: number[], start: number, mid: number, end: number) => {
      let i = start, j = mid;
      while (i < j && j < end) {
        if (activeLoop.stop) return;
        if (arr[i] <= arr[j]) {
          i++;
        } else {
          await rotate(arr, i, j, j + 1);
          j++;
        }
        playTone(valueToFrequency(arr[i], 100), 0.02, audioCtx.currentTime);
        visualCallback?.(arr, [i, j]);
        await delay(30);
      }
    };
    
    for (let width = 1; width < size; width *= 2) {
      for (let start = 0; start < size; start += width * 2) {
        if (activeLoop.stop) return;
        const mid = Math.min(start + width, size);
        const end = Math.min(start + width * 2, size);
        if (mid < end) {
          await grailMerge(array, start, mid, end);
        }
      }
    }
    
    await playSortedArray(array, size, visualCallback);
    
    if (!loop || activeLoop.stop) break;
    await delay(500);
  }
};

// Adaptive Merge Sort
const generateAdaptiveMergeSort = async (size = 50, visualCallback?: VisualCallback, loop = true) => {
  resetLoop();
  
  while (!activeLoop.stop) {
    const array = Array.from({ length: size }, () => Math.floor(Math.random() * 100));
    const audioCtx = getAudioContext();
  
  const detectRuns = (arr: number[]) => {
    const runs: Array<[number, number]> = [];
    let start = 0;
    
    while (start < arr.length) {
      let end = start + 1;
      while (end < arr.length && arr[end] >= arr[end - 1]) {
        end++;
      }
      runs.push([start, end]);
      start = end;
    }
    return runs;
  };
  
  const merge = async (arr: number[], start1: number, end1: number, start2: number, end2: number) => {
    const temp: number[] = [];
    let i = start1, j = start2;
    
    while (i < end1 && j < end2) {
      if (activeLoop.stop) return;
      if (arr[i] <= arr[j]) {
        temp.push(arr[i++]);
      } else {
        temp.push(arr[j++]);
      }
    }
    
    while (i < end1) temp.push(arr[i++]);
    while (j < end2) temp.push(arr[j++]);
    
    for (let k = 0; k < temp.length; k++) {
      if (activeLoop.stop) return;
      arr[start1 + k] = temp[k];
      playTone(valueToFrequency(arr[start1 + k], 100), 0.02, audioCtx.currentTime);
      visualCallback?.(arr, [start1 + k]);
      await delay(25);
    }
  };
  
  let runs = detectRuns(array);
  while (runs.length > 1) {
    if (activeLoop.stop) return;
    const newRuns: Array<[number, number]> = [];
    for (let i = 0; i < runs.length; i += 2) {
      if (i + 1 < runs.length) {
        await merge(array, runs[i][0], runs[i][1], runs[i + 1][0], runs[i + 1][1]);
        newRuns.push([runs[i][0], runs[i + 1][1]]);
      } else {
        newRuns.push(runs[i]);
      }
    }
    runs = newRuns;
  }
  
  await playSortedArray(array, size, visualCallback);
  
    if (!loop || activeLoop.stop) break;
    await delay(500);
  }
};

// Lazy Sort
const generateLazySort = async (size = 50, visualCallback?: VisualCallback, loop = true) => {
  resetLoop();
  
  while (!activeLoop.stop) {
    const array = Array.from({ length: size }, () => Math.floor(Math.random() * 100));
    const audioCtx = getAudioContext();
    const pending: Array<[number, number]> = [];
    
    for (let i = 0; i < size - 1; i++) {
      if (array[i] > array[i + 1]) {
        pending.push([i, i + 1]);
      }
    }
    
    while (pending.length > 0) {
      if (activeLoop.stop) return;
      const [i, j] = pending.pop()!;
      if (array[i] > array[j]) {
        [array[i], array[j]] = [array[j], array[i]];
        playTone(valueToFrequency(array[i], 100), 0.02, audioCtx.currentTime);
        visualCallback?.(array, [i, j]);
        await delay(35);
        
        if (i > 0 && array[i - 1] > array[i]) {
          pending.push([i - 1, i]);
        }
        if (j < size - 1 && array[j] > array[j + 1]) {
          pending.push([j, j + 1]);
        }
      }
    }
    
    await playSortedArray(array, size, visualCallback);
    
    if (!loop || activeLoop.stop) break;
    await delay(500);
  }
};

// Spreadsort
const generateSpreadsort = async (size = 50, visualCallback?: VisualCallback, loop = true) => {
  resetLoop();
  
  while (!activeLoop.stop) {
    const array = Array.from({ length: size }, () => Math.floor(Math.random() * 100));
    const audioCtx = getAudioContext();
  
  const max = Math.max(...array);
  const bucketCount = Math.min(size, 10);
  const buckets: number[][] = Array.from({ length: bucketCount }, () => []);
  
  for (let i = 0; i < size; i++) {
    if (activeLoop.stop) return;
    const bucketIndex = Math.floor((array[i] / max) * (bucketCount - 1));
    buckets[bucketIndex].push(array[i]);
    playTone(valueToFrequency(array[i], 100), 0.02, audioCtx.currentTime);
    visualCallback?.(array, [i]);
    await delay(20);
  }
  
  let index = 0;
  for (const bucket of buckets) {
    bucket.sort((a, b) => a - b);
    for (const value of bucket) {
      if (activeLoop.stop) return;
      array[index] = value;
      playTone(valueToFrequency(value, 100), 0.02, audioCtx.currentTime);
      visualCallback?.(array, [index]);
      await delay(25);
      index++;
    }
  }
  
  await playSortedArray(array, size, visualCallback);
  
    if (!loop || activeLoop.stop) break;
    await delay(500);
  }
};

// PDQ Sort
const generatePDQSort = async (size = 50, visualCallback?: VisualCallback, loop = true) => {
  resetLoop();
  
  while (!activeLoop.stop) {
    const array = Array.from({ length: size }, () => Math.floor(Math.random() * 100));
    const audioCtx = getAudioContext();
  
  const pdqPartition = async (arr: number[], low: number, high: number) => {
    const pivot = arr[Math.floor((low + high) / 2)];
    let i = low, j = high;
    
    while (i <= j) {
      while (arr[i] < pivot) i++;
      while (arr[j] > pivot) j--;
      
      if (i <= j) {
        if (activeLoop.stop) return i;
        [arr[i], arr[j]] = [arr[j], arr[i]];
        playTone(valueToFrequency(arr[i], 100), 0.02, audioCtx.currentTime);
        visualCallback?.(arr, [i, j]);
        await delay(30);
        i++;
        j--;
      }
    }
    return i;
  };
  
  const pdqSort = async (arr: number[], low: number, high: number, depth: number) => {
    if (low < high) {
      if (depth === 0) {
        for (let i = low; i <= high; i++) {
          for (let j = i + 1; j <= high; j++) {
            if (activeLoop.stop) return;
            if (arr[i] > arr[j]) {
              [arr[i], arr[j]] = [arr[j], arr[i]];
              playTone(valueToFrequency(arr[i], 100), 0.02, audioCtx.currentTime);
              visualCallback?.(arr, [i, j]);
              await delay(25);
            }
          }
        }
      } else {
        const pi = await pdqPartition(arr, low, high);
        if (activeLoop.stop) return;
        await pdqSort(arr, low, pi - 1, depth - 1);
        await pdqSort(arr, pi, high, depth - 1);
      }
    }
  };
  
  await pdqSort(array, 0, size - 1, Math.floor(Math.log2(size)) * 2);
  await playSortedArray(array, size, visualCallback);
  
    if (!loop || activeLoop.stop) break;
    await delay(500);
  }
};

// Dual-Pivot Quicksort
const generateDualPivotQuickSort = async (size = 50, visualCallback?: VisualCallback, loop = true) => {
  resetLoop();
  
  while (!activeLoop.stop) {
    const array = Array.from({ length: size }, () => Math.floor(Math.random() * 100));
    const audioCtx = getAudioContext();
  
  const dualPivotSort = async (arr: number[], low: number, high: number) => {
    if (low < high) {
      if (arr[low] > arr[high]) {
        [arr[low], arr[high]] = [arr[high], arr[low]];
      }
      
      const pivot1 = arr[low];
      const pivot2 = arr[high];
      let i = low + 1, lt = low + 1, gt = high - 1;
      
      while (i <= gt) {
        if (activeLoop.stop) return;
        if (arr[i] < pivot1) {
          [arr[i], arr[lt]] = [arr[lt], arr[i]];
          lt++;
        } else if (arr[i] > pivot2) {
          [arr[i], arr[gt]] = [arr[gt], arr[i]];
          gt--;
          i--;
        }
        playTone(valueToFrequency(arr[i], 100), 0.02, audioCtx.currentTime);
        visualCallback?.(arr, [i, lt, gt]);
        await delay(30);
        i++;
      }
      
      [arr[low], arr[lt - 1]] = [arr[lt - 1], arr[low]];
      [arr[high], arr[gt + 1]] = [arr[gt + 1], arr[high]];
      
      await dualPivotSort(arr, low, lt - 2);
      await dualPivotSort(arr, lt, gt);
      await dualPivotSort(arr, gt + 2, high);
    }
  };
  
  await dualPivotSort(array, 0, size - 1);
  await playSortedArray(array, size, visualCallback);
  
    if (!loop || activeLoop.stop) break;
    await delay(500);
  }
};

// 3-Way Quicksort
const generate3WayQuickSort = async (size = 50, visualCallback?: VisualCallback, loop = true) => {
  resetLoop();
  
  while (!activeLoop.stop) {
    const array = Array.from({ length: size }, () => Math.floor(Math.random() * 100));
    const audioCtx = getAudioContext();
    
    const threeWayPartition = async (arr: number[], low: number, high: number) => {
      if (low >= high) return;
      
      const pivot = arr[low];
      let lt = low, i = low + 1, gt = high;
      
      while (i <= gt) {
        if (activeLoop.stop) return;
        if (arr[i] < pivot) {
          [arr[lt], arr[i]] = [arr[i], arr[lt]];
          lt++;
          i++;
        } else if (arr[i] > pivot) {
          [arr[i], arr[gt]] = [arr[gt], arr[i]];
          gt--;
        } else {
          i++;
        }
        playTone(valueToFrequency(arr[i - 1], 100), 0.02, audioCtx.currentTime);
        visualCallback?.(arr, [i - 1, lt, gt]);
        await delay(30);
      }
      
      await threeWayPartition(arr, low, lt - 1);
      await threeWayPartition(arr, gt + 1, high);
    };
    
    await threeWayPartition(array, 0, size - 1);
    await playSortedArray(array, size, visualCallback);
    
    if (!loop || activeLoop.stop) break;
    await delay(500);
  }
};

// Brick Sort
const generateBrickSort = async (size = 50, visualCallback?: VisualCallback, loop = true) => {
  resetLoop();
  
  while (!activeLoop.stop) {
    const array = Array.from({ length: size }, () => Math.floor(Math.random() * 100));
    const audioCtx = getAudioContext();
  
  let sorted = false;
  while (!sorted) {
    sorted = true;
    
    for (let i = 1; i < size - 1; i += 2) {
      if (activeLoop.stop) return;
      if (array[i] > array[i + 1]) {
        [array[i], array[i + 1]] = [array[i + 1], array[i]];
        sorted = false;
        playTone(valueToFrequency(array[i], 100), 0.02, audioCtx.currentTime);
        visualCallback?.(array, [i, i + 1]);
        await delay(35);
      }
    }
    
    for (let i = 0; i < size - 1; i += 2) {
      if (activeLoop.stop) return;
      if (array[i] > array[i + 1]) {
        [array[i], array[i + 1]] = [array[i + 1], array[i]];
        sorted = false;
        playTone(valueToFrequency(array[i], 100), 0.02, audioCtx.currentTime);
        visualCallback?.(array, [i, i + 1]);
        await delay(35);
      }
    }
  }
  
  await playSortedArray(array, size, visualCallback);
  
    if (!loop || activeLoop.stop) break;
    await delay(500);
  }
};

// Shear Sort
const generateShearSort = async (size = 50, visualCallback?: VisualCallback, loop = true) => {
  resetLoop();
  
  while (!activeLoop.stop) {
    const array = Array.from({ length: size }, () => Math.floor(Math.random() * 100));
    const audioCtx = getAudioContext();
  
  const rows = Math.ceil(Math.sqrt(size));
  const cols = Math.ceil(size / rows);
  
  const sortRow = async (rowIndex: number, ascending: boolean) => {
    const start = rowIndex * cols;
    const end = Math.min(start + cols, size);
    
    for (let i = start; i < end - 1; i++) {
      for (let j = i + 1; j < end; j++) {
        if (activeLoop.stop) return;
        const shouldSwap = ascending ? array[i] > array[j] : array[i] < array[j];
        if (shouldSwap) {
          [array[i], array[j]] = [array[j], array[i]];
          playTone(valueToFrequency(array[i], 100), 0.02, audioCtx.currentTime);
          visualCallback?.(array, [i, j]);
          await delay(25);
        }
      }
    }
  };
  
  const sortColumn = async (colIndex: number) => {
    const indices = [];
    for (let r = 0; r < rows && r * cols + colIndex < size; r++) {
      indices.push(r * cols + colIndex);
    }
    
    for (let i = 0; i < indices.length - 1; i++) {
      for (let j = i + 1; j < indices.length; j++) {
        if (activeLoop.stop) return;
        if (array[indices[i]] > array[indices[j]]) {
          [array[indices[i]], array[indices[j]]] = [array[indices[j]], array[indices[i]]];
          playTone(valueToFrequency(array[indices[i]], 100), 0.02, audioCtx.currentTime);
          visualCallback?.(array, indices);
          await delay(25);
        }
      }
    }
  };
  
  for (let phase = 0; phase < Math.ceil(Math.log2(rows)) + 1; phase++) {
    for (let r = 0; r < rows; r++) {
      if (activeLoop.stop) return;
      await sortRow(r, r % 2 === 0);
    }
    
    for (let c = 0; c < cols; c++) {
      if (activeLoop.stop) return;
      await sortColumn(c);
    }
  }
  
  await playSortedArray(array, size, visualCallback);
  
    if (!loop || activeLoop.stop) break;
    await delay(500);
  }
};

// Columnsort
const generateColumnsort = async (size = 50, visualCallback?: VisualCallback, loop = true) => {
  resetLoop();
  
  while (!activeLoop.stop) {
    const array = Array.from({ length: size }, () => Math.floor(Math.random() * 100));
    const audioCtx = getAudioContext();
  
  const r = Math.ceil(Math.sqrt(size));
  const s = Math.ceil(size / r);
  
  const sortColumns = async () => {
    for (let col = 0; col < s; col++) {
      const indices = [];
      for (let row = 0; row < r && row * s + col < size; row++) {
        indices.push(row * s + col);
      }
      
      for (let i = 0; i < indices.length - 1; i++) {
        for (let j = i + 1; j < indices.length; j++) {
          if (activeLoop.stop) return;
          if (array[indices[i]] > array[indices[j]]) {
            [array[indices[i]], array[indices[j]]] = [array[indices[j]], array[indices[i]]];
            playTone(valueToFrequency(array[indices[i]], 100), 0.02, audioCtx.currentTime);
            visualCallback?.(array, indices);
            await delay(30);
          }
        }
      }
    }
  };
  
  await sortColumns();
  await sortColumns();
  await sortColumns();
  
  await playSortedArray(array, size, visualCallback);
  
    if (!loop || activeLoop.stop) break;
    await delay(500);
  }
};

// Samplesort
const generateSamplesort = async (size = 50, visualCallback?: VisualCallback, loop = true) => {
  resetLoop();
  
  while (!activeLoop.stop) {
    const array = Array.from({ length: size }, () => Math.floor(Math.random() * 100));
    const audioCtx = getAudioContext();
  
  const sampleSize = Math.min(size, 10);
  const samples = [];
  
  for (let i = 0; i < sampleSize; i++) {
    const idx = Math.floor(Math.random() * size);
    samples.push(array[idx]);
    playTone(valueToFrequency(array[idx], 100), 0.02, audioCtx.currentTime);
    visualCallback?.(array, [idx]);
    await delay(20);
  }
  
  samples.sort((a, b) => a - b);
  const buckets: number[][] = Array.from({ length: sampleSize + 1 }, () => []);
  
  for (let i = 0; i < size; i++) {
    if (activeLoop.stop) return;
    let bucketIdx = 0;
    for (let j = 0; j < samples.length; j++) {
      if (array[i] > samples[j]) {
        bucketIdx = j + 1;
      }
    }
    buckets[bucketIdx].push(array[i]);
    playTone(valueToFrequency(array[i], 100), 0.02, audioCtx.currentTime);
    visualCallback?.(array, [i]);
    await delay(20);
  }
  
  let index = 0;
  for (const bucket of buckets) {
    bucket.sort((a, b) => a - b);
    for (const value of bucket) {
      if (activeLoop.stop) return;
      array[index] = value;
      playTone(valueToFrequency(value, 100), 0.02, audioCtx.currentTime);
      visualCallback?.(array, [index]);
      await delay(25);
      index++;
    }
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
  'binary-insertion': generateBinaryInsertionSort,
  tree: generateTreeSort,
  intro: generateIntroSort,
  smooth: generateSmoothSort,
  strand: generateStrandSort,
  pigeonhole: generatePigeonholeSort,
  flash: generateFlashSort,
  library: generateLibrarySort,
  block: generateBlockSort,
  patience: generatePatienceSort,
  tournament: generateTournamentSort,
  tag: generateTagSort,
  'american-flag': generateAmericanFlagSort,
  burst: generateBurstSort,
  sleep: generateSleepSort,
  stalin: generateStalinSort,
  miracle: generateMiracleSort,
  'intelligent-design': generateIntelligentDesignSort,
  'quantum-bogo': generateQuantumBogoSort,
  postman: generatePostmanSort,
  'merge-insertion': generateMergeInsertionSort,
  'cartesian-tree': generateCartesianTreeSort,
  'double-selection': generateDoubleSelectionSort,
  gravity: generateGravitySort,
  network: generateNetworkSort,
  splay: generateSplaysort,
  franceschini: generateFranceschiniSort,
  wiki: generateWikiSort,
  cube: generateCubeSort,
  'weak-heap': generateWeakHeapSort,
  oscillating: generateOscillatingMergeSort,
  grail: generateGrailSort,
  'adaptive-merge': generateAdaptiveMergeSort,
  lazy: generateLazySort,
  spread: generateSpreadsort,
  pdq: generatePDQSort,
  'dual-pivot': generateDualPivotQuickSort,
  '3-way': generate3WayQuickSort,
  brick: generateBrickSort,
  shear: generateShearSort,
  columnsort: generateColumnsort,
  samplesort: generateSamplesort,
};
