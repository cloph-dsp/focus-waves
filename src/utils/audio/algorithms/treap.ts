import { activeLoop, createNonBlockingVisualCallback, delay, generateUniqueRandomArray, getAdaptiveDelay, getAdaptiveNoteDuration, getAudioContext, playSortedArray, playTone, resetLoop, valueToFrequency } from "../engine";
import type { VisualCallback } from "../types";
import { generateBinaryTreeSort } from "./binary-tree";

export const generateTreapSort = async (size: number = 60, visualCallback?: VisualCallback, loop: boolean = true) =>
  generateBinaryTreeSort(size, visualCallback, loop);
