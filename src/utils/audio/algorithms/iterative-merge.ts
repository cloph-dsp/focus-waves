import { activeLoop, createNonBlockingVisualCallback, delay, generateUniqueRandomArray, getAdaptiveDelay, getAdaptiveNoteDuration, getAudioContext, playSortedArray, playTone, resetLoop, valueToFrequency } from "../engine";
import type { VisualCallback } from "../types";

// Iterative Merge - Bottom-up steady rhythm
export const generateIterativeMergeSort = async (size: number = 60, visualCallback?: VisualCallback, loop: boolean = true) => {
  resetLoop();
  
  // Wrap visual callback to be non-blocking
  const nonBlockingCallback = createNonBlockingVisualCallback(visualCallback);
  
  while (!activeLoop.stop) {
    const array = generateUniqueRandomArray(size);
    const ctx = getAudioContext();
    const noteDuration = getAdaptiveNoteDuration(0.0085, size);
    const audioDelay = getAdaptiveDelay(40, size);
    
    for (let width = 1; width < array.length && !activeLoop.stop; width *= 2) {
      for (let i = 0; i < array.length && !activeLoop.stop; i += width * 2) {
        const left = i;
        const mid = Math.min(i + width, array.length);
        const right = Math.min(i + width * 2, array.length);
        const leftArr = array.slice(left, mid);
        const rightArr = array.slice(mid, right);
        let l = 0, r = 0, k = left;
        
        while (l < leftArr.length && r < rightArr.length && !activeLoop.stop) {
          if (leftArr[l] <= rightArr[r]) {
            array[k++] = leftArr[l++];
          } else {
            array[k++] = rightArr[r++];
          }
          playTone(valueToFrequency(array[k - 1], size), noteDuration, ctx.currentTime);
          if (nonBlockingCallback) nonBlockingCallback([...array], [k - 1]);
          await delay(audioDelay);
        }
        while (l < leftArr.length && !activeLoop.stop) array[k++] = leftArr[l++];
        while (r < rightArr.length && !activeLoop.stop) array[k++] = rightArr[r++];
      }
    }
    
    await playSortedArray(array, size, nonBlockingCallback);
    if (!loop || activeLoop.stop) break;
    await delay(getAdaptiveDelay(200, size));
  }
};
