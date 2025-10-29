import { activeLoop, createNonBlockingVisualCallback, delay, generateUniqueRandomArray, getAdaptiveDelay, getAdaptiveNoteDuration, getAudioContext, playSortedArray, playTone, resetLoop, valueToFrequency } from "../engine";
import type { VisualCallback } from "../types";

// Smooth Sort - Leonardo heap variant
export const generateSmoothSort = async (size: number = 60, visualCallback?: VisualCallback, loop: boolean = true) => {
  resetLoop();
  
  // Wrap visual callback to be non-blocking
  const nonBlockingCallback = createNonBlockingVisualCallback(visualCallback);  
  while (!activeLoop.stop) {
    const array = generateUniqueRandomArray(size);
    const ctx = getAudioContext();
    const noteDuration = getAdaptiveNoteDuration(0.0075, size);
    
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
          
          if (nonBlockingCallback) {
            nonBlockingCallback([...arr], [left, root]);
            await delay(getAdaptiveDelay(200, size));
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
      
      if (nonBlockingCallback) {
        nonBlockingCallback([...array], [0, i]);
        await delay(getAdaptiveDelay(200, size));
      }
      
      await sift(array, 0, i);
    }
    
    await playSortedArray(array, size, nonBlockingCallback);
    
    if (!loop || activeLoop.stop) break;
    await delay(getAdaptiveDelay(200, size));
  }
};
