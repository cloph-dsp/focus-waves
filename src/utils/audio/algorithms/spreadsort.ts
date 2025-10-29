import { activeLoop, createNonBlockingVisualCallback, delay, generateUniqueRandomArray, getAdaptiveDelay, getAdaptiveNoteDuration, getAudioContext, playSortedArray, playTone, resetLoop, valueToFrequency } from "../engine";
import type { VisualCallback } from "../types";

// Spreadsort
export const generateSpreadsort = async (size = 50, visualCallback?: VisualCallback, loop = true) => {
  resetLoop();
  
  // Wrap visual callback to be non-blocking
  const nonBlockingCallback = createNonBlockingVisualCallback(visualCallback);  
  while (!activeLoop.stop) {
    const array = Array.from({ length: size }, () => Math.floor(Math.random() * 100));
    const audioCtx = getAudioContext();
  
  const max = Math.max(...array);
  const bucketCount = Math.min(size, 10);
  const buckets: number[][] = Array.from({ length: bucketCount }, () => []);
  
  for (let i = 0; i < size; i++) {
    if (activeLoop.stop) return;
    const bucketIndex = Math.floor((array[i] / max) * (bucketCount - 1));
    buckets[bucketIndex].push(array[i]);
    playTone(valueToFrequency(array[i], 100), 0.02, audioCtx.currentTime);
    nonBlockingCallback?.(array, [i]);
    await delay(getAdaptiveDelay(35, size));
  }
  
  let index = 0;
  for (const bucket of buckets) {
    bucket.sort((a, b) => a - b);
    for (const value of bucket) {
      if (activeLoop.stop) return;
      array[index] = value;
      playTone(valueToFrequency(value, 100), 0.02, audioCtx.currentTime);
      nonBlockingCallback?.(array, [index]);
      await delay(getAdaptiveDelay(40, size));
      index++;
    }
  }
  
  await playSortedArray(array, size, nonBlockingCallback);
  
    if (!loop || activeLoop.stop) break;
    await delay(getAdaptiveDelay(200, size));
  }
};
