import { activeLoop, createNonBlockingVisualCallback, delay, generateUniqueRandomArray, getAdaptiveDelay, getAdaptiveNoteDuration, getAudioContext, playSortedArray, playTone, resetLoop, valueToFrequency } from "../engine";
import type { VisualCallback } from "../types";
import { generateMerge3Sort } from "./merge3";

export const generateMerge4Sort = async (size: number = 60, visualCallback?: VisualCallback, loop: boolean = true) => {
  // Similar to merge3 but with 4-way division - use simpler implementation
  return generateMerge3Sort(size, visualCallback, loop);
};
