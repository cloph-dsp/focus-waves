import { activeLoop, createNonBlockingVisualCallback, delay, generateUniqueRandomArray, getAdaptiveDelay, getAdaptiveNoteDuration, getAudioContext, playSortedArray, playTone, resetLoop, valueToFrequency } from "../engine";
import type { VisualCallback } from "../types";

// Strand Sort - Extract sorted sublists and merge
export const generateStrandSort = async (size: number = 60, visualCallback?: VisualCallback, loop: boolean = true) => {
  resetLoop();
  
  // Wrap visual callback to be non-blocking
  const nonBlockingCallback = createNonBlockingVisualCallback(visualCallback);  
  while (!activeLoop.stop) {
    const array = generateUniqueRandomArray(size);
    const ctx = getAudioContext();
    const noteDuration = getAdaptiveNoteDuration(0.0075, size);
    
    const merge = (left: number[], right: number[]): number[] => {
      const result: number[] = [];
      let i = 0, j = 0;
      
      while (i < left.length && j < right.length) {
        if (left[i] <= right[j]) {
          result.push(left[i++]);
        } else {
          result.push(right[j++]);
        }
      }
      
      return result.concat(left.slice(i)).concat(right.slice(j));
    };
    
    let input = [...array];
    let result: number[] = [];
    
    while (input.length > 0 && !activeLoop.stop) {
      const sublist: number[] = [input[0]];
      const remaining: number[] = [];
      
      for (let i = 1; i < input.length && !activeLoop.stop; i++) {
        if (input[i] >= sublist[sublist.length - 1]) {
          sublist.push(input[i]);
          playTone(valueToFrequency(input[i], size), noteDuration, ctx.currentTime);
          
          if (nonBlockingCallback) {
            const display = [...result, ...sublist, ...remaining];
            visualCallback(display.slice(0, array.length), [result.length + sublist.length - 1]);
            await delay(getAdaptiveDelay(200, size));
          }
        } else {
          remaining.push(input[i]);
        }
      }
      
      result = merge(result, sublist);
      input = remaining;
      
      if (nonBlockingCallback) {
        nonBlockingCallback([...result, ...input].slice(0, array.length), []);
        await delay(getAdaptiveDelay(200, size));
      }
    }
    
    for (let i = 0; i < array.length; i++) {
      array[i] = result[i];
    }
    
    await playSortedArray(array, size, nonBlockingCallback);
    
    if (!loop || activeLoop.stop) break;
    await delay(getAdaptiveDelay(200, size));
  }
};
