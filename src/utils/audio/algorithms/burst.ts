import { activeLoop, createNonBlockingVisualCallback, delay, generateUniqueRandomArray, getAdaptiveDelay, getAdaptiveNoteDuration, getAudioContext, playSortedArray, playTone, resetLoop, valueToFrequency } from "../engine";
import type { VisualCallback } from "../types";

// Burst Sort - Trie-based string sort
export const generateBurstSort = async (size: number = 60, visualCallback?: VisualCallback, loop: boolean = true) => {
  resetLoop();
  
  // Wrap visual callback to be non-blocking
  const nonBlockingCallback = createNonBlockingVisualCallback(visualCallback);  
  while (!activeLoop.stop) {
    const array = generateUniqueRandomArray(size);
    const ctx = getAudioContext();
    const noteDuration = getAdaptiveNoteDuration(0.0085, size);
    
    const buckets: Map<number, number[]> = new Map();
    for (let i = 0; i < array.length && !activeLoop.stop; i++) {
      const key = Math.floor(array[i] / 10);
      if (!buckets.has(key)) buckets.set(key, []);
      buckets.get(key)!.push(array[i]);
      playTone(valueToFrequency(array[i], size), noteDuration, ctx.currentTime);
      
      if (nonBlockingCallback) {
        nonBlockingCallback([...array], [i]);
        await delay(getAdaptiveDelay(40, size));
      }
    }
    
    let index = 0;
    for (const [_, bucket] of Array.from(buckets.entries()).sort((a, b) => a[0] - b[0])) {
      bucket.sort((a, b) => a - b);
      for (const val of bucket) {
        array[index++] = val;
        playTone(valueToFrequency(val, size), noteDuration, ctx.currentTime);
        
        if (nonBlockingCallback) {
          nonBlockingCallback([...array], [index - 1]);
          await delay(getAdaptiveDelay(40, size));
        }
      }
    }
    
    await playSortedArray(array, size, nonBlockingCallback);
    
    if (!loop || activeLoop.stop) break;
    await delay(getAdaptiveDelay(200, size));
  }
};
