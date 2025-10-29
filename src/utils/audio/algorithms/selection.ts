import { activeLoop, createNonBlockingVisualCallback, delay, generateUniqueRandomArray, getAdaptiveDelay, getAdaptiveNoteDuration, getAudioContext, playSortedArray, playTone, resetLoop, valueToFrequency } from "../engine";
import type { VisualCallback } from "../types";

export const generateSelectionSort = async (size: number = 60, visualCallback?: VisualCallback, loop: boolean = true) => {
  resetLoop();
  
  // Wrap visual callback to be non-blocking
  const nonBlockingCallback = createNonBlockingVisualCallback(visualCallback);  
  while (!activeLoop.stop) {
    const array = generateUniqueRandomArray(size);
    const ctx = getAudioContext();
    const noteDuration = getAdaptiveNoteDuration(0.008, size); // Distinctive selection tones
    const audioDelay = getAdaptiveDelay(65, size); // Deliberate pacing

    for (let i = 0; i < array.length - 1 && !activeLoop.stop; i++) {
      let minIdx = i;
      for (let j = i + 1; j < array.length && !activeLoop.stop; j++) {
        if (array[j] < array[minIdx]) {
          minIdx = j;
        }
        playTone(valueToFrequency(array[j], size), noteDuration / 2, ctx.currentTime);
        
        if (nonBlockingCallback) {
          nonBlockingCallback([...array], [i, j, minIdx]);
        }
        await delay(audioDelay);
      }
      if (minIdx !== i) {
        [array[i], array[minIdx]] = [array[minIdx], array[i]];
        playTone(valueToFrequency(array[i], size), noteDuration * 1.5, ctx.currentTime);
        
        if (nonBlockingCallback) {
          nonBlockingCallback([...array], [i, minIdx]);
        }
        await delay(audioDelay);
      }
    }
    
    await playSortedArray(array, size, nonBlockingCallback);
    
    if (!loop || activeLoop.stop) break;
    await delay(getAdaptiveDelay(200, size));
  }
};
