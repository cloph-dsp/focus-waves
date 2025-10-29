import { activeLoop, createNonBlockingVisualCallback, delay, generateUniqueRandomArray, getAdaptiveDelay, getAdaptiveNoteDuration, getAudioContext, playSortedArray, playTone, resetLoop, valueToFrequency } from "../engine";
import type { VisualCallback } from "../types";

// Bitonic Sort - Parallel sorting network with beautiful symmetry
export const generateBitonicSort = async (size: number = 64, visualCallback?: VisualCallback, loop: boolean = true) => {
  resetLoop();
  
  // Wrap visual callback to be non-blocking
  const nonBlockingCallback = createNonBlockingVisualCallback(visualCallback);  
  while (!activeLoop.stop) {
    const paddedSize = Math.pow(2, Math.ceil(Math.log2(size)));
    const uniqueArray = generateUniqueRandomArray(size);
    const array = Array.from({ length: paddedSize }, (_, i) => 
      i < size ? uniqueArray[i] : 0
    );
    const ctx = getAudioContext();
    const noteDuration = getAdaptiveNoteDuration(0.0085, size);
    
    const compAndSwap = async (arr: number[], i: number, j: number, dir: boolean) => {
      if ((arr[i] > arr[j] && dir) || (arr[i] < arr[j] && !dir)) {
        [arr[i], arr[j]] = [arr[j], arr[i]];
        playTone(valueToFrequency(arr[i], size), noteDuration, ctx.currentTime);
        
        if (nonBlockingCallback) {
          nonBlockingCallback([...arr].slice(0, size), [i, j]);
          await delay(getAdaptiveDelay(40, size));
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
    await delay(getAdaptiveDelay(200, size));
  }
};
