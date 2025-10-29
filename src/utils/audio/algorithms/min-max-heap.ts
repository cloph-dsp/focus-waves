import { activeLoop, createNonBlockingVisualCallback, delay, generateUniqueRandomArray, getAdaptiveDelay, getAdaptiveNoteDuration, getAudioContext, playSortedArray, playTone, resetLoop, valueToFrequency } from "../engine";
import type { VisualCallback } from "../types";
import { generateHeapSort } from "./heap";

export const generateMinMaxHeapSort = async (size: number = 60, visualCallback?: VisualCallback, loop: boolean = true) =>
  generateHeapSort(size, visualCallback, loop);
