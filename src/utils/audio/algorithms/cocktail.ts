import { activeLoop, createNonBlockingVisualCallback, delay, generateUniqueRandomArray, getAdaptiveDelay, getAdaptiveNoteDuration, getAudioContext, playSortedArray, playTone, resetLoop, valueToFrequency } from "../engine";
import type { VisualCallback } from "../types";

// Cocktail Sort - Bidirectional bubble creates flowing back-and-forth sounds
export const generateCocktailSort = async (size: number = 60, visualCallback?: VisualCallback, loop: boolean = true) => {
  resetLoop();
  
  // Wrap visual callback to be non-blocking
  const nonBlockingCallback = createNonBlockingVisualCallback(visualCallback);  
  while (!activeLoop.stop) {
    const array = generateUniqueRandomArray(size);
    const ctx = getAudioContext();
    const noteDuration = getAdaptiveNoteDuration(0.008, size);
    let swapped = true;
    let start = 0;
    let end = array.length - 1;

    while (swapped && !activeLoop.stop) {
      swapped = false;
      
      // Forward pass
      for (let i = start; i < end && !activeLoop.stop; i++) {
        if (array[i] > array[i + 1]) {
          [array[i], array[i + 1]] = [array[i + 1], array[i]];
          playTone(valueToFrequency(array[i], size), noteDuration, ctx.currentTime);
          swapped = true;
          
          if (nonBlockingCallback) {
            nonBlockingCallback([...array], [i, i + 1]);
            await delay(getAdaptiveDelay(55, size));
          }
        }
      }
      end--;
      
      if (!swapped || activeLoop.stop) break;
      swapped = false;
      
      // Backward pass
      for (let i = end - 1; i >= start && !activeLoop.stop; i--) {
        if (array[i] > array[i + 1]) {
          [array[i], array[i + 1]] = [array[i + 1], array[i]];
          playTone(valueToFrequency(array[i + 1], size), noteDuration, ctx.currentTime);
          swapped = true;
          
          if (nonBlockingCallback) {
            nonBlockingCallback([...array], [i, i + 1]);
            await delay(getAdaptiveDelay(55, size));
          }
        }
      }
      start++;
    }
    
    await playSortedArray(array, size, nonBlockingCallback);
    
    if (!loop || activeLoop.stop) break;
    await delay(getAdaptiveDelay(200, size));
  }
};
