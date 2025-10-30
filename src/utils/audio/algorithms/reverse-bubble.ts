import { activeLoop, createNonBlockingVisualCallback, delay, generateUniqueRandomArray, getAdaptiveDelay, getAdaptiveNoteDuration, getAudioContext, playSortedArray, playTone, resetLoop, valueToFrequency } from "../engine";
import type { VisualCallback } from "../types";

// Reverse Bubble Sort - traverses from the end to bubble minimum values forward
export const generateReverseBubbleSort = async (size: number = 60, visualCallback?: VisualCallback, loop: boolean = true) => {
  resetLoop();

  const nonBlockingCallback = createNonBlockingVisualCallback(visualCallback);

  while (!activeLoop.stop) {
    const array = generateUniqueRandomArray(size);
    const ctx = getAudioContext();
    const noteDuration = getAdaptiveNoteDuration(0.0035, size);
    const audioDelay = getAdaptiveDelay(32, size);

    for (let i = 0; i < array.length && !activeLoop.stop; i++) {
      for (let j = array.length - 1; j > i && !activeLoop.stop; j--) {
        if (array[j] < array[j - 1]) {
          [array[j], array[j - 1]] = [array[j - 1], array[j]];

          const now = ctx.currentTime;
          playTone(valueToFrequency(array[j], size), noteDuration, now, "sine");
          playTone(valueToFrequency(array[j - 1], size), noteDuration, now + noteDuration / 2, "sine");

          if (nonBlockingCallback) {
            nonBlockingCallback([...array], [j - 1, j]);
          }

          await delay(audioDelay);
        }
      }
    }

    await playSortedArray(array, size, nonBlockingCallback);

    if (!loop || activeLoop.stop) break;
    await delay(getAdaptiveDelay(200, size));
  }
};
