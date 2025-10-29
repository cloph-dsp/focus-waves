import { activeLoop, createNonBlockingVisualCallback, delay, generateUniqueRandomArray, getAdaptiveDelay, getAdaptiveNoteDuration, getAudioContext, playSortedArray, playTone, resetLoop, valueToFrequency } from "../engine";
import type { VisualCallback } from "../types";

// Bogobogo Sort - Extreme chaos (limited iterations for sanity)
export const generateBogobogoSort = async (size: number = 20, visualCallback?: VisualCallback, loop: boolean = true) => {
  resetLoop();
  
  // Wrap visual callback to be non-blocking
  const nonBlockingCallback = createNonBlockingVisualCallback(visualCallback);  
  while (!activeLoop.stop) {
    const array = generateUniqueRandomArray(size);
    const ctx = getAudioContext();
    const noteDuration = getAdaptiveNoteDuration(0.008, size);
    let attempts = 0;
    const maxAttempts = 1000; // Safety limit
    
    const isSorted = (arr: number[], n: number) => {
      for (let i = 0; i < n - 1; i++) {
        if (arr[i] > arr[i + 1]) return false;
      }
      return true;
    };
    
    const shuffle = async (arr: number[], n: number) => {
      for (let i = n - 1; i > 0 && !activeLoop.stop; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
        playTone(valueToFrequency(arr[i], size), noteDuration, ctx.currentTime);
        
        if (nonBlockingCallback) {
          nonBlockingCallback([...arr], [i, j]);
          await delay(getAdaptiveDelay(40, size));
        }
      }
    };
    
    const bogobogoSort = async (arr: number[], n: number): Promise<void> => {
      if (n <= 1 || activeLoop.stop || attempts >= maxAttempts) return;
      
      while (!isSorted(arr, n) && !activeLoop.stop && attempts < maxAttempts) {
        await bogobogoSort(arr, n - 1);
        await shuffle(arr, n);
        attempts++;
      }
    };
    
    await bogobogoSort(array, array.length);
    
    // Force sort if it didn't finish (for demo purposes)
    if (attempts >= maxAttempts) {
      array.sort((a, b) => a - b);
    }
    
    await playSortedArray(array, size, nonBlockingCallback);
    
    if (!loop || activeLoop.stop) break;
    await delay(getAdaptiveDelay(200, size));
  }
};
