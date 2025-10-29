import { activeLoop, createNonBlockingVisualCallback, delay, generateUniqueRandomArray, getAdaptiveDelay, getAdaptiveNoteDuration, getAudioContext, playSortedArray, playTone, resetLoop, valueToFrequency } from "../engine";
import type { VisualCallback } from "../types";

// Radix Sort - Digit processing creates layered harmonic patterns
export const generateRadixSort = async (size: number = 60, visualCallback?: VisualCallback, loop: boolean = true) => {
  resetLoop();
  
  // Wrap visual callback to be non-blocking
  const nonBlockingCallback = createNonBlockingVisualCallback(visualCallback);  
  while (!activeLoop.stop) {
    const array = generateUniqueRandomArray(size);
    const ctx = getAudioContext();
    const noteDuration = getAdaptiveNoteDuration(0.0085, size);
    
    const getMax = (arr: number[]) => Math.max(...arr);
    
    const countingSort = async (arr: number[], exp: number) => {
      const output = new Array(arr.length);
      const count = new Array(10).fill(0);
      
      for (let i = 0; i < arr.length; i++) {
        const digit = Math.floor(arr[i] / exp) % 10;
        count[digit]++;
      }
      
      for (let i = 1; i < 10; i++) {
        count[i] += count[i - 1];
      }
      
      for (let i = arr.length - 1; i >= 0 && !activeLoop.stop; i--) {
        const digit = Math.floor(arr[i] / exp) % 10;
        output[count[digit] - 1] = arr[i];
        playTone(valueToFrequency(arr[i], size), noteDuration, ctx.currentTime);
        count[digit]--;
        
        if (nonBlockingCallback) {
          const tempArr = [...arr];
          for (let j = 0; j < output.length; j++) {
            if (output[j] !== undefined) tempArr[j] = output[j];
          }
          visualCallback(tempArr, [i]);
          await delay(getAdaptiveDelay(40, size));
        }
      }
      
      for (let i = 0; i < arr.length; i++) {
        arr[i] = output[i];
      }
    };
    
    const max = getMax(array);
    for (let exp = 1; Math.floor(max / exp) > 0 && !activeLoop.stop; exp *= 10) {
      await countingSort(array, exp);
    }
    
    await playSortedArray(array, size, nonBlockingCallback);
    
    if (!loop || activeLoop.stop) break;
    await delay(getAdaptiveDelay(200, size));
  }
};
