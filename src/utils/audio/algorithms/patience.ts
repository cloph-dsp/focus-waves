import { activeLoop, createNonBlockingVisualCallback, delay, generateUniqueRandomArray, getAdaptiveDelay, getAdaptiveNoteDuration, getAudioContext, playSortedArray, playTone, resetLoop, valueToFrequency } from "../engine";
import type { VisualCallback } from "../types";

// Patience Sort - Card game piles
export const generatePatienceSort = async (size: number = 60, visualCallback?: VisualCallback, loop: boolean = true) => {
  resetLoop();
  
  // Wrap visual callback to be non-blocking
  const nonBlockingCallback = createNonBlockingVisualCallback(visualCallback);  
  while (!activeLoop.stop) {
    const array = generateUniqueRandomArray(size);
    const ctx = getAudioContext();
    const noteDuration = getAdaptiveNoteDuration(0.0085, size);
    const piles: number[][] = [];
    
    for (let i = 0; i < array.length && !activeLoop.stop; i++) {
      let placed = false;
      for (let j = 0; j < piles.length && !activeLoop.stop; j++) {
        if (piles[j][piles[j].length - 1] >= array[i]) {
          piles[j].push(array[i]);
          playTone(valueToFrequency(array[i], size), noteDuration, ctx.currentTime);
          placed = true;
          
          if (nonBlockingCallback) {
            nonBlockingCallback([...array], [i]);
            await delay(getAdaptiveDelay(45, size));
          }
          break;
        }
      }
      if (!placed) {
        piles.push([array[i]]);
        playTone(valueToFrequency(array[i], size), noteDuration * 1.2, ctx.currentTime);
        
        if (nonBlockingCallback) {
          nonBlockingCallback([...array], [i]);
          await delay(getAdaptiveDelay(45, size));
        }
      }
    }
    
    let index = 0;
    while (piles.some(p => p.length > 0) && !activeLoop.stop) {
      let minPile = -1;
      let minValue = Infinity;
      for (let i = 0; i < piles.length; i++) {
        if (piles[i].length > 0 && piles[i][piles[i].length - 1] < minValue) {
          minValue = piles[i][piles[i].length - 1];
          minPile = i;
        }
      }
      array[index++] = piles[minPile].pop()!;
      playTone(valueToFrequency(array[index - 1], size), noteDuration, ctx.currentTime);
      
      if (nonBlockingCallback) {
        nonBlockingCallback([...array], [index - 1]);
        await delay(getAdaptiveDelay(45, size));
      }
    }
    
    await playSortedArray(array, size, nonBlockingCallback);
    
    if (!loop || activeLoop.stop) break;
    await delay(getAdaptiveDelay(200, size));
  }
};
