import { activeLoop, createNonBlockingVisualCallback, delay, generateUniqueRandomArray, getAdaptiveDelay, getAdaptiveNoteDuration, getAudioContext, playSortedArray, playTone, resetLoop, valueToFrequency } from "../engine";
import type { VisualCallback } from "../types";

// ADDITIONAL AUDIO-FOCUSED ALGORITHMS

// Recursive Bubble - Bubbling with recursive echoes
export const generateRecursiveBubbleSort = async (size: number = 60, visualCallback?: VisualCallback, loop: boolean = true) => {
  resetLoop();
  
  // Wrap visual callback to be non-blocking
  const nonBlockingCallback = createNonBlockingVisualCallback(visualCallback);
  
  while (!activeLoop.stop) {
    const array = generateUniqueRandomArray(size);
    const ctx = getAudioContext();
    const noteDuration = getAdaptiveNoteDuration(0.008, size);
    const audioDelay = getAdaptiveDelay(45, size);
    
    const recursiveBubble = async (arr: number[], n: number) => {
      if (n === 1 || activeLoop.stop) return;
      for (let i = 0; i < n - 1 && !activeLoop.stop; i++) {
        if (arr[i] > arr[i + 1]) {
          [arr[i], arr[i + 1]] = [arr[i + 1], arr[i]];
          playTone(valueToFrequency(arr[i], size), noteDuration, ctx.currentTime);
          if (nonBlockingCallback) nonBlockingCallback([...arr], [i, i + 1]);
          await delay(audioDelay);
        }
      }
      await recursiveBubble(arr, n - 1);
    };
    
    await recursiveBubble(array, array.length);
    await playSortedArray(array, size, nonBlockingCallback);
    if (!loop || activeLoop.stop) break;
    await delay(getAdaptiveDelay(200, size));
  }
};
