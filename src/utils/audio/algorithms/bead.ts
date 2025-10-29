import { activeLoop, createNonBlockingVisualCallback, delay, generateUniqueRandomArray, getAdaptiveDelay, getAdaptiveNoteDuration, getAudioContext, playSortedArray, playTone, resetLoop, valueToFrequency } from "../engine";
import type { VisualCallback } from "../types";

// Bead Sort - Gravity simulation (positive integers only)
export const generateBeadSort = async (size: number = 60, visualCallback?: VisualCallback, loop: boolean = true) => {
  resetLoop();
  
  // Wrap visual callback to be non-blocking
  const nonBlockingCallback = createNonBlockingVisualCallback(visualCallback);  
  while (!activeLoop.stop) {
    const array = generateUniqueRandomArray(size);
    const ctx = getAudioContext();
    const noteDuration = getAdaptiveNoteDuration(0.008, size);
    
    const max = Math.max(...array);
    const beads: boolean[][] = Array.from({ length: array.length }, () => 
      Array(max).fill(false)
    );
    
    // Setup beads
    for (let i = 0; i < array.length; i++) {
      for (let j = 0; j < array[i]; j++) {
        beads[i][j] = true;
      }
    }
    
    // Let beads fall (gravity)
    for (let j = 0; j < max && !activeLoop.stop; j++) {
      let sum = 0;
      for (let i = 0; i < array.length; i++) {
        sum += beads[i][j] ? 1 : 0;
        beads[i][j] = false;
      }
      
      for (let i = array.length - sum; i < array.length && !activeLoop.stop; i++) {
        beads[i][j] = true;
        
        // Count current value for this row
        let currentValue = 0;
        for (let k = 0; k < max; k++) {
          if (beads[i][k]) currentValue++;
        }
        
        array[i] = currentValue;
        playTone(valueToFrequency(currentValue || 1, size), noteDuration, ctx.currentTime);
        
        if (nonBlockingCallback) {
          nonBlockingCallback([...array], [i]);
          await delay(getAdaptiveDelay(40, size));
        }
      }
    }
    
    await playSortedArray(array, size, nonBlockingCallback);
    
    if (!loop || activeLoop.stop) break;
    await delay(getAdaptiveDelay(200, size));
  }
};
