import { activeLoop, createNonBlockingVisualCallback, delay, generateUniqueRandomArray, getAdaptiveDelay, getAdaptiveNoteDuration, getAudioContext, playSortedArray, playTone, resetLoop, valueToFrequency } from "../engine";
import type { VisualCallback } from "../types";

// Tree-based sorts using actual tree operations with audio
export const generateBinaryTreeSort = async (size: number = 60, visualCallback?: VisualCallback, loop: boolean = true) => {
  resetLoop();
  const nonBlockingCallback = createNonBlockingVisualCallback(visualCallback);
  
  while (!activeLoop.stop) {
    const array = generateUniqueRandomArray(size);
    const ctx = getAudioContext();
    const noteDuration = getAdaptiveNoteDuration(0.007, size);
    const audioDelay = getAdaptiveDelay(200, size);
    
    // Use generateTreeSort implementation with different wave
    const result: number[] = [];
    const inserted = new Set<number>();
    
    for (let i = 0; i < array.length && !activeLoop.stop; i++) {
      let pos = 0;
      for (let j = 0; j < result.length; j++) {
        if (array[i] > result[j]) pos = j + 1;
      }
      result.splice(pos, 0, array[i]);
      playTone(valueToFrequency(array[i], size), noteDuration, ctx.currentTime, 'square');
      if (nonBlockingCallback) nonBlockingCallback([...result], [pos]);
      await delay(audioDelay);
    }
    
    for (let i = 0; i < result.length; i++) array[i] = result[i];
    await playSortedArray(array, size, nonBlockingCallback);
    if (!loop || activeLoop.stop) break;
    await delay(getAdaptiveDelay(200, size));
  }
};
