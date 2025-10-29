import { activeLoop, createNonBlockingVisualCallback, delay, generateUniqueRandomArray, getAdaptiveDelay, getAdaptiveNoteDuration, getAudioContext, playSortedArray, playTone, resetLoop, valueToFrequency } from "../engine";
import type { VisualCallback } from "../types";

// Miracle Sort - Wait for cosmic rays
export const generateMiracleSort = async (size: number = 60, visualCallback?: VisualCallback, loop: boolean = true) => {
  resetLoop();
  
  // Wrap visual callback to be non-blocking
  const nonBlockingCallback = createNonBlockingVisualCallback(visualCallback);  
  while (!activeLoop.stop) {
    const array = generateUniqueRandomArray(size);
    const ctx = getAudioContext();
    const noteDuration = getAdaptiveNoteDuration(0.013, size);
    
    const isSorted = () => {
      for (let i = 0; i < array.length - 1; i++) {
        if (array[i] > array[i + 1]) return false;
      }
      return true;
    };
    
    let checks = 0;
    while (!isSorted() && checks < 100 && !activeLoop.stop) {
      for (let i = 0; i < array.length; i++) {
        playTone(valueToFrequency(array[i], size), noteDuration / 4, ctx.currentTime);
      }
      
      if (nonBlockingCallback) {
        nonBlockingCallback([...array], []);
        await delay(getAdaptiveDelay(70, size));
      }
      checks++;
    }
    
    if (!isSorted()) array.sort((a, b) => a - b);
    
    await playSortedArray(array, size, nonBlockingCallback);
    
    if (!loop || activeLoop.stop) break;
    await delay(getAdaptiveDelay(200, size));
  }
};
