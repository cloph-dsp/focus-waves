import { activeLoop, createNonBlockingVisualCallback, delay, generateUniqueRandomArray, getAdaptiveDelay, getAdaptiveNoteDuration, getAudioContext, playSortedArray, playTone, resetLoop, valueToFrequency } from "../engine";
import type { VisualCallback } from "../types";
import { generateMerge3Sort } from "./merge3";

export const generatePolyphaseMergeSort = async (size: number = 60, visualCallback?: VisualCallback, loop: boolean = true) =>
  generateMerge3Sort(size, visualCallback, loop);
