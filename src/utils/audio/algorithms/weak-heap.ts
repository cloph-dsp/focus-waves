import { activeLoop, createNonBlockingVisualCallback, delay, generateUniqueRandomArray, getAdaptiveDelay, getAdaptiveNoteDuration, getAudioContext, playSortedArray, playTone, resetLoop, valueToFrequency } from "../engine";
import type { VisualCallback } from "../types";

// Weak-Heap Sort
export const generateWeakHeapSort = async (size = 50, visualCallback?: VisualCallback, loop = true) => {
  resetLoop();
  
  // Wrap visual callback to be non-blocking
  const nonBlockingCallback = createNonBlockingVisualCallback(visualCallback);  
  while (!activeLoop.stop) {
    const array = Array.from({ length: size }, () => Math.floor(Math.random() * 100));
    const audioCtx = getAudioContext();
    const reverse = new Array(size).fill(0);
    
    const weakHeapify = async (i: number, n: number) => {
      let j = i;
      while (2 * j + 1 < n) {
        const child = 2 * j + 1 + reverse[j];
        if (array[child] > array[j]) {
          [array[j], array[child]] = [array[child], array[j]];
          reverse[j] = 1 - reverse[j];
          j = child;
        } else {
          break;
        }
      }
    };
    
    for (let i = size - 1; i > 0; i--) {
      if (activeLoop.stop) return;
      await weakHeapify(i, size);
    }
    
    for (let i = size - 1; i > 0; i--) {
      if (activeLoop.stop) return;
      [array[0], array[i]] = [array[i], array[0]];
      playTone(valueToFrequency(array[0], 100), 0.02, audioCtx.currentTime);
      nonBlockingCallback?.(array, [0, i]);
      await delay(getAdaptiveDelay(200, size));
      await weakHeapify(0, i);
    }
    
    await playSortedArray(array, size, nonBlockingCallback);
    
    if (!loop || activeLoop.stop) break;
    await delay(getAdaptiveDelay(200, size));
  }
};
