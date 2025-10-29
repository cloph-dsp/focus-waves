import { activeLoop, createNonBlockingVisualCallback, delay, generateUniqueRandomArray, getAdaptiveDelay, getAdaptiveNoteDuration, getAudioContext, playSortedArray, playTone, resetLoop, valueToFrequency } from "../engine";
import type { VisualCallback } from "../types";

export const generateHeapSort = async (size: number = 60, visualCallback?: VisualCallback, loop: boolean = true) => {
  resetLoop();
  
  // Wrap visual callback to be non-blocking
  const nonBlockingCallback = createNonBlockingVisualCallback(visualCallback);  
  while (!activeLoop.stop) {
    const array = generateUniqueRandomArray(size);
    const ctx = getAudioContext();
    const noteDuration = getAdaptiveNoteDuration(0.007, size); // Tree-like cascading sounds
    const audioDelay = getAdaptiveDelay(200, size); // Clear audio

    const heapify = async (arr: number[], n: number, i: number) => {
      let largest = i;
      const left = 2 * i + 1;
      const right = 2 * i + 2;

      if (left < n && arr[left] > arr[largest]) largest = left;
      if (right < n && arr[right] > arr[largest]) largest = right;

      if (largest !== i && !activeLoop.stop) {
        [arr[i], arr[largest]] = [arr[largest], arr[i]];
        playTone(valueToFrequency(arr[i], size), noteDuration, ctx.currentTime);
        
        if (nonBlockingCallback) {
          nonBlockingCallback([...arr], [i, largest]);
        }
        await delay(audioDelay);
        
        await heapify(arr, n, largest);
      }
    };

    for (let i = Math.floor(array.length / 2) - 1; i >= 0 && !activeLoop.stop; i--) {
      await heapify(array, array.length, i);
    }

    for (let i = array.length - 1; i > 0 && !activeLoop.stop; i--) {
      [array[0], array[i]] = [array[i], array[0]];
      playTone(valueToFrequency(array[0], size), noteDuration * 1.2, ctx.currentTime);
      
      if (nonBlockingCallback) {
        nonBlockingCallback([...array], [0, i]);
      }
      await delay(audioDelay);
      
      await heapify(array, i, 0);
    }
    
    await playSortedArray(array, size, nonBlockingCallback);
    
    if (!loop || activeLoop.stop) break;
    await delay(getAdaptiveDelay(200, size));
  }
};
