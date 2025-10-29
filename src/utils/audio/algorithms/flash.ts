import { activeLoop, createNonBlockingVisualCallback, delay, generateUniqueRandomArray, getAdaptiveDelay, getAdaptiveNoteDuration, getAudioContext, playSortedArray, playTone, resetLoop, valueToFrequency } from "../engine";
import type { VisualCallback } from "../types";
import { generateInsertionSort } from "./insertion";

// Flash Sort - Classification-based distribution
export const generateFlashSort = async (size: number = 60, visualCallback?: VisualCallback, loop: boolean = true) => {
  resetLoop();
  
  // Wrap visual callback to be non-blocking
  const nonBlockingCallback = createNonBlockingVisualCallback(visualCallback);  
  while (!activeLoop.stop) {
    const array = generateUniqueRandomArray(size);
    const ctx = getAudioContext();
    const noteDuration = getAdaptiveNoteDuration(0.0085, size);
    const m = Math.floor(size * 0.43);
    
    const min = Math.min(...array);
    const max = Math.max(...array);
    const c1 = (m - 1) / (max - min);
    const L = new Array(m).fill(0);
    
    for (let i = 0; i < array.length && !activeLoop.stop; i++) {
      const k = Math.floor(c1 * (array[i] - min));
      L[k]++;
      playTone(valueToFrequency(array[i], size), noteDuration, ctx.currentTime);
      
      if (nonBlockingCallback) {
        nonBlockingCallback([...array], [i]);
        await delay(getAdaptiveDelay(40, size));
      }
    }
    
    for (let i = 1; i < m; i++) L[i] += L[i - 1];
    
    for (let i = 0; i < array.length && !activeLoop.stop; i++) {
      const k = Math.floor(c1 * (array[i] - min));
      while (i >= L[k] && !activeLoop.stop) {
        const j = L[k] - 1;
        [array[i], array[j]] = [array[j], array[i]];
        playTone(valueToFrequency(array[j], size), noteDuration, ctx.currentTime);
        
        if (nonBlockingCallback) {
          nonBlockingCallback([...array], [i, j]);
          await delay(getAdaptiveDelay(40, size));
        }
        L[k]--;
      }
    }
    
    await generateInsertionSort(size, visualCallback, false);
    
    await playSortedArray(array, size, nonBlockingCallback);
    
    if (!loop || activeLoop.stop) break;
    await delay(getAdaptiveDelay(200, size));
  }
};
