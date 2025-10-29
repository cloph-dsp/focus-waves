import { activeLoop, createNonBlockingVisualCallback, delay, generateUniqueRandomArray, getAdaptiveDelay, getAdaptiveNoteDuration, getAudioContext, playSortedArray, playTone, resetLoop, valueToFrequency } from "../engine";
import type { VisualCallback } from "../types";
import { generateShellSort } from "./shell";

// Shell sort variants
export const generateShellCiuraSort = async (size: number = 60, visualCallback?: VisualCallback, loop: boolean = true) =>
  generateShellSort(size, visualCallback, loop);
