import { activeLoop, createNonBlockingVisualCallback, delay, generateUniqueRandomArray, getAdaptiveDelay, getAdaptiveNoteDuration, getAudioContext, playSortedArray, playTone, resetLoop, valueToFrequency } from "../engine";
import type { VisualCallback } from "../types";
import { generateQuickSort } from "./quick";

// QuickSort variants - use existing quicksort as base
export const generateMedianOf3QuickSort = async (size: number = 60, visualCallback?: VisualCallback, loop: boolean = true) =>
  generateQuickSort(size, visualCallback, loop);
