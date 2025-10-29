import { activeLoop, createNonBlockingVisualCallback, delay, generateUniqueRandomArray, getAdaptiveDelay, getAdaptiveNoteDuration, getAudioContext, playSortedArray, playTone, resetLoop, valueToFrequency } from "../engine";
import type { VisualCallback } from "../types";

// Cycle Sort - Minimal writes with intentional placement
export const generateCycleSort = async (size: number = 60, visualCallback?: VisualCallback, loop: boolean = true) => {
  resetLoop();
  
  // Wrap visual callback to be non-blocking
  const nonBlockingCallback = createNonBlockingVisualCallback(visualCallback);  
  while (!activeLoop.stop) {
    const array = generateUniqueRandomArray(size);
    const ctx = getAudioContext();
    const noteDuration = getAdaptiveNoteDuration(0.008, size);
    
    for (let cycleStart = 0; cycleStart < array.length - 1 && !activeLoop.stop; cycleStart++) {
      let item = array[cycleStart];
      let pos = cycleStart;
      
      for (let i = cycleStart + 1; i < array.length; i++) {
        if (array[i] < item) pos++;
      }
      
      if (pos === cycleStart) continue;
      
      while (item === array[pos]) pos++;
      
      [item, array[pos]] = [array[pos], item];
      playTone(valueToFrequency(array[pos], size), noteDuration, ctx.currentTime);
      
      if (nonBlockingCallback) {
        nonBlockingCallback([...array], [cycleStart, pos]);
        await delay(getAdaptiveDelay(60, size));
      }
      
      while (pos !== cycleStart && !activeLoop.stop) {
        pos = cycleStart;
        for (let i = cycleStart + 1; i < array.length; i++) {
          if (array[i] < item) pos++;
        }
        
        while (item === array[pos]) pos++;
        
        [item, array[pos]] = [array[pos], item];
        playTone(valueToFrequency(array[pos], size), noteDuration, ctx.currentTime);
        
        if (nonBlockingCallback) {
          nonBlockingCallback([...array], [pos]);
          await delay(getAdaptiveDelay(60, size));
        }
      }
    }
    
    await playSortedArray(array, size, nonBlockingCallback);
    
    if (!loop || activeLoop.stop) break;
    await delay(getAdaptiveDelay(200, size));
  }
};
