import { activeLoop, createNonBlockingVisualCallback, delay, generateUniqueRandomArray, getAdaptiveDelay, getAdaptiveNoteDuration, getAudioContext, playSortedArray, playTone, resetLoop, valueToFrequency } from "../engine";
import type { VisualCallback } from "../types";

// Shear Sort
export const generateShearSort = async (size = 50, visualCallback?: VisualCallback, loop = true) => {
  resetLoop();
  
  // Wrap visual callback to be non-blocking
  const nonBlockingCallback = createNonBlockingVisualCallback(visualCallback);  
  while (!activeLoop.stop) {
    const array = Array.from({ length: size }, () => Math.floor(Math.random() * 100));
    const audioCtx = getAudioContext();
  
  const rows = Math.ceil(Math.sqrt(size));
  const cols = Math.ceil(size / rows);
  
  const sortRow = async (rowIndex: number, ascending: boolean) => {
    const start = rowIndex * cols;
    const end = Math.min(start + cols, size);
    
    for (let i = start; i < end - 1; i++) {
      for (let j = i + 1; j < end; j++) {
        if (activeLoop.stop) return;
        const shouldSwap = ascending ? array[i] > array[j] : array[i] < array[j];
        if (shouldSwap) {
          [array[i], array[j]] = [array[j], array[i]];
          playTone(valueToFrequency(array[i], 100), 0.02, audioCtx.currentTime);
          nonBlockingCallback?.(array, [i, j]);
          await delay(getAdaptiveDelay(40, size));
        }
      }
    }
  };
  
  const sortColumn = async (colIndex: number) => {
    const indices = [];
    for (let r = 0; r < rows && r * cols + colIndex < size; r++) {
      indices.push(r * cols + colIndex);
    }
    
    for (let i = 0; i < indices.length - 1; i++) {
      for (let j = i + 1; j < indices.length; j++) {
        if (activeLoop.stop) return;
        if (array[indices[i]] > array[indices[j]]) {
          [array[indices[i]], array[indices[j]]] = [array[indices[j]], array[indices[i]]];
          playTone(valueToFrequency(array[indices[i]], 100), 0.02, audioCtx.currentTime);
          nonBlockingCallback?.(array, indices);
          await delay(getAdaptiveDelay(40, size));
        }
      }
    }
  };
  
  for (let phase = 0; phase < Math.ceil(Math.log2(rows)) + 1; phase++) {
    for (let r = 0; r < rows; r++) {
      if (activeLoop.stop) return;
      await sortRow(r, r % 2 === 0);
    }
    
    for (let c = 0; c < cols; c++) {
      if (activeLoop.stop) return;
      await sortColumn(c);
    }
  }
  
  await playSortedArray(array, size, nonBlockingCallback);
  
    if (!loop || activeLoop.stop) break;
    await delay(getAdaptiveDelay(200, size));
  }
};
