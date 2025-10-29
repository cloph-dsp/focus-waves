import { activeLoop, createNonBlockingVisualCallback, delay, generateUniqueRandomArray, getAdaptiveDelay, getAdaptiveNoteDuration, getAudioContext, playSortedArray, playTone, resetLoop, valueToFrequency } from "../engine";
import type { VisualCallback } from "../types";

// American Flag Sort - In-place string/integer bucket sort
export const generateAmericanFlagSort = async (size: number = 60, visualCallback?: VisualCallback, loop: boolean = true) => {
  resetLoop();
  
  // Wrap visual callback to be non-blocking
  const nonBlockingCallback = createNonBlockingVisualCallback(visualCallback);  
  while (!activeLoop.stop) {
    const array = generateUniqueRandomArray(size);
    const ctx = getAudioContext();
    const noteDuration = getAdaptiveNoteDuration(0.0085, size);
    const maxDigits = Math.max(...array).toString().length;
    
    for (let digit = maxDigits - 1; digit >= 0 && !activeLoop.stop; digit--) {
      const buckets: number[][] = Array.from({ length: 10 }, () => []);
      
      for (let i = 0; i < array.length && !activeLoop.stop; i++) {
        const d = Math.floor(array[i] / Math.pow(10, digit)) % 10;
        buckets[d].push(array[i]);
        playTone(valueToFrequency(array[i], size), noteDuration, ctx.currentTime);
        
        if (nonBlockingCallback) {
          nonBlockingCallback([...array], [i]);
          await delay(getAdaptiveDelay(40, size));
        }
      }
      
      let index = 0;
      for (const bucket of buckets) {
        for (const val of bucket) {
          array[index++] = val;
        }
      }
    }
    
    await playSortedArray(array, size, nonBlockingCallback);
    
    if (!loop || activeLoop.stop) break;
    await delay(getAdaptiveDelay(200, size));
  }
};
