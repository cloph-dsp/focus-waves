import { activeLoop, createNonBlockingVisualCallback, delay, generateUniqueRandomArray, getAdaptiveDelay, getAdaptiveNoteDuration, getAudioContext, playSortedArray, playTone, resetLoop, valueToFrequency } from "../engine";
import type { VisualCallback } from "../types";

// Gnome Sort - Simple back-and-forth creates a unique rhythm
export const generateGnomeSort = async (size: number = 60, visualCallback?: VisualCallback, loop: boolean = true) => {
  resetLoop();
  
  // Wrap visual callback to be non-blocking
  const nonBlockingCallback = createNonBlockingVisualCallback(visualCallback);  
  while (!activeLoop.stop) {
    const array = generateUniqueRandomArray(size);
    const ctx = getAudioContext();
    const noteDuration = getAdaptiveNoteDuration(0.008, size);
    let i = 0;

    while (i < array.length && !activeLoop.stop) {
      if (i === 0 || array[i] >= array[i - 1]) {
        playTone(valueToFrequency(array[i], size), noteDuration / 2, ctx.currentTime);
        i++;
      } else {
        [array[i], array[i - 1]] = [array[i - 1], array[i]];
        playTone(valueToFrequency(array[i - 1], size), noteDuration, ctx.currentTime);
        
        if (nonBlockingCallback) {
          nonBlockingCallback([...array], [i, i - 1]);
          await delay(getAdaptiveDelay(200, size));
        }
        i--;
      }
    }
    
    await playSortedArray(array, size, nonBlockingCallback);
    
    if (!loop || activeLoop.stop) break;
    await delay(getAdaptiveDelay(200, size));
  }
};
