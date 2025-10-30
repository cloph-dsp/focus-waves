import { activeLoop, createNonBlockingVisualCallback, delay, generateUniqueRandomArray, getAdaptiveDelay, getAdaptiveNoteDuration, getAudioContext, playSortedArray, playTone, resetLoop, valueToFrequency } from "../engine";
import type { VisualCallback } from "../types";

// Optimized Bubble Sort - stops early if no swaps occur during a pass
export const generateOptimizedBubbleSort = async (size: number = 60, visualCallback?: VisualCallback, loop: boolean = true) => {
  resetLoop();

  const nonBlockingCallback = createNonBlockingVisualCallback(visualCallback);

  while (!activeLoop.stop) {
    const array = generateUniqueRandomArray(size);
    const ctx = getAudioContext();
    const noteDuration = getAdaptiveNoteDuration(0.0035, size);
    const audioDelay = getAdaptiveDelay(28, size);

    for (let i = 0; i < array.length && !activeLoop.stop; i++) {
      let swapped = false;

      for (let j = 0; j < array.length - i - 1 && !activeLoop.stop; j++) {
        if (array[j] > array[j + 1]) {
          [array[j], array[j + 1]] = [array[j + 1], array[j]];
          swapped = true;

          const now = ctx.currentTime;
          playTone(valueToFrequency(array[j], size), noteDuration, now, "triangle");
          playTone(valueToFrequency(array[j + 1], size), noteDuration, now + noteDuration / 2, "triangle");

          if (nonBlockingCallback) {
            nonBlockingCallback([...array], [j, j + 1]);
          }

          await delay(audioDelay);
        }
      }

      if (!swapped) {
        break;
      }
    }

    await playSortedArray(array, size, nonBlockingCallback);

    if (!loop || activeLoop.stop) break;
    await delay(getAdaptiveDelay(200, size));
  }
};
