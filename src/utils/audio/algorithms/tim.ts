import { activeLoop, createNonBlockingVisualCallback, delay, generateUniqueRandomArray, getAdaptiveDelay, getAdaptiveNoteDuration, getAudioContext, playSortedArray, playTone, resetLoop, valueToFrequency } from "../engine";
import type { VisualCallback } from "../types";

// Tim Sort - Hybrid approach creates complex layered patterns
export const generateTimSort = async (size: number = 60, visualCallback?: VisualCallback, loop: boolean = true) => {
  resetLoop();
  
  // Wrap visual callback to be non-blocking
  const nonBlockingCallback = createNonBlockingVisualCallback(visualCallback);  
  while (!activeLoop.stop) {
    const array = generateUniqueRandomArray(size);
    const ctx = getAudioContext();
    const noteDuration = getAdaptiveNoteDuration(0.0085, size);
    const RUN = 32;
    
    // Insertion sort for small runs
    const insertionSort = async (arr: number[], left: number, right: number) => {
      for (let i = left + 1; i <= right && !activeLoop.stop; i++) {
        const temp = arr[i];
        let j = i - 1;
        while (j >= left && arr[j] > temp && !activeLoop.stop) {
          arr[j + 1] = arr[j];
          playTone(valueToFrequency(arr[j + 1], size), noteDuration, ctx.currentTime);
          
          if (nonBlockingCallback) {
            nonBlockingCallback([...arr], [j, j + 1]);
            await delay(getAdaptiveDelay(40, size));
          }
          j--;
        }
        arr[j + 1] = temp;
      }
    };
    
    // Merge function
    const merge = async (arr: number[], l: number, m: number, r: number) => {
      const len1 = m - l + 1;
      const len2 = r - m;
      const left = arr.slice(l, m + 1);
      const right = arr.slice(m + 1, r + 1);
      
      let i = 0, j = 0, k = l;
      
      while (i < len1 && j < len2 && !activeLoop.stop) {
        if (left[i] <= right[j]) {
          arr[k] = left[i];
          i++;
        } else {
          arr[k] = right[j];
          j++;
        }
        playTone(valueToFrequency(arr[k], size), noteDuration, ctx.currentTime);
        
        if (nonBlockingCallback) {
          nonBlockingCallback([...arr], [k]);
          await delay(getAdaptiveDelay(40, size));
        }
        k++;
      }
      
      while (i < len1 && !activeLoop.stop) {
        arr[k] = left[i];
        i++;
        k++;
      }
      
      while (j < len2 && !activeLoop.stop) {
        arr[k] = right[j];
        j++;
        k++;
      }
    };
    
    // Sort individual runs
    for (let i = 0; i < array.length && !activeLoop.stop; i += RUN) {
      await insertionSort(array, i, Math.min(i + RUN - 1, array.length - 1));
    }
    
    // Merge runs
    for (let runSize = RUN; runSize < array.length && !activeLoop.stop; runSize *= 2) {
      for (let left = 0; left < array.length && !activeLoop.stop; left += runSize * 2) {
        const mid = left + runSize - 1;
        const right = Math.min(left + runSize * 2 - 1, array.length - 1);
        
        if (mid < right) {
          await merge(array, left, mid, right);
        }
      }
    }
    
    await playSortedArray(array, size, nonBlockingCallback);
    
    if (!loop || activeLoop.stop) break;
    await delay(getAdaptiveDelay(200, size));
  }
};
