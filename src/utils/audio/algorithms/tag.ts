import { activeLoop, createNonBlockingVisualCallback, delay, generateUniqueRandomArray, getAdaptiveDelay, getAdaptiveNoteDuration, getAudioContext, playSortedArray, playTone, resetLoop, valueToFrequency } from "../engine";
import type { VisualCallback } from "../types";

// Tag Sort - Sort indices then rearrange
export const generateTagSort = async (size: number = 60, visualCallback?: VisualCallback, loop: boolean = true) => {
  resetLoop();
  
  // Wrap visual callback to be non-blocking
  const nonBlockingCallback = createNonBlockingVisualCallback(visualCallback);  
  while (!activeLoop.stop) {
    const array = generateUniqueRandomArray(size);
    const ctx = getAudioContext();
    const noteDuration = getAdaptiveNoteDuration(0.0085, size);
    const tags = array.map((val, idx) => ({ val, idx }));
    
    tags.sort((a, b) => {
      playTone(valueToFrequency(a.val, size), noteDuration / 3, ctx.currentTime);
      return a.val - b.val;
    });
    
    for (let i = 0; i < tags.length && !activeLoop.stop; i++) {
      array[i] = tags[i].val;
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
