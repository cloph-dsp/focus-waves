import { activeLoop, createNonBlockingVisualCallback, delay, generateUniqueRandomArray, getAdaptiveDelay, getAdaptiveNoteDuration, getAudioContext, playSortedArray, playTone, resetLoop, valueToFrequency } from "../engine";
import type { VisualCallback } from "../types";

export const generateOddEvenMergeSort = async (size: number = 60, visualCallback?: VisualCallback, loop: boolean = true) => 
  generateSimpleSort('odd-even-merge', size, visualCallback, loop, 0.75);
