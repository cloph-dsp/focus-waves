import { activeLoop, createNonBlockingVisualCallback, delay, generateUniqueRandomArray, getAdaptiveDelay, getAdaptiveNoteDuration, getAudioContext, playSortedArray, playTone, resetLoop, valueToFrequency } from "../engine";
import type { VisualCallback } from "../types";

// Tournament Sort - Binary tree tournament
export const generateTournamentSort = async (size: number = 60, visualCallback?: VisualCallback, loop: boolean = true) => {
  resetLoop();
  
  // Wrap visual callback to be non-blocking
  const nonBlockingCallback = createNonBlockingVisualCallback(visualCallback);  
  while (!activeLoop.stop) {
    const array = generateUniqueRandomArray(size);
    const ctx = getAudioContext();
    const noteDuration = getAdaptiveNoteDuration(0.0075, size);
    const tree = [...array];
    
    for (let i = 0; i < array.length && !activeLoop.stop; i++) {
      let minIdx = 0;
      for (let j = 1; j < tree.length; j++) {
        if (tree[j] < tree[minIdx]) minIdx = j;
        playTone(valueToFrequency(tree[j], size), noteDuration / 2, ctx.currentTime);
        
        if (nonBlockingCallback) {
          nonBlockingCallback([...tree], [j, minIdx]);
          await delay(getAdaptiveDelay(40, size));
        }
      }
      array[i] = tree[minIdx];
      tree[minIdx] = Infinity;
      playTone(valueToFrequency(array[i], size), noteDuration * 1.5, ctx.currentTime);
      
      if (nonBlockingCallback) {
        nonBlockingCallback([...array], [i]);
        await delay(getAdaptiveDelay(200, size));
      }
    }
    
    await playSortedArray(array, size, nonBlockingCallback);
    
    if (!loop || activeLoop.stop) break;
    await delay(getAdaptiveDelay(200, size));
  }
};
