import { activeLoop, createNonBlockingVisualCallback, delay, generateUniqueRandomArray, getAdaptiveDelay, getAdaptiveNoteDuration, getAudioContext, playSortedArray, playTone, resetLoop, valueToFrequency } from "../engine";
import type { VisualCallback } from "../types";

export const generateInsertionSort = async (size: number = 60, visualCallback?: VisualCallback, loop: boolean = true) => {
  resetLoop();
  
  // Wrap visual callback to be non-blocking
  const nonBlockingCallback = createNonBlockingVisualCallback(visualCallback);  
  while (!activeLoop.stop) {
    const array = generateUniqueRandomArray(size);
    const ctx = getAudioContext();
    const noteDuration = getAdaptiveNoteDuration(0.008, size); // Longer for methodical placement
    const audioDelay = getAdaptiveDelay(55, size); // Clear audio

    for (let i = 1; i < array.length && !activeLoop.stop; i++) {
      const key = array[i];
      let j = i - 1;
      while (j >= 0 && array[j] > key && !activeLoop.stop) {
        array[j + 1] = array[j];
        playTone(valueToFrequency(array[j + 1], size), noteDuration, ctx.currentTime);
        
        if (nonBlockingCallback) {
          nonBlockingCallback([...array], [j, j + 1]);
        }
        await delay(audioDelay);
        j--;
      }
      array[j + 1] = key;
      playTone(valueToFrequency(key, size), noteDuration * 1.2, ctx.currentTime);
      
      if (nonBlockingCallback) {
        nonBlockingCallback([...array], [j + 1]);
      }
      await delay(audioDelay);
    }
    
    await playSortedArray(array, size, nonBlockingCallback);
    
    if (!loop || activeLoop.stop) break;
    await delay(getAdaptiveDelay(200, size));
  }
};
