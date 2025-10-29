import { activeLoop, createNonBlockingVisualCallback, delay, generateUniqueRandomArray, getAdaptiveDelay, getAdaptiveNoteDuration, getAudioContext, playSortedArray, playTone, resetLoop, valueToFrequency } from "../engine";
import type { VisualCallback } from "../types";

// Odd-Even Sort - Alternating phases create distinct patterns
export const generateOddEvenSort = async (size: number = 60, visualCallback?: VisualCallback, loop: boolean = true) => {
  resetLoop();
  
  // Wrap visual callback to be non-blocking
  const nonBlockingCallback = createNonBlockingVisualCallback(visualCallback);  
  while (!activeLoop.stop) {
    const array = generateUniqueRandomArray(size);
    const ctx = getAudioContext();
    const noteDuration = getAdaptiveNoteDuration(0.0075, size);
    let sorted = false;

    while (!sorted && !activeLoop.stop) {
      sorted = true;
      
      // Odd phase
      for (let i = 1; i < array.length - 1 && !activeLoop.stop; i += 2) {
        if (array[i] > array[i + 1]) {
          [array[i], array[i + 1]] = [array[i + 1], array[i]];
          playTone(valueToFrequency(array[i], size), noteDuration, ctx.currentTime);
          sorted = false;
          
          if (nonBlockingCallback) {
            nonBlockingCallback([...array], [i, i + 1]);
            await delay(getAdaptiveDelay(200, size));
          }
        }
      }
      
      // Even phase
      for (let i = 0; i < array.length - 1 && !activeLoop.stop; i += 2) {
        if (array[i] > array[i + 1]) {
          [array[i], array[i + 1]] = [array[i + 1], array[i]];
          playTone(valueToFrequency(array[i + 1], size), noteDuration, ctx.currentTime);
          sorted = false;
          
          if (nonBlockingCallback) {
            nonBlockingCallback([...array], [i, i + 1]);
            await delay(getAdaptiveDelay(200, size));
          }
        }
      }
    }
    
    await playSortedArray(array, size, nonBlockingCallback);
    
    if (!loop || activeLoop.stop) break;
    await delay(getAdaptiveDelay(200, size));
  }
};
