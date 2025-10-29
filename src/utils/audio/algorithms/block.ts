import { activeLoop, createNonBlockingVisualCallback, delay, generateUniqueRandomArray, getAdaptiveDelay, getAdaptiveNoteDuration, getAudioContext, playSortedArray, playTone, resetLoop, valueToFrequency } from "../engine";
import type { VisualCallback } from "../types";

// Block Sort - In-place stable merge
export const generateBlockSort = async (size: number = 60, visualCallback?: VisualCallback, loop: boolean = true) => {
  resetLoop();
  
  // Wrap visual callback to be non-blocking
  const nonBlockingCallback = createNonBlockingVisualCallback(visualCallback);  
  while (!activeLoop.stop) {
    const array = generateUniqueRandomArray(size);
    const ctx = getAudioContext();
    const noteDuration = getAdaptiveNoteDuration(0.0075, size);
    
    const blockSize = Math.floor(Math.sqrt(array.length));
    
    for (let i = 0; i < array.length && !activeLoop.stop; i += blockSize) {
      const end = Math.min(i + blockSize, array.length);
      for (let j = i + 1; j < end && !activeLoop.stop; j++) {
        const key = array[j];
        let k = j - 1;
        while (k >= i && array[k] > key && !activeLoop.stop) {
          array[k + 1] = array[k];
          playTone(valueToFrequency(array[k + 1], size), noteDuration, ctx.currentTime);
          
          if (nonBlockingCallback) {
            nonBlockingCallback([...array], [k, k + 1]);
            await delay(getAdaptiveDelay(45, size));
          }
          k--;
        }
        array[k + 1] = key;
      }
    }
    
    await playSortedArray(array, size, nonBlockingCallback);
    
    if (!loop || activeLoop.stop) break;
    await delay(getAdaptiveDelay(200, size));
  }
};
