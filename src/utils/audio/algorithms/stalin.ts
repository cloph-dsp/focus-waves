import { activeLoop, createNonBlockingVisualCallback, delay, generateUniqueRandomArray, getAdaptiveDelay, getAdaptiveNoteDuration, getAudioContext, playSortedArray, playTone, resetLoop, valueToFrequency } from "../engine";
import type { VisualCallback } from "../types";

// Stalin Sort - Remove non-ascending elements (cheating!)
export const generateStalinSort = async (size: number = 60, visualCallback?: VisualCallback, loop: boolean = true) => {
  resetLoop();
  
  // Wrap visual callback to be non-blocking
  const nonBlockingCallback = createNonBlockingVisualCallback(visualCallback);  
  while (!activeLoop.stop) {
    const array = generateUniqueRandomArray(size);
    const ctx = getAudioContext();
    const noteDuration = getAdaptiveNoteDuration(0.0075, size);
    const result = [array[0]];
    
    playTone(valueToFrequency(array[0], size), noteDuration, ctx.currentTime);
    
    for (let i = 1; i < array.length && !activeLoop.stop; i++) {
      if (array[i] >= result[result.length - 1]) {
        result.push(array[i]);
        playTone(valueToFrequency(array[i], size), noteDuration, ctx.currentTime);
        
        if (nonBlockingCallback) {
          nonBlockingCallback([...result], [result.length - 1]);
          await delay(getAdaptiveDelay(200, size));
        }
      } else {
        playTone(valueToFrequency(array[i], size) * 0.5, noteDuration * 0.5, ctx.currentTime);
        
        if (nonBlockingCallback) {
          await delay(getAdaptiveDelay(45, size));
        }
      }
    }
    
    for (let i = 0; i < result.length; i++) array[i] = result[i];
    
    await playSortedArray(result, size, visualCallback);
    
    if (!loop || activeLoop.stop) break;
    await delay(getAdaptiveDelay(200, size));
  }
};
