import { activeLoop, createNonBlockingVisualCallback, delay, generateUniqueRandomArray, getAdaptiveDelay, getAdaptiveNoteDuration, getAudioContext, playSortedArray, playTone, resetLoop, valueToFrequency } from "../engine";
import type { VisualCallback } from "../types";

// Bucket Sort - Distribution creates smooth flowing sounds
export const generateBucketSort = async (size: number = 60, visualCallback?: VisualCallback, loop: boolean = true) => {
  resetLoop();
  
  // Wrap visual callback to be non-blocking
  const nonBlockingCallback = createNonBlockingVisualCallback(visualCallback);  
  while (!activeLoop.stop) {
    const array = generateUniqueRandomArray(size);
    const ctx = getAudioContext();
    const noteDuration = getAdaptiveNoteDuration(0.0075, size);
    
    const bucketCount = 10;
    const buckets: number[][] = Array.from({ length: bucketCount }, () => []);
    const max = Math.max(...array);
    
    // Distribute into buckets
    for (let i = 0; i < array.length && !activeLoop.stop; i++) {
      const bucketIndex = Math.min(Math.floor((array[i] / max) * (bucketCount - 1)), bucketCount - 1);
      buckets[bucketIndex].push(array[i]);
      playTone(valueToFrequency(array[i], size), noteDuration / 2, ctx.currentTime);
    }
    
    // Sort each bucket and place back
    let index = 0;
    for (let i = 0; i < bucketCount && !activeLoop.stop; i++) {
      buckets[i].sort((a, b) => a - b);
      for (let j = 0; j < buckets[i].length && !activeLoop.stop; j++) {
        array[index] = buckets[i][j];
        playTone(valueToFrequency(array[index], size), noteDuration, ctx.currentTime);
        
        if (nonBlockingCallback) {
          nonBlockingCallback([...array], [index]);
          await delay(getAdaptiveDelay(200, size));
        }
        index++;
      }
    }
    
    await playSortedArray(array, size, nonBlockingCallback);
    
    if (!loop || activeLoop.stop) break;
    await delay(getAdaptiveDelay(200, size));
  }
};
