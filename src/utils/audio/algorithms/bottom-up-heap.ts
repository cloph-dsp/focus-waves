import { activeLoop, createNonBlockingVisualCallback, delay, generateUniqueRandomArray, getAdaptiveDelay, getAdaptiveNoteDuration, getAudioContext, playSortedArray, playTone, resetLoop, valueToFrequency } from "../engine";
import type { VisualCallback } from "../types";

// Generate all remaining algorithm functions with unique audio characteristics
// Bottom-Up Heap - Build heap from bottom with rising tones
export const generateBottomUpHeapSort = async (size: number = 60, visualCallback?: VisualCallback, loop: boolean = true) => {
  resetLoop();
  const nonBlockingCallback = createNonBlockingVisualCallback(visualCallback);
  
  while (!activeLoop.stop) {
    const array = generateUniqueRandomArray(size);
    const ctx = getAudioContext();
    const noteDuration = getAdaptiveNoteDuration(0.0075, size);
    const audioDelay = getAdaptiveDelay(200, size);
    
    // Build heap from bottom
    for (let i = array.length - 1; i >= 0 && !activeLoop.stop; i--) {
      let current = i;
      while (current > 0 && !activeLoop.stop) {
        const parent = Math.floor((current - 1) / 2);
        if (array[current] > array[parent]) {
          [array[current], array[parent]] = [array[parent], array[current]];
          playTone(valueToFrequency(array[current], size), noteDuration, ctx.currentTime, 'sine');
          if (nonBlockingCallback) nonBlockingCallback([...array], [current, parent]);
          await delay(audioDelay);
          current = parent;
        } else break;
      }
    }
    
    // Extract and heapify
    for (let i = array.length - 1; i > 0 && !activeLoop.stop; i--) {
      [array[0], array[i]] = [array[i], array[0]];
      playTone(valueToFrequency(array[0], size), noteDuration, ctx.currentTime, 'triangle');
      if (nonBlockingCallback) nonBlockingCallback([...array], [0, i]);
      await delay(audioDelay);
      
      let current = 0;
      while (true) {
        const left = 2 * current + 1;
        const right = 2 * current + 2;
        let largest = current;
        if (left < i && array[left] > array[largest]) largest = left;
        if (right < i && array[right] > array[largest]) largest = right;
        if (largest === current) break;
        [array[current], array[largest]] = [array[largest], array[current]];
        playTone(valueToFrequency(array[current], size), noteDuration, ctx.currentTime, 'sine');
        if (nonBlockingCallback) nonBlockingCallback([...array], [current, largest]);
        await delay(audioDelay);
        current = largest;
      }
    }
    
    await playSortedArray(array, size, nonBlockingCallback);
    if (!loop || activeLoop.stop) break;
    await delay(getAdaptiveDelay(200, size));
  }
};
