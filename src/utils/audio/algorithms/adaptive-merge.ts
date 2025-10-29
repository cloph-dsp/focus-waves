import { activeLoop, createNonBlockingVisualCallback, delay, generateUniqueRandomArray, getAdaptiveDelay, getAdaptiveNoteDuration, getAudioContext, playSortedArray, playTone, resetLoop, valueToFrequency } from "../engine";
import type { VisualCallback } from "../types";

// Adaptive Merge Sort
export const generateAdaptiveMergeSort = async (size = 50, visualCallback?: VisualCallback, loop = true) => {
  resetLoop();
  
  // Wrap visual callback to be non-blocking
  const nonBlockingCallback = createNonBlockingVisualCallback(visualCallback);  
  while (!activeLoop.stop) {
    const array = Array.from({ length: size }, () => Math.floor(Math.random() * 100));
    const audioCtx = getAudioContext();
  
  const detectRuns = (arr: number[]) => {
    const runs: Array<[number, number]> = [];
    let start = 0;
    
    while (start < arr.length) {
      let end = start + 1;
      while (end < arr.length && arr[end] >= arr[end - 1]) {
        end++;
      }
      runs.push([start, end]);
      start = end;
    }
    return runs;
  };
  
  const merge = async (arr: number[], start1: number, end1: number, start2: number, end2: number) => {
    const temp: number[] = [];
    let i = start1, j = start2;
    
    while (i < end1 && j < end2) {
      if (activeLoop.stop) return;
      if (arr[i] <= arr[j]) {
        temp.push(arr[i++]);
      } else {
        temp.push(arr[j++]);
      }
    }
    
    while (i < end1) temp.push(arr[i++]);
    while (j < end2) temp.push(arr[j++]);
    
    for (let k = 0; k < temp.length; k++) {
      if (activeLoop.stop) return;
      arr[start1 + k] = temp[k];
      playTone(valueToFrequency(arr[start1 + k], 100), 0.02, audioCtx.currentTime);
      nonBlockingCallback?.(arr, [start1 + k]);
      await delay(getAdaptiveDelay(40, size));
    }
  };
  
  let runs = detectRuns(array);
  while (runs.length > 1) {
    if (activeLoop.stop) return;
    const newRuns: Array<[number, number]> = [];
    for (let i = 0; i < runs.length; i += 2) {
      if (i + 1 < runs.length) {
        await merge(array, runs[i][0], runs[i][1], runs[i + 1][0], runs[i + 1][1]);
        newRuns.push([runs[i][0], runs[i + 1][1]]);
      } else {
        newRuns.push(runs[i]);
      }
    }
    runs = newRuns;
  }
  
  await playSortedArray(array, size, nonBlockingCallback);
  
    if (!loop || activeLoop.stop) break;
    await delay(getAdaptiveDelay(200, size));
  }
};
