import { activeLoop, createNonBlockingVisualCallback, delay, generateUniqueRandomArray, getAdaptiveDelay, getAdaptiveNoteDuration, getAudioContext, playSortedArray, playTone, resetLoop, valueToFrequency } from "../engine";
import type { VisualCallback } from "../types";

// Quantum Bogosort - Destroy universe if not sorted
export const generateQuantumBogoSort = async (size: number = 60, visualCallback?: VisualCallback, loop: boolean = true) => {
  resetLoop();
  
  // Wrap visual callback to be non-blocking
  const nonBlockingCallback = createNonBlockingVisualCallback(visualCallback);  
  while (!activeLoop.stop) {
    const array = generateUniqueRandomArray(size);
    const ctx = getAudioContext();
    const noteDuration = getAdaptiveNoteDuration(0.0085, size);
    
    const isSorted = () => {
      for (let i = 0; i < array.length - 1; i++) {
        if (array[i] > array[i + 1]) return false;
      }
      return true;
    };
    
    let attempts = 0;
    while (!isSorted() && attempts < 50 && !activeLoop.stop) {
      for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
        playTone(valueToFrequency(array[i], size), noteDuration, ctx.currentTime);
      }
      
      if (nonBlockingCallback) {
        nonBlockingCallback([...array], []);
        await delay(getAdaptiveDelay(55, size));
      }
      attempts++;
    }
    
    if (!isSorted()) array.sort((a, b) => a - b);
    
    await playSortedArray(array, size, nonBlockingCallback);
    
    if (!loop || activeLoop.stop) break;
    await delay(getAdaptiveDelay(200, size));
  }
};
