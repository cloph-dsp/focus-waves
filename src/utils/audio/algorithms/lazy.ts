import { activeLoop, createNonBlockingVisualCallback, delay, generateUniqueRandomArray, getAdaptiveDelay, getAdaptiveNoteDuration, getAudioContext, playSortedArray, playTone, resetLoop, valueToFrequency } from "../engine";
import type { VisualCallback } from "../types";

// Lazy Sort
export const generateLazySort = async (size = 50, visualCallback?: VisualCallback, loop = true) => {
  resetLoop();
  
  // Wrap visual callback to be non-blocking
  const nonBlockingCallback = createNonBlockingVisualCallback(visualCallback);  
  while (!activeLoop.stop) {
    const array = Array.from({ length: size }, () => Math.floor(Math.random() * 100));
    const audioCtx = getAudioContext();
    const pending: Array<[number, number]> = [];
    
    for (let i = 0; i < size - 1; i++) {
      if (array[i] > array[i + 1]) {
        pending.push([i, i + 1]);
      }
    }
    
    while (pending.length > 0) {
      if (activeLoop.stop) return;
      const [i, j] = pending.pop()!;
      if (array[i] > array[j]) {
        [array[i], array[j]] = [array[j], array[i]];
        playTone(valueToFrequency(array[i], 100), 0.02, audioCtx.currentTime);
        nonBlockingCallback?.(array, [i, j]);
        await delay(getAdaptiveDelay(200, size));
        
        if (i > 0 && array[i - 1] > array[i]) {
          pending.push([i - 1, i]);
        }
        if (j < size - 1 && array[j] > array[j + 1]) {
          pending.push([j, j + 1]);
        }
      }
    }
    
    await playSortedArray(array, size, nonBlockingCallback);
    
    if (!loop || activeLoop.stop) break;
    await delay(getAdaptiveDelay(200, size));
  }
};
