import { activeLoop, createNonBlockingVisualCallback, delay, generateUniqueRandomArray, getAdaptiveDelay, getAdaptiveNoteDuration, getAudioContext, playSortedArray, playTone, resetLoop, valueToFrequency } from "../engine";
import type { VisualCallback } from "../types";

// Slow Sort - Deliberately inefficient multiply-and-surrender
export const generateSlowSort = async (size: number = 30, visualCallback?: VisualCallback, loop: boolean = true) => {
  resetLoop();
  
  // Wrap visual callback to be non-blocking
  const nonBlockingCallback = createNonBlockingVisualCallback(visualCallback);  
  while (!activeLoop.stop) {
    const array = generateUniqueRandomArray(size);
    const ctx = getAudioContext();
    const noteDuration = getAdaptiveNoteDuration(0.008, size);
    
    const slowSort = async (arr: number[], i: number, j: number) => {
      if (i >= j || activeLoop.stop) return;
      
      const m = Math.floor((i + j) / 2);
      await slowSort(arr, i, m);
      await slowSort(arr, m + 1, j);
      
      if (arr[m] > arr[j]) {
        [arr[m], arr[j]] = [arr[j], arr[m]];
        playTone(valueToFrequency(arr[j], size), noteDuration, ctx.currentTime);
        
        if (nonBlockingCallback) {
          nonBlockingCallback([...arr], [m, j]);
          await delay(getAdaptiveDelay(55, size));
        }
      }
      
      await slowSort(arr, i, j - 1);
    };
    
    await slowSort(array, 0, array.length - 1);
    
    await playSortedArray(array, size, nonBlockingCallback);
    
    if (!loop || activeLoop.stop) break;
    await delay(getAdaptiveDelay(200, size));
  }
};
