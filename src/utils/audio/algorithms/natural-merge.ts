import { activeLoop, createNonBlockingVisualCallback, delay, generateUniqueRandomArray, getAdaptiveDelay, getAdaptiveNoteDuration, getAudioContext, playSortedArray, playTone, resetLoop, valueToFrequency } from "../engine";
import type { VisualCallback } from "../types";
import { generateMergeSort } from "./merge";

// Merge and insertion variants
export const generateNaturalMergeSort = async (size: number = 60, visualCallback?: VisualCallback, loop: boolean = true) =>
  generateMergeSort(size, visualCallback, loop);
