import { activeLoop, createNonBlockingVisualCallback, delay, generateUniqueRandomArray, getAdaptiveDelay, getAdaptiveNoteDuration, getAudioContext, playSortedArray, playTone, resetLoop, valueToFrequency } from "../engine";
import type { VisualCallback } from "../types";

export const generateQuickSort = async (size: number = 60, visualCallback?: VisualCallback, loop: boolean = true) => {
  resetLoop();
  
  // Wrap visual callback to be non-blocking
  const nonBlockingCallback = createNonBlockingVisualCallback(visualCallback);  
  while (!activeLoop.stop) {
    const array = generateUniqueRandomArray(size);
    const ctx = getAudioContext();
    const noteDuration = getAdaptiveNoteDuration(0.003, size); // Ultra-short clicks
    const audioDelay = getAdaptiveDelay(25, size); // Rapid sorting
    
    const quickSort = async (arr: number[], low: number, high: number) => {
      if (low < high && !activeLoop.stop) {
        const pi = await partition(arr, low, high);
        await quickSort(arr, low, pi - 1);
        await quickSort(arr, pi + 1, high);
      }
    };

    const partition = async (arr: number[], low: number, high: number): Promise<number> => {
      const pivot = arr[high];
      let i = low - 1;

      for (let j = low; j < high && !activeLoop.stop; j++) {
        if (arr[j] < pivot) {
          i++;
          [arr[i], arr[j]] = [arr[j], arr[i]];
          
          const now = ctx.currentTime;
          // Sawtooth wave for sharp, rhythmic quick sort sounds
          playTone(valueToFrequency(arr[i], size), noteDuration, now, 'sawtooth');
          
          if (nonBlockingCallback) {
            nonBlockingCallback(arr.slice(), [i, j]);
          }
          
          await delay(audioDelay);
        }
      }
      [arr[i + 1], arr[high]] = [arr[high], arr[i + 1]];
      
      const now = ctx.currentTime;
      // Emphasized pivot with sawtooth
      playTone(valueToFrequency(arr[i + 1], size), noteDuration * 1.5, now, 'sawtooth');
      
      if (nonBlockingCallback) {
        nonBlockingCallback([...arr], [i + 1, high]);
      }
      
      await delay(audioDelay);
      
      return i + 1;
    };

    await quickSort(array, 0, array.length - 1);
    
    await playSortedArray(array, size, nonBlockingCallback);
    
    if (!loop || activeLoop.stop) break;
    await delay(getAdaptiveDelay(200, size));
  }
};
