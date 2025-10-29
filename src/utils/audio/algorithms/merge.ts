import { activeLoop, createNonBlockingVisualCallback, delay, generateUniqueRandomArray, getAdaptiveDelay, getAdaptiveNoteDuration, getAudioContext, playSortedArray, playTone, resetLoop, valueToFrequency } from "../engine";
import type { VisualCallback } from "../types";

export const generateMergeSort = async (size: number = 60, visualCallback?: VisualCallback, loop: boolean = true) => {
  resetLoop();
  
  // Wrap visual callback to be non-blocking
  const nonBlockingCallback = createNonBlockingVisualCallback(visualCallback);  
  while (!activeLoop.stop) {
    const array = generateUniqueRandomArray(size);
    const ctx = getAudioContext();
    const noteDuration = getAdaptiveNoteDuration(0.007, size); // Longer for smooth merging sounds
    const audioDelay = getAdaptiveDelay(200, size); // Clear audio delay

    const merge = async (arr: number[], left: number, mid: number, right: number) => {
      const leftArr = arr.slice(left, mid + 1);
      const rightArr = arr.slice(mid + 1, right + 1);
      let i = 0, j = 0, k = left;

      while (i < leftArr.length && j < rightArr.length && !activeLoop.stop) {
        if (leftArr[i] <= rightArr[j]) {
          arr[k] = leftArr[i];
          playTone(valueToFrequency(arr[k], size), noteDuration, ctx.currentTime);
          i++;
        } else {
          arr[k] = rightArr[j];
          playTone(valueToFrequency(arr[k], size), noteDuration, ctx.currentTime);
          j++;
        }
        
        if (nonBlockingCallback) {
          nonBlockingCallback([...arr], [k]);
        }
        await delay(audioDelay);
        k++;
      }

      while (i < leftArr.length && !activeLoop.stop) {
        arr[k] = leftArr[i];
        playTone(valueToFrequency(arr[k], size), noteDuration, ctx.currentTime);
        i++;
        k++;
        
        if (nonBlockingCallback) {
          nonBlockingCallback([...arr], [k - 1]);
        }
        await delay(audioDelay);
      }

      while (j < rightArr.length && !activeLoop.stop) {
        arr[k] = rightArr[j];
        playTone(valueToFrequency(arr[k], size), noteDuration, ctx.currentTime);
        j++;
        k++;
        
        if (nonBlockingCallback) {
          nonBlockingCallback([...arr], [k - 1]);
        }
        await delay(audioDelay);
      }
    };

    const mergeSort = async (arr: number[], left: number, right: number) => {
      if (left < right && !activeLoop.stop) {
        const mid = Math.floor((left + right) / 2);
        await mergeSort(arr, left, mid);
        await mergeSort(arr, mid + 1, right);
        await merge(arr, left, mid, right);
      }
    };

    await mergeSort(array, 0, array.length - 1);
    
    await playSortedArray(array, size, nonBlockingCallback);
    
    if (!loop || activeLoop.stop) break;
    await delay(getAdaptiveDelay(200, size));
  }
};
