import { activeLoop, createNonBlockingVisualCallback, delay, generateUniqueRandomArray, getAdaptiveDelay, getAdaptiveNoteDuration, getAudioContext, playSortedArray, playTone, resetLoop, valueToFrequency } from "../engine";
import type { VisualCallback } from "../types";

// Franceschini Sort - In-place merge with O(1) space
export const generateFranceschiniSort = async (size: number = 60, visualCallback?: VisualCallback, loop: boolean = true) => {
  resetLoop();
  
  // Wrap visual callback to be non-blocking
  const nonBlockingCallback = createNonBlockingVisualCallback(visualCallback);  
  while (!activeLoop.stop) {
    const array = generateUniqueRandomArray(size);
    const ctx = getAudioContext();
    const noteDuration = getAdaptiveNoteDuration(0.0075, size);
    
    const mergeInPlace = async (left: number, mid: number, right: number) => {
      let start = left;
      let start2 = mid + 1;
      
      while (start <= mid && start2 <= right && !activeLoop.stop) {
        if (array[start] <= array[start2]) {
          start++;
        } else {
          const value = array[start2];
          let index = start2;
          
          while (index !== start && !activeLoop.stop) {
            array[index] = array[index - 1];
            playTone(valueToFrequency(array[index], size), noteDuration, ctx.currentTime);
            
            if (nonBlockingCallback) {
              nonBlockingCallback([...array], [index, index - 1]);
              await delay(getAdaptiveDelay(45, size));
            }
            index--;
          }
          array[start] = value;
          start++;
          mid++;
          start2++;
        }
      }
    };
    
    const mergeSort = async (left: number, right: number) => {
      if (left < right && !activeLoop.stop) {
        const mid = Math.floor((left + right) / 2);
        await mergeSort(left, mid);
        await mergeSort(mid + 1, right);
        await mergeInPlace(left, mid, right);
      }
    };
    
    await mergeSort(0, array.length - 1);
    
    await playSortedArray(array, size, nonBlockingCallback);
    
    if (!loop || activeLoop.stop) break;
    await delay(getAdaptiveDelay(200, size));
  }
};
