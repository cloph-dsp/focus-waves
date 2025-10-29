import { activeLoop, createNonBlockingVisualCallback, delay, generateUniqueRandomArray, getAdaptiveDelay, getAdaptiveNoteDuration, getAudioContext, playSortedArray, playTone, resetLoop, valueToFrequency } from "../engine";
import type { VisualCallback } from "../types";

// Double Selection Sort - Select min and max simultaneously
export const generateDoubleSelectionSort = async (size: number = 60, visualCallback?: VisualCallback, loop: boolean = true) => {
  resetLoop();
  
  // Wrap visual callback to be non-blocking
  const nonBlockingCallback = createNonBlockingVisualCallback(visualCallback);  
  while (!activeLoop.stop) {
    const array = generateUniqueRandomArray(size);
    const ctx = getAudioContext();
    const noteDuration = getAdaptiveNoteDuration(0.008, size);
    
    for (let i = 0; i < array.length / 2 && !activeLoop.stop; i++) {
      let minIdx = i, maxIdx = i;
      
      for (let j = i; j < array.length - i && !activeLoop.stop; j++) {
        if (array[j] < array[minIdx]) minIdx = j;
        if (array[j] > array[maxIdx]) maxIdx = j;
        playTone(valueToFrequency(array[j], size), noteDuration / 3, ctx.currentTime);
        
        if (nonBlockingCallback) {
          nonBlockingCallback([...array], [j, minIdx, maxIdx]);
          await delay(getAdaptiveDelay(45, size));
        }
      }
      
      if (minIdx !== i) {
        [array[i], array[minIdx]] = [array[minIdx], array[i]];
        if (maxIdx === i) maxIdx = minIdx;
      }
      
      const maxPos = array.length - 1 - i;
      if (maxIdx !== maxPos) {
        [array[maxPos], array[maxIdx]] = [array[maxIdx], array[maxPos]];
      }
      
      playTone(valueToFrequency(array[i], size), noteDuration, ctx.currentTime);
      playTone(valueToFrequency(array[maxPos], size), noteDuration, ctx.currentTime + noteDuration / 2);
      
      if (nonBlockingCallback) {
        nonBlockingCallback([...array], [i, maxPos]);
        await delay(getAdaptiveDelay(55, size));
      }
    }
    
    await playSortedArray(array, size, nonBlockingCallback);
    
    if (!loop || activeLoop.stop) break;
    await delay(getAdaptiveDelay(200, size));
  }
};
