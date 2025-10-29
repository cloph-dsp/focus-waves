import { activeLoop, createNonBlockingVisualCallback, delay, generateUniqueRandomArray, getAdaptiveDelay, getAdaptiveNoteDuration, getAudioContext, playSortedArray, playTone, resetLoop, valueToFrequency } from "../engine";
import type { VisualCallback } from "../types";

// Dual-Pivot Quicksort
export const generateDualPivotQuickSort = async (size = 50, visualCallback?: VisualCallback, loop = true) => {
  resetLoop();
  
  // Wrap visual callback to be non-blocking
  const nonBlockingCallback = createNonBlockingVisualCallback(visualCallback);  
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
        nonBlockingCallback?.(arr, [i, lt, gt]);
        await delay(getAdaptiveDelay(45, size));
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
  await playSortedArray(array, size, nonBlockingCallback);
  
    if (!loop || activeLoop.stop) break;
    await delay(getAdaptiveDelay(200, size));
  }
};
