import { activeLoop, createNonBlockingVisualCallback, delay, generateUniqueRandomArray, getAdaptiveDelay, getAdaptiveNoteDuration, getAudioContext, playSortedArray, playTone, resetLoop, valueToFrequency } from "../engine";
import type { VisualCallback } from "../types";

// Network Sort - Fixed comparator network
export const generateNetworkSort = async (size: number = 60, visualCallback?: VisualCallback, loop: boolean = true) => {
  resetLoop();
  
  // Wrap visual callback to be non-blocking
  const nonBlockingCallback = createNonBlockingVisualCallback(visualCallback);  
  while (!activeLoop.stop) {
    const array = generateUniqueRandomArray(size);
    const ctx = getAudioContext();
    const noteDuration = getAdaptiveNoteDuration(0.0075, size);
    
    const compare = async (i: number, j: number) => {
      if (i < array.length && j < array.length && array[i] > array[j]) {
        [array[i], array[j]] = [array[j], array[i]];
        playTone(valueToFrequency(array[i], size), noteDuration, ctx.currentTime);
        playTone(valueToFrequency(array[j], size), noteDuration, ctx.currentTime + noteDuration / 2);
        
        if (nonBlockingCallback) {
          nonBlockingCallback([...array], [i, j]);
          await delay(getAdaptiveDelay(200, size));
        }
      }
    };
    
    const n = array.length;
    for (let k = 2; k <= n && !activeLoop.stop; k *= 2) {
      for (let j = k / 2; j > 0 && !activeLoop.stop; j /= 2) {
        for (let i = 0; i < n && !activeLoop.stop; i++) {
          const l = i ^ j;
          if (l > i) {
            if ((i & k) === 0) {
              await compare(i, l);
            } else {
              await compare(l, i);
            }
          }
        }
      }
    }
    
    await playSortedArray(array, size, nonBlockingCallback);
    
    if (!loop || activeLoop.stop) break;
    await delay(getAdaptiveDelay(200, size));
  }
};
