import { activeLoop, createNonBlockingVisualCallback, delay, generateUniqueRandomArray, getAdaptiveDelay, getAdaptiveNoteDuration, getAudioContext, playSortedArray, playTone, resetLoop, valueToFrequency } from "../engine";
import type { VisualCallback } from "../types";

// 3-Way Quicksort
export const generate3WayQuickSort = async (size = 50, visualCallback?: VisualCallback, loop = true) => {
  resetLoop();
  
  // Wrap visual callback to be non-blocking
  const nonBlockingCallback = createNonBlockingVisualCallback(visualCallback);  
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
        nonBlockingCallback?.(arr, [i - 1, lt, gt]);
        await delay(getAdaptiveDelay(45, size));
      }
      
      await threeWayPartition(arr, low, lt - 1);
      await threeWayPartition(arr, gt + 1, high);
    };
    
    await threeWayPartition(array, 0, size - 1);
    await playSortedArray(array, size, nonBlockingCallback);
    
    if (!loop || activeLoop.stop) break;
    await delay(getAdaptiveDelay(200, size));
  }
};
