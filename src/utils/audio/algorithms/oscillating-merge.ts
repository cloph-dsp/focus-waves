import { activeLoop, createNonBlockingVisualCallback, delay, generateUniqueRandomArray, getAdaptiveDelay, getAdaptiveNoteDuration, getAudioContext, playSortedArray, playTone, resetLoop, valueToFrequency } from "../engine";
import type { VisualCallback } from "../types";

// Oscillating Merge Sort
export const generateOscillatingMergeSort = async (size = 50, visualCallback?: VisualCallback, loop = true) => {
  resetLoop();
  
  // Wrap visual callback to be non-blocking
  const nonBlockingCallback = createNonBlockingVisualCallback(visualCallback);  
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
        nonBlockingCallback?.(arr, [start + k]);
        await delay(getAdaptiveDelay(45, size));
      }
    };
    
    await oscillatingMerge(array, 0, size, true);
    await playSortedArray(array, size, nonBlockingCallback);
    
    if (!loop || activeLoop.stop) break;
    await delay(getAdaptiveDelay(200, size));
  }
};
