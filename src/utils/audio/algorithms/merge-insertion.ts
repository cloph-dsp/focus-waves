import { activeLoop, createNonBlockingVisualCallback, delay, generateUniqueRandomArray, getAdaptiveDelay, getAdaptiveNoteDuration, getAudioContext, playSortedArray, playTone, resetLoop, valueToFrequency } from "../engine";
import type { VisualCallback } from "../types";

// Merge-Insertion Sort (Ford-Johnson)
export const generateMergeInsertionSort = async (size: number = 60, visualCallback?: VisualCallback, loop: boolean = true) => {
  resetLoop();
  
  // Wrap visual callback to be non-blocking
  const nonBlockingCallback = createNonBlockingVisualCallback(visualCallback);  
  while (!activeLoop.stop) {
    const array = generateUniqueRandomArray(size);
    const ctx = getAudioContext();
    const noteDuration = getAdaptiveNoteDuration(0.0075, size);
    
    if (array.length <= 1) {
      await playSortedArray(array, size, nonBlockingCallback);
      if (!loop || activeLoop.stop) break;
      await delay(getAdaptiveDelay(200, size));
      continue;
    }
    
    const pairs: [number, number][] = [];
    for (let i = 0; i < array.length - 1 && !activeLoop.stop; i += 2) {
      if (array[i] > array[i + 1]) {
        pairs.push([array[i + 1], array[i]]);
      } else {
        pairs.push([array[i], array[i + 1]]);
      }
      playTone(valueToFrequency(array[i], size), noteDuration, ctx.currentTime);
      
      if (nonBlockingCallback) {
        nonBlockingCallback([...array], [i, i + 1]);
        await delay(getAdaptiveDelay(200, size));
      }
    }
    
    const sorted = pairs.map(p => p[0]).sort((a, b) => a - b);
    for (const [_, larger] of pairs) {
      let pos = sorted.findIndex(x => x > larger);
      if (pos === -1) pos = sorted.length;
      sorted.splice(pos, 0, larger);
      playTone(valueToFrequency(larger, size), noteDuration, ctx.currentTime);
      
      if (nonBlockingCallback) {
        nonBlockingCallback([...sorted], [pos]);
        await delay(getAdaptiveDelay(200, size));
      }
    }
    
    for (let i = 0; i < sorted.length; i++) array[i] = sorted[i];
    
    await playSortedArray(array, size, nonBlockingCallback);
    
    if (!loop || activeLoop.stop) break;
    await delay(getAdaptiveDelay(200, size));
  }
};
