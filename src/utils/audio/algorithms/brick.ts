import { activeLoop, createNonBlockingVisualCallback, delay, generateUniqueRandomArray, getAdaptiveDelay, getAdaptiveNoteDuration, getAudioContext, playSortedArray, playTone, resetLoop, valueToFrequency } from "../engine";
import type { VisualCallback } from "../types";

// Brick Sort
export const generateBrickSort = async (size = 50, visualCallback?: VisualCallback, loop = true) => {
  resetLoop();
  
  // Wrap visual callback to be non-blocking
  const nonBlockingCallback = createNonBlockingVisualCallback(visualCallback);  
  while (!activeLoop.stop) {
    const array = Array.from({ length: size }, () => Math.floor(Math.random() * 100));
    const audioCtx = getAudioContext();
  
  let sorted = false;
  while (!sorted) {
    sorted = true;
    
    for (let i = 1; i < size - 1; i += 2) {
      if (activeLoop.stop) return;
      if (array[i] > array[i + 1]) {
        [array[i], array[i + 1]] = [array[i + 1], array[i]];
        sorted = false;
        playTone(valueToFrequency(array[i], 100), 0.02, audioCtx.currentTime);
        nonBlockingCallback?.(array, [i, i + 1]);
        await delay(getAdaptiveDelay(200, size));
      }
    }
    
    for (let i = 0; i < size - 1; i += 2) {
      if (activeLoop.stop) return;
      if (array[i] > array[i + 1]) {
        [array[i], array[i + 1]] = [array[i + 1], array[i]];
        sorted = false;
        playTone(valueToFrequency(array[i], 100), 0.02, audioCtx.currentTime);
        nonBlockingCallback?.(array, [i, i + 1]);
        await delay(getAdaptiveDelay(200, size));
      }
    }
  }
  
  await playSortedArray(array, size, nonBlockingCallback);
  
    if (!loop || activeLoop.stop) break;
    await delay(getAdaptiveDelay(200, size));
  }
};
