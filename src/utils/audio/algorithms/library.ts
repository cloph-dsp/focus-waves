import { activeLoop, createNonBlockingVisualCallback, delay, generateUniqueRandomArray, getAdaptiveDelay, getAdaptiveNoteDuration, getAudioContext, playSortedArray, playTone, resetLoop, valueToFrequency } from "../engine";
import type { VisualCallback } from "../types";

// Library Sort - Insertion with gaps
export const generateLibrarySort = async (size: number = 60, visualCallback?: VisualCallback, loop: boolean = true) => {
  resetLoop();
  
  // Wrap visual callback to be non-blocking
  const nonBlockingCallback = createNonBlockingVisualCallback(visualCallback);  
  while (!activeLoop.stop) {
    const array = generateUniqueRandomArray(size);
    const ctx = getAudioContext();
    const noteDuration = getAdaptiveNoteDuration(0.0075, size);
    const epsilon = 1;
    const lib = new Array(array.length * (1 + epsilon)).fill(null);
    
    lib[0] = array[0];
    let libSize = 1;
    
    for (let i = 1; i < array.length && !activeLoop.stop; i++) {
      let pos = 0;
      for (let j = 0; j < libSize; j++) {
        if (lib[j] !== null && lib[j] < array[i]) pos = j + 1;
      }
      
      for (let j = libSize; j > pos && !activeLoop.stop; j--) {
        lib[j] = lib[j - 1];
      }
      lib[pos] = array[i];
      playTone(valueToFrequency(array[i], size), noteDuration, ctx.currentTime);
      
      if (nonBlockingCallback) {
        const display = lib.filter(x => x !== null).slice(0, array.length);
        nonBlockingCallback([...display], [pos]);
        await delay(getAdaptiveDelay(200, size));
      }
      libSize++;
    }
    
    const sorted = lib.filter(x => x !== null);
    for (let i = 0; i < array.length; i++) array[i] = sorted[i];
    
    await playSortedArray(array, size, nonBlockingCallback);
    
    if (!loop || activeLoop.stop) break;
    await delay(getAdaptiveDelay(200, size));
  }
};
