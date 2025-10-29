import { activeLoop, createNonBlockingVisualCallback, delay, generateUniqueRandomArray, getAdaptiveDelay, getAdaptiveNoteDuration, getAudioContext, playSortedArray, playTone, resetLoop, valueToFrequency } from "../engine";
import type { VisualCallback } from "../types";

// Gravity Sort - Abacus simulation
export const generateGravitySort = async (size: number = 60, visualCallback?: VisualCallback, loop: boolean = true) => {
  resetLoop();
  
  // Wrap visual callback to be non-blocking
  const nonBlockingCallback = createNonBlockingVisualCallback(visualCallback);  
  while (!activeLoop.stop) {
    const array = generateUniqueRandomArray(size);
    const ctx = getAudioContext();
    const noteDuration = getAdaptiveNoteDuration(0.0085, size);
    const max = Math.max(...array);
    const abacus: number[][] = Array.from({ length: array.length }, () => []);
    
    for (let i = 0; i < array.length && !activeLoop.stop; i++) {
      for (let j = 0; j < array[i]; j++) {
        abacus[i].push(1);
      }
      playTone(valueToFrequency(array[i], size), noteDuration, ctx.currentTime);
      
      if (nonBlockingCallback) {
        nonBlockingCallback([...array], [i]);
        await delay(getAdaptiveDelay(40, size));
      }
    }
    
    for (let col = 0; col < max && !activeLoop.stop; col++) {
      let sum = 0;
      for (let row = 0; row < array.length; row++) {
        if (col < abacus[row].length) sum++;
      }
      for (let row = array.length - 1, count = sum; count > 0; row--, count--) {
        while (abacus[row].length <= col) abacus[row].push(0);
        abacus[row][col] = 1;
      }
    }
    
    for (let i = 0; i < array.length && !activeLoop.stop; i++) {
      array[i] = abacus[i].filter(x => x === 1).length;
      playTone(valueToFrequency(array[i], size), noteDuration, ctx.currentTime);
      
      if (nonBlockingCallback) {
        nonBlockingCallback([...array], [i]);
        await delay(getAdaptiveDelay(40, size));
      }
    }
    
    await playSortedArray(array, size, nonBlockingCallback);
    
    if (!loop || activeLoop.stop) break;
    await delay(getAdaptiveDelay(200, size));
  }
};
