import { activeLoop, createNonBlockingVisualCallback, delay, generateUniqueRandomArray, getAdaptiveDelay, getAdaptiveNoteDuration, getAudioContext, playSortedArray, playTone, resetLoop, valueToFrequency } from "../engine";
import type { VisualCallback } from "../types";

// Intro Sort - Hybrid of QuickSort, HeapSort, and InsertionSort
export const generateIntroSort = async (size: number = 60, visualCallback?: VisualCallback, loop: boolean = true) => {
  resetLoop();
  
  // Wrap visual callback to be non-blocking
  const nonBlockingCallback = createNonBlockingVisualCallback(visualCallback);  
  while (!activeLoop.stop) {
    const array = generateUniqueRandomArray(size);
    const ctx = getAudioContext();
    const noteDuration = getAdaptiveNoteDuration(0.0085, size);
    const maxDepth = Math.floor(Math.log2(array.length)) * 2;
    
    const insertionSort = async (arr: number[], left: number, right: number) => {
      for (let i = left + 1; i <= right && !activeLoop.stop; i++) {
        const key = arr[i];
        let j = i - 1;
        while (j >= left && arr[j] > key && !activeLoop.stop) {
          arr[j + 1] = arr[j];
          playTone(valueToFrequency(arr[j + 1], size), noteDuration, ctx.currentTime);
          
          if (nonBlockingCallback) {
            nonBlockingCallback([...arr], [j, j + 1]);
            await delay(getAdaptiveDelay(45, size));
          }
          j--;
        }
        arr[j + 1] = key;
      }
    };
    
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
          await delay(getAdaptiveDelay(45, size));
        }
        
        await heapify(arr, n, largest);
      }
    };
    
    const heapSort = async (arr: number[], left: number, right: number) => {
      const n = right - left + 1;
      
      for (let i = Math.floor(n / 2) - 1; i >= 0 && !activeLoop.stop; i--) {
        await heapify(arr.slice(left, right + 1), n, i);
      }
      
      const temp = arr.slice(left, right + 1);
      for (let i = n - 1; i > 0 && !activeLoop.stop; i--) {
        [temp[0], temp[i]] = [temp[i], temp[0]];
        await heapify(temp, i, 0);
      }
      
      for (let i = 0; i < n; i++) {
        arr[left + i] = temp[i];
      }
    };
    
    const partition = async (arr: number[], low: number, high: number): Promise<number> => {
      const pivot = arr[high];
      let i = low - 1;
      
      for (let j = low; j < high && !activeLoop.stop; j++) {
        if (arr[j] < pivot) {
          i++;
          [arr[i], arr[j]] = [arr[j], arr[i]];
          playTone(valueToFrequency(arr[i], size), noteDuration, ctx.currentTime);
          
          if (nonBlockingCallback) {
            nonBlockingCallback([...arr], [i, j]);
            await delay(getAdaptiveDelay(45, size));
          }
        }
      }
      [arr[i + 1], arr[high]] = [arr[high], arr[i + 1]];
      return i + 1;
    };
    
    const introSortUtil = async (arr: number[], low: number, high: number, depth: number) => {
      const size = high - low + 1;
      
      if (size < 16 || activeLoop.stop) {
        await insertionSort(arr, low, high);
        return;
      }
      
      if (depth === 0) {
        await heapSort(arr, low, high);
        return;
      }
      
      const pivot = await partition(arr, low, high);
      await introSortUtil(arr, low, pivot - 1, depth - 1);
      await introSortUtil(arr, pivot + 1, high, depth - 1);
    };
    
    await introSortUtil(array, 0, array.length - 1, maxDepth);
    
    await playSortedArray(array, size, nonBlockingCallback);
    
    if (!loop || activeLoop.stop) break;
    await delay(getAdaptiveDelay(200, size));
  }
};
