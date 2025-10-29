import { activeLoop, createNonBlockingVisualCallback, delay, generateUniqueRandomArray, getAdaptiveDelay, getAdaptiveNoteDuration, getAudioContext, playSortedArray, playTone, resetLoop, valueToFrequency } from "../engine";
import type { VisualCallback } from "../types";

// Counting Sort - Integer counting creates clear sequential tones
export const generateCountingSort = async (size: number = 60, visualCallback?: VisualCallback, loop: boolean = true) => {
  resetLoop();
  
  // Wrap visual callback to be non-blocking
  const nonBlockingCallback = createNonBlockingVisualCallback(visualCallback);  
  while (!activeLoop.stop) {
    const array = generateUniqueRandomArray(size);
    const ctx = getAudioContext();
    const noteDuration = getAdaptiveNoteDuration(0.0075, size);
    
    const max = Math.max(...array);
    const count = new Array(max + 1).fill(0);
    
    for (let i = 0; i < array.length && !activeLoop.stop; i++) {
      count[array[i]]++;
    }
    
    let index = 0;
    for (let i = 0; i <= max && !activeLoop.stop; i++) {
      while (count[i] > 0 && !activeLoop.stop) {
        array[index] = i;
        playTone(valueToFrequency(i, size), noteDuration, ctx.currentTime);
        
        if (nonBlockingCallback) {
          nonBlockingCallback([...array], [index]);
          await delay(getAdaptiveDelay(45, size));
        }
        
        index++;
        count[i]--;
      }
    }
    
    await playSortedArray(array, size, nonBlockingCallback);
    
    if (!loop || activeLoop.stop) break;
    await delay(getAdaptiveDelay(200, size));
  }
};
