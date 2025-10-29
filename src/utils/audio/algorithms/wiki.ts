import { activeLoop, createNonBlockingVisualCallback, delay, generateUniqueRandomArray, getAdaptiveDelay, getAdaptiveNoteDuration, getAudioContext, playSortedArray, playTone, resetLoop, valueToFrequency } from "../engine";
import type { VisualCallback } from "../types";

// Wiki Sort (Block Merge Sort)
export const generateWikiSort = async (size = 50, visualCallback?: VisualCallback, loop = true) => {
  resetLoop();
  
  // Wrap visual callback to be non-blocking
  const nonBlockingCallback = createNonBlockingVisualCallback(visualCallback);  
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
        nonBlockingCallback?.(arr, [start + k]);
        await delay(getAdaptiveDelay(40, size));
      }
    };
    
    await wikiSortHelper(array, 0, size);
    await playSortedArray(array, size, nonBlockingCallback);
    
    if (!loop || activeLoop.stop) break;
    await delay(getAdaptiveDelay(200, size));
  }
};
