import { activeLoop, createNonBlockingVisualCallback, delay, generateUniqueRandomArray, getAdaptiveDelay, getAdaptiveNoteDuration, getAudioContext, playSortedArray, playTone, resetLoop, valueToFrequency } from "../engine";
import type { VisualCallback } from "../types";

// Bingo Sort - repeatedly finds the current maximum and settles duplicates to the end
export const generateBingoSort = async (size: number = 60, visualCallback?: VisualCallback, loop: boolean = true) => {
  resetLoop();

  const nonBlockingCallback = createNonBlockingVisualCallback(visualCallback);

  while (!activeLoop.stop) {
    const array = generateUniqueRandomArray(size);
    const ctx = getAudioContext();
    const noteDuration = getAdaptiveNoteDuration(0.004, size);
    const scanDelay = getAdaptiveDelay(24, size);
    const settleDelay = getAdaptiveDelay(40, size);

    let end = array.length - 1;

    while (end > 0 && !activeLoop.stop) {
      let maxValue = array[0];

      // Scan to find the current maximum value
      for (let i = 1; i <= end && !activeLoop.stop; i++) {
        if (array[i] > maxValue) {
          maxValue = array[i];
        }

        playTone(valueToFrequency(array[i], size), noteDuration / 2, ctx.currentTime, "sawtooth");
        nonBlockingCallback?.([...array], [i]);
        await delay(scanDelay);
      }

      // Settle every occurrence of the maximum value at the tail
      let idx = end;
      while (idx >= 0 && !activeLoop.stop) {
        if (array[idx] === maxValue) {
          [array[idx], array[end]] = [array[end], array[idx]];
          playTone(valueToFrequency(array[end], size), noteDuration, ctx.currentTime + noteDuration, "square");
          nonBlockingCallback?.([...array], [idx, end]);
          await delay(settleDelay);
          end--;

          if (idx > end) {
            idx = end;
            continue;
          }
        }

        idx--;
      }
    }

    await playSortedArray(array, size, nonBlockingCallback);

    if (!loop || activeLoop.stop) break;
    await delay(getAdaptiveDelay(200, size));
  }
};
