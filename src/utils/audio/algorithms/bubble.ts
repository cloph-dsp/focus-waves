import { activeLoop, createNonBlockingVisualCallback, delay, generateUniqueRandomArray, getAdaptiveDelay, getAdaptiveNoteDuration, getAudioContext, playSortedArray, playTone, resetLoop, valueToFrequency } from "../engine";
import type { VisualCallback } from "../types";

// Sorting algorithm implementations with audio feedback and visual updates
export const generateBubbleSort = async (size: number = 60, visualCallback?: VisualCallback, loop: boolean = true) => {
  resetLoop();
  
  // Wrap visual callback to be non-blocking
  const nonBlockingCallback = createNonBlockingVisualCallback(visualCallback);
  
  while (!activeLoop.stop) {
    const array = generateUniqueRandomArray(size);
    const ctx = getAudioContext();
    const noteDuration = getAdaptiveNoteDuration(0.003, size); // Ultra-short clicks
    const audioDelay = getAdaptiveDelay(30, size); // Rapid comparisons
    
    for (let i = 0; i < array.length && !activeLoop.stop; i++) {
      for (let j = 0; j < array.length - i - 1 && !activeLoop.stop; j++) {
        if (array[j] > array[j + 1]) {
          [array[j], array[j + 1]] = [array[j + 1], array[j]];
          
          const now = ctx.currentTime;
          // Triangle wave for smooth, mellow bubble sounds
          playTone(valueToFrequency(array[j], size), noteDuration, now, 'triangle');
          playTone(valueToFrequency(array[j + 1], size), noteDuration, now + noteDuration / 2, 'triangle');
          
          if (nonBlockingCallback) {
            nonBlockingCallback([...array], [j, j + 1]);
          }
          
          // Audio-focused delay - ensure tones are heard
          await delay(audioDelay);
        }
      }
    }
    
    await playSortedArray(array, size, nonBlockingCallback);
    
    if (!loop || activeLoop.stop) break;
    await delay(getAdaptiveDelay(200, size));
  }
};
