import { activeLoop, createNonBlockingVisualCallback, delay, generateUniqueRandomArray, getAdaptiveDelay, getAdaptiveNoteDuration, getAudioContext, playSortedArray, playTone, resetLoop, valueToFrequency } from "../engine";
import type { VisualCallback } from "../types";

// Binary Insertion Sort - Uses binary search to find insertion point
export const generateBinaryInsertionSort = async (size: number = 60, visualCallback?: VisualCallback, loop: boolean = true) => {
  resetLoop();
  
  // Wrap visual callback to be non-blocking
  const nonBlockingCallback = createNonBlockingVisualCallback(visualCallback);  
  while (!activeLoop.stop) {
    const array = generateUniqueRandomArray(size);
    const ctx = getAudioContext();
    const noteDuration = getAdaptiveNoteDuration(0.0075, size);
    
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
        
        if (nonBlockingCallback) {
          nonBlockingCallback([...array], [j, j + 1]);
          await delay(getAdaptiveDelay(200, size));
        }
      }
      array[pos] = key;
      
      if (nonBlockingCallback) {
        nonBlockingCallback([...array], [pos]);
        await delay(getAdaptiveDelay(200, size));
      }
    }
    
    await playSortedArray(array, size, nonBlockingCallback);
    
    if (!loop || activeLoop.stop) break;
    await delay(getAdaptiveDelay(200, size));
  }
};
