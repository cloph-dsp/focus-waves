import { activeLoop, createNonBlockingVisualCallback, delay, generateUniqueRandomArray, getAdaptiveDelay, getAdaptiveNoteDuration, getAudioContext, playSortedArray, playTone, resetLoop, valueToFrequency } from "../engine";
import type { VisualCallback } from "../types";
import { generateBinaryInsertionSort } from "./binary-insertion";

export const generateInsertionBinarySort = async (size: number = 60, visualCallback?: VisualCallback, loop: boolean = true) =>
  generateBinaryInsertionSort(size, visualCallback, loop);
