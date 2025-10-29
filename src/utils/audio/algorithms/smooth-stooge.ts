import { activeLoop, createNonBlockingVisualCallback, delay, generateUniqueRandomArray, getAdaptiveDelay, getAdaptiveNoteDuration, getAudioContext, playSortedArray, playTone, resetLoop, valueToFrequency } from "../engine";
import type { VisualCallback } from "../types";
import { generateStoogeSort } from "./stooge";

// Smooth Stooge - slower variant
export const generateSmoothStoogeSort = async (size: number = 40, visualCallback?: VisualCallback, loop: boolean = true) =>
  generateStoogeSort(size, visualCallback, loop);
