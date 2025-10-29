import { activeLoop, createNonBlockingVisualCallback, delay, generateUniqueRandomArray, getAdaptiveDelay, getAdaptiveNoteDuration, getAudioContext, playSortedArray, playTone, resetLoop, valueToFrequency } from "../engine";
import type { VisualCallback } from "../types";

// Pigeonhole Sort - Distribution into pigeonholes
export const generatePigeonholeSort = async (size: number = 60, visualCallback?: VisualCallback, loop: boolean = true) => {
  resetLoop();
  
  // Wrap visual callback to be non-blocking
  const nonBlockingCallback = createNonBlockingVisualCallback(visualCallback);  
  while (!activeLoop.stop) {
    const array = generateUniqueRandomArray(size);
    const ctx = getAudioContext();
    const noteDuration = getAdaptiveNoteDuration(0.0085, size);
    
    const min = Math.min(...array);
    const max = Math.max(...array);
    const range = max - min + 1;
    const holes = Array.from({ length: range }, () => [] as number[]);
    
    for (let i = 0; i < array.length && !activeLoop.stop; i++) {
      holes[array[i] - min].push(array[i]);
      playTone(valueToFrequency(array[i], size), noteDuration, ctx.currentTime);
      
      if (nonBlockingCallback) {
        nonBlockingCallback([...array], [i]);
        await delay(getAdaptiveDelay(45, size));
      }
    }
    
    let index = 0;
    for (let i = 0; i < range && !activeLoop.stop; i++) {
      for (const value of holes[i]) {
        array[index] = value;
        playTone(valueToFrequency(value, size), noteDuration, ctx.currentTime);
        
        if (nonBlockingCallback) {
          nonBlockingCallback([...array], [index]);
          await delay(getAdaptiveDelay(45, size));
        }
        index++;
      }
    }
    
    await playSortedArray(array, size, nonBlockingCallback);
    
    if (!loop || activeLoop.stop) break;
    await delay(getAdaptiveDelay(200, size));
  }
};
