import { activeLoop, createNonBlockingVisualCallback, delay, generateUniqueRandomArray, getAdaptiveDelay, getAdaptiveNoteDuration, getAudioContext, playSortedArray, playTone, resetLoop, valueToFrequency } from "../engine";
import type { VisualCallback } from "../types";

// Cube Sort
export const generateCubeSort = async (size = 50, visualCallback?: VisualCallback, loop = true) => {
  resetLoop();
  
  // Wrap visual callback to be non-blocking
  const nonBlockingCallback = createNonBlockingVisualCallback(visualCallback);  
  while (!activeLoop.stop) {
    const array = Array.from({ length: size }, () => Math.floor(Math.random() * 100));
    const audioCtx = getAudioContext();
    
    const cubeRoot = Math.ceil(Math.cbrt(size));
    
    for (let phase = 0; phase < 3; phase++) {
      for (let block = 0; block < cubeRoot; block++) {
        for (let i = block * cubeRoot; i < Math.min((block + 1) * cubeRoot, size); i++) {
          for (let j = i + 1; j < Math.min((block + 1) * cubeRoot, size); j++) {
            if (activeLoop.stop) return;
            if (array[i] > array[j]) {
              [array[i], array[j]] = [array[j], array[i]];
              playTone(valueToFrequency(array[i], 100), 0.02, audioCtx.currentTime);
              nonBlockingCallback?.(array, [i, j]);
              await delay(getAdaptiveDelay(45, size));
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
