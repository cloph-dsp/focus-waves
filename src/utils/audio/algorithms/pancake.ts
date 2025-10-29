import { activeLoop, createNonBlockingVisualCallback, delay, generateUniqueRandomArray, getAdaptiveDelay, getAdaptiveNoteDuration, getAudioContext, playSortedArray, playTone, resetLoop, valueToFrequency } from "../engine";
import type { VisualCallback } from "../types";

// Pancake Sort - Flipping creates unique audio patterns
export const generatePancakeSort = async (size: number = 60, visualCallback?: VisualCallback, loop: boolean = true) => {
  resetLoop();
  
  // Wrap visual callback to be non-blocking
  const nonBlockingCallback = createNonBlockingVisualCallback(visualCallback);  
  while (!activeLoop.stop) {
    const array = generateUniqueRandomArray(size);
    const ctx = getAudioContext();
    const noteDuration = getAdaptiveNoteDuration(0.0085, size);
    
    const flip = async (arr: number[], k: number) => {
      let left = 0;
      while (left < k && !activeLoop.stop) {
        [arr[left], arr[k]] = [arr[k], arr[left]];
        playTone(valueToFrequency(arr[left], size), noteDuration, ctx.currentTime);
        playTone(valueToFrequency(arr[k], size), noteDuration, ctx.currentTime + noteDuration / 2);
        
        if (nonBlockingCallback) {
          nonBlockingCallback([...arr], [left, k]);
          await delay(getAdaptiveDelay(40, size));
        }
        left++;
        k--;
      }
    };
    
    const findMax = (arr: number[], n: number) => {
      let maxIdx = 0;
      for (let i = 0; i < n; i++) {
        if (arr[i] > arr[maxIdx]) maxIdx = i;
      }
      return maxIdx;
    };
    
    for (let currSize = array.length; currSize > 1 && !activeLoop.stop; currSize--) {
      const maxIdx = findMax(array, currSize);
      
      if (maxIdx !== currSize - 1) {
        if (maxIdx !== 0) {
          await flip(array, maxIdx);
        }
        await flip(array, currSize - 1);
      }
    }
    
    await playSortedArray(array, size, nonBlockingCallback);
    
    if (!loop || activeLoop.stop) break;
    await delay(getAdaptiveDelay(200, size));
  }
};
