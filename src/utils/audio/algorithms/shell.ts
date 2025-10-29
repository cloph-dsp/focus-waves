import { activeLoop, createNonBlockingVisualCallback, delay, generateUniqueRandomArray, getAdaptiveDelay, getAdaptiveNoteDuration, getAudioContext, playSortedArray, playTone, resetLoop, valueToFrequency } from "../engine";
import type { VisualCallback } from "../types";

// Shell Sort - Gap sequence creates rhythmic patterns
export const generateShellSort = async (size: number = 60, visualCallback?: VisualCallback, loop: boolean = true) => {
  resetLoop();
  
  // Wrap visual callback to be non-blocking
  const nonBlockingCallback = createNonBlockingVisualCallback(visualCallback);  
  while (!activeLoop.stop) {
    const array = generateUniqueRandomArray(size);
    const ctx = getAudioContext();
    const noteDuration = getAdaptiveNoteDuration(0.0075, size);
    const audioDelay = getAdaptiveDelay(200, size);

    for (let gap = Math.floor(array.length / 2); gap > 0 && !activeLoop.stop; gap = Math.floor(gap / 2)) {
      for (let i = gap; i < array.length && !activeLoop.stop; i++) {
        const temp = array[i];
        let j = i;
        
        while (j >= gap && array[j - gap] > temp && !activeLoop.stop) {
          array[j] = array[j - gap];
          playTone(valueToFrequency(array[j], size), noteDuration, ctx.currentTime);
          
          if (nonBlockingCallback) {
            nonBlockingCallback([...array], [j, j - gap]);
          }
          await delay(audioDelay);
          j -= gap;
        }
        array[j] = temp;
      }
    }
    
    await playSortedArray(array, size, nonBlockingCallback);
    
    if (!loop || activeLoop.stop) break;
    await delay(getAdaptiveDelay(200, size));
  }
};
