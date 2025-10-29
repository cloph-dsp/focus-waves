import { activeLoop, createNonBlockingVisualCallback, delay, generateUniqueRandomArray, getAdaptiveDelay, getAdaptiveNoteDuration, getAudioContext, playSortedArray, playTone, resetLoop, valueToFrequency } from "../engine";
import type { VisualCallback } from "../types";

// Stooge Sort - Silly recursive pattern
export const generateStoogeSort = async (size: number = 40, visualCallback?: VisualCallback, loop: boolean = true) => {
  resetLoop();
  
  // Wrap visual callback to be non-blocking
  const nonBlockingCallback = createNonBlockingVisualCallback(visualCallback);  
  while (!activeLoop.stop) {
    const array = generateUniqueRandomArray(size);
    const ctx = getAudioContext();
    const noteDuration = getAdaptiveNoteDuration(0.0075, size);
    
    const stoogeSort = async (arr: number[], l: number, h: number) => {
      if (l >= h || activeLoop.stop) return;
      
      if (arr[l] > arr[h]) {
        [arr[l], arr[h]] = [arr[h], arr[l]];
        playTone(valueToFrequency(arr[l], size), noteDuration, ctx.currentTime);
        
        if (nonBlockingCallback) {
          nonBlockingCallback([...arr], [l, h]);
          await delay(getAdaptiveDelay(200, size));
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
    
    await playSortedArray(array, size, nonBlockingCallback);
    
    if (!loop || activeLoop.stop) break;
    await delay(getAdaptiveDelay(200, size));
  }
};
