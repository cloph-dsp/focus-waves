import { activeLoop, createNonBlockingVisualCallback, delay, generateUniqueRandomArray, getAdaptiveDelay, getAdaptiveNoteDuration, getAudioContext, playSortedArray, playTone, resetLoop, valueToFrequency } from "../engine";
import type { VisualCallback } from "../types";

// PDQ Sort
export const generatePDQSort = async (size = 50, visualCallback?: VisualCallback, loop = true) => {
  resetLoop();
  
  // Wrap visual callback to be non-blocking
  const nonBlockingCallback = createNonBlockingVisualCallback(visualCallback);  
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
        nonBlockingCallback?.(arr, [i, j]);
        await delay(getAdaptiveDelay(45, size));
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
              nonBlockingCallback?.(arr, [i, j]);
              await delay(getAdaptiveDelay(40, size));
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
  await playSortedArray(array, size, nonBlockingCallback);
  
    if (!loop || activeLoop.stop) break;
    await delay(getAdaptiveDelay(200, size));
  }
};
