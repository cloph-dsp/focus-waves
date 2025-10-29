import { activeLoop, createNonBlockingVisualCallback, delay, generateUniqueRandomArray, getAdaptiveDelay, getAdaptiveNoteDuration, getAudioContext, playSortedArray, playTone, resetLoop, valueToFrequency } from "../engine";
import type { VisualCallback } from "../types";

// Columnsort
export const generateColumnsort = async (size = 50, visualCallback?: VisualCallback, loop = true) => {
  resetLoop();
  
  // Wrap visual callback to be non-blocking
  const nonBlockingCallback = createNonBlockingVisualCallback(visualCallback);  
  while (!activeLoop.stop) {
    const array = Array.from({ length: size }, () => Math.floor(Math.random() * 100));
    const audioCtx = getAudioContext();
  
  const r = Math.ceil(Math.sqrt(size));
  const s = Math.ceil(size / r);
  
  const sortColumns = async () => {
    for (let col = 0; col < s; col++) {
      const indices = [];
      for (let row = 0; row < r && row * s + col < size; row++) {
        indices.push(row * s + col);
      }
      
      for (let i = 0; i < indices.length - 1; i++) {
        for (let j = i + 1; j < indices.length; j++) {
          if (activeLoop.stop) return;
          if (array[indices[i]] > array[indices[j]]) {
            [array[indices[i]], array[indices[j]]] = [array[indices[j]], array[indices[i]]];
            playTone(valueToFrequency(array[indices[i]], 100), 0.02, audioCtx.currentTime);
            nonBlockingCallback?.(array, indices);
            await delay(getAdaptiveDelay(45, size));
          }
        }
      }
    }
  };
  
  await sortColumns();
  await sortColumns();
  await sortColumns();
  
  await playSortedArray(array, size, nonBlockingCallback);
  
    if (!loop || activeLoop.stop) break;
    await delay(getAdaptiveDelay(200, size));
  }
};
