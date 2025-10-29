import { activeLoop, createNonBlockingVisualCallback, delay, generateUniqueRandomArray, getAdaptiveDelay, getAdaptiveNoteDuration, getAudioContext, playSortedArray, playTone, resetLoop, valueToFrequency } from "../engine";
import type { VisualCallback } from "../types";

// Comb Sort - Shrinking gaps create interesting pitch patterns
export const generateCombSort = async (size: number = 60, visualCallback?: VisualCallback, loop: boolean = true) => {
  resetLoop();
  
  // Wrap visual callback to be non-blocking
  const nonBlockingCallback = createNonBlockingVisualCallback(visualCallback);  
  while (!activeLoop.stop) {
    const array = generateUniqueRandomArray(size);
    const ctx = getAudioContext();
    const noteDuration = getAdaptiveNoteDuration(0.0075, size);
    const shrink = 1.3;
    let gap = array.length;
    let sorted = false;

    while (!sorted && !activeLoop.stop) {
      gap = Math.floor(gap / shrink);
      if (gap <= 1) {
        gap = 1;
        sorted = true;
      }

      for (let i = 0; i + gap < array.length && !activeLoop.stop; i++) {
        if (array[i] > array[i + gap]) {
          [array[i], array[i + gap]] = [array[i + gap], array[i]];
          playTone(valueToFrequency(array[i], size), noteDuration, ctx.currentTime);
          sorted = false;
          
          if (nonBlockingCallback) {
            nonBlockingCallback([...array], [i, i + gap]);
            await delay(getAdaptiveDelay(45, size));
          }
        }
      }
    }
    
    await playSortedArray(array, size, nonBlockingCallback);
    
    if (!loop || activeLoop.stop) break;
    await delay(getAdaptiveDelay(200, size));
  }
};
