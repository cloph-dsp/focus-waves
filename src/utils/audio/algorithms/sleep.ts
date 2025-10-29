import { activeLoop, createNonBlockingVisualCallback, delay, generateUniqueRandomArray, getAdaptiveDelay, getAdaptiveNoteDuration, getAudioContext, playSortedArray, playTone, resetLoop, valueToFrequency } from "../engine";
import type { VisualCallback } from "../types";

// Sleep Sort - Silly thread-based sort
export const generateSleepSort = async (size: number = 60, visualCallback?: VisualCallback, loop: boolean = true) => {
  resetLoop();
  
  // Wrap visual callback to be non-blocking
  const nonBlockingCallback = createNonBlockingVisualCallback(visualCallback);  
  while (!activeLoop.stop) {
    const array = generateUniqueRandomArray(size);
    const ctx = getAudioContext();
    const noteDuration = getAdaptiveNoteDuration(0.0085, size);
    const result: number[] = [];
    const promises: Promise<void>[] = [];
    
    for (let i = 0; i < array.length && !activeLoop.stop; i++) {
      const value = array[i];
      promises.push(
        new Promise<void>(resolve => {
          setTimeout(() => {
            result.push(value);
            playTone(valueToFrequency(value, size), noteDuration, ctx.currentTime);
            resolve();
          }, value * 5);
        })
      );
    }
    
    await Promise.all(promises);
    
    for (let i = 0; i < result.length && !activeLoop.stop; i++) {
      array[i] = result[i];
      if (nonBlockingCallback) {
        nonBlockingCallback([...array], [i]);
        await delay(getAdaptiveDelay(35, size));
      }
    }
    
    await playSortedArray(array, size, nonBlockingCallback);
    
    if (!loop || activeLoop.stop) break;
    await delay(getAdaptiveDelay(200, size));
  }
};
