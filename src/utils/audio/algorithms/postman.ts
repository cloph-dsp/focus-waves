import { activeLoop, createNonBlockingVisualCallback, delay, generateUniqueRandomArray, getAdaptiveDelay, getAdaptiveNoteDuration, getAudioContext, playSortedArray, playTone, resetLoop, valueToFrequency } from "../engine";
import type { VisualCallback } from "../types";

// Postman Sort - Multi-pass distribution
export const generatePostmanSort = async (size: number = 60, visualCallback?: VisualCallback, loop: boolean = true) => {
  resetLoop();
  
  // Wrap visual callback to be non-blocking
  const nonBlockingCallback = createNonBlockingVisualCallback(visualCallback);  
  while (!activeLoop.stop) {
    const array = generateUniqueRandomArray(size);
    const ctx = getAudioContext();
    const noteDuration = getAdaptiveNoteDuration(0.0085, size);
    const buckets = 10;
    
    for (let pass = 0; pass < 2 && !activeLoop.stop; pass++) {
      const bins: number[][] = Array.from({ length: buckets }, () => []);
      
      for (let i = 0; i < array.length && !activeLoop.stop; i++) {
        const bin = Math.floor((array[i] / size) * (buckets - 1));
        bins[bin].push(array[i]);
        playTone(valueToFrequency(array[i], size), noteDuration, ctx.currentTime);
        
        if (nonBlockingCallback) {
          nonBlockingCallback([...array], [i]);
          await delay(getAdaptiveDelay(40, size));
        }
      }
      
      let index = 0;
      for (const bin of bins) {
        bin.sort((a, b) => a - b);
        for (const val of bin) {
          array[index++] = val;
        }
      }
    }
    
    await playSortedArray(array, size, nonBlockingCallback);
    
    if (!loop || activeLoop.stop) break;
    await delay(getAdaptiveDelay(200, size));
  }
};
