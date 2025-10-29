import { activeLoop, createNonBlockingVisualCallback, delay, generateUniqueRandomArray, getAdaptiveDelay, getAdaptiveNoteDuration, getAudioContext, playSortedArray, playTone, resetLoop, valueToFrequency } from "../engine";
import type { VisualCallback } from "../types";

// Multi-way merge sorts with distinct harmonies
export const generateMerge3Sort = async (size: number = 60, visualCallback?: VisualCallback, loop: boolean = true) => {
  resetLoop();
  const nonBlockingCallback = createNonBlockingVisualCallback(visualCallback);
  
  while (!activeLoop.stop) {
    const array = generateUniqueRandomArray(size);
    const ctx = getAudioContext();
    const noteDuration = getAdaptiveNoteDuration(0.0085, size);
    const audioDelay = getAdaptiveDelay(35, size);
    
    const merge3Way = async (arr: number[], left: number, mid1: number, mid2: number, right: number) => {
      const temp: number[] = [];
      let i = left, j = mid1, k = mid2;
      
      while (i < mid1 && j < mid2 && k < right && !activeLoop.stop) {
        const minVal = Math.min(arr[i], arr[j], arr[k]);
        if (arr[i] === minVal) {
          temp.push(arr[i++]);
        } else if (arr[j] === minVal) {
          temp.push(arr[j++]);
        } else {
          temp.push(arr[k++]);
        }
        playTone(valueToFrequency(temp[temp.length - 1], size), noteDuration, ctx.currentTime, 'sine');
        if (nonBlockingCallback) nonBlockingCallback([...arr], [i - 1, j - 1, k - 1]);
        await delay(audioDelay);
      }
      
      while (i < mid1 && j < mid2 && !activeLoop.stop) {
        if (arr[i] <= arr[j]) temp.push(arr[i++]);
        else temp.push(arr[j++]);
      }
      while (j < mid2 && k < right && !activeLoop.stop) {
        if (arr[j] <= arr[k]) temp.push(arr[j++]);
        else temp.push(arr[k++]);
      }
      while (i < mid1 && k < right && !activeLoop.stop) {
        if (arr[i] <= arr[k]) temp.push(arr[i++]);
        else temp.push(arr[k++]);
      }
      
      while (i < mid1 && !activeLoop.stop) temp.push(arr[i++]);
      while (j < mid2 && !activeLoop.stop) temp.push(arr[j++]);
      while (k < right && !activeLoop.stop) temp.push(arr[k++]);
      
      for (let idx = 0; idx < temp.length && !activeLoop.stop; idx++) {
        arr[left + idx] = temp[idx];
      }
    };
    
    const sort3Way = async (arr: number[], left: number, right: number) => {
      if (right - left < 2 || activeLoop.stop) return;
      const third = Math.floor((right - left) / 3);
      const mid1 = left + third;
      const mid2 = left + 2 * third;
      
      await sort3Way(arr, left, mid1);
      await sort3Way(arr, mid1, mid2);
      await sort3Way(arr, mid2, right);
      await merge3Way(arr, left, mid1, mid2, right);
    };
    
    await sort3Way(array, 0, array.length);
    await playSortedArray(array, size, nonBlockingCallback);
    if (!loop || activeLoop.stop) break;
    await delay(getAdaptiveDelay(200, size));
  }
};
