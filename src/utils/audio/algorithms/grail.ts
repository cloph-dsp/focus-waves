import { activeLoop, createNonBlockingVisualCallback, delay, generateUniqueRandomArray, getAdaptiveDelay, getAdaptiveNoteDuration, getAudioContext, playSortedArray, playTone, resetLoop, valueToFrequency } from "../engine";
import type { VisualCallback } from "../types";

// Grail Sort
export const generateGrailSort = async (size = 50, visualCallback?: VisualCallback, loop = true) => {
  resetLoop();
  
  // Wrap visual callback to be non-blocking
  const nonBlockingCallback = createNonBlockingVisualCallback(visualCallback);  
  while (!activeLoop.stop) {
    const array = Array.from({ length: size }, () => Math.floor(Math.random() * 100));
    const audioCtx = getAudioContext();
    
    const rotate = async (arr: number[], start: number, mid: number, end: number) => {
      while (start < mid && mid < end) {
        if (activeLoop.stop) return;
        [arr[start], arr[mid]] = [arr[mid], arr[start]];
        playTone(valueToFrequency(arr[start], 100), 0.02, audioCtx.currentTime);
        nonBlockingCallback?.(arr, [start, mid]);
        await delay(getAdaptiveDelay(40, size));
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
        nonBlockingCallback?.(arr, [i, j]);
        await delay(getAdaptiveDelay(45, size));
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
    
    await playSortedArray(array, size, nonBlockingCallback);
    
    if (!loop || activeLoop.stop) break;
    await delay(getAdaptiveDelay(200, size));
  }
};
