import {
  activeLoop,
  createNonBlockingVisualCallback,
  delay,
  generateUniqueRandomArray,
  getAdaptiveDelay,
  getAdaptiveNoteDuration,
  getAudioContext,
  playSortedArray,
  playTone,
  resetLoop,
  valueToFrequency,
} from "./engine";
import { SortingGenerator, VisualCallback } from "./types";

interface SimpleSortOptions {
  timingMultiplier?: number;
  useDescendingTones?: boolean;
}

export const createSimpleSortGenerator = (
  options: SimpleSortOptions = {}
): SortingGenerator => {
  const { timingMultiplier = 1, useDescendingTones = false } = options;

  const generator: SortingGenerator = async (
    size = 60,
    visualCallback?: VisualCallback,
    loop = true
  ) => {
    resetLoop();
    const nonBlockingCallback = createNonBlockingVisualCallback(visualCallback);

    while (!activeLoop.stop) {
      const array = generateUniqueRandomArray(size);
      const ctx = getAudioContext();
      const noteDuration = getAdaptiveNoteDuration(0.04 * timingMultiplier, size);
      const audioDelay = getAdaptiveDelay(20 * timingMultiplier, size);

      for (let i = 1; i < array.length && !activeLoop.stop; i++) {
        const key = array[i];
        let j = i - 1;
        while (j >= 0 && array[j] > key && !activeLoop.stop) {
          array[j + 1] = array[j];
          const freq = useDescendingTones
            ? valueToFrequency(size - array[j + 1], size)
            : valueToFrequency(array[j + 1], size);
          playTone(freq, noteDuration, ctx.currentTime);
          if (nonBlockingCallback) nonBlockingCallback([...array], [j, j + 1]);
          await delay(audioDelay);
          j--;
        }
        array[j + 1] = key;
      }

      await playSortedArray(array, size, nonBlockingCallback);
      if (!loop || activeLoop.stop) break;
      await delay(getAdaptiveDelay(200, size));
    }
  };

  return generator;
};
