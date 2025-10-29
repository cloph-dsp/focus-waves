import { activeLoop, createNonBlockingVisualCallback, delay, generateUniqueRandomArray, getAdaptiveDelay, getAdaptiveNoteDuration, getAudioContext, playSortedArray, playTone, resetLoop, valueToFrequency } from "../engine";
import type { VisualCallback } from "../types";

// Cartesian Tree Sort
export const generateCartesianTreeSort = async (size: number = 60, visualCallback?: VisualCallback, loop: boolean = true) => {
  resetLoop();
  
  // Wrap visual callback to be non-blocking
  const nonBlockingCallback = createNonBlockingVisualCallback(visualCallback);  
  while (!activeLoop.stop) {
    const array = generateUniqueRandomArray(size);
    const ctx = getAudioContext();
    const noteDuration = getAdaptiveNoteDuration(0.0075, size);
    
    interface Node {
      value: number;
      left?: Node;
      right?: Node;
    }
    
    const buildTree = (arr: number[]): Node | undefined => {
      if (arr.length === 0) return undefined;
      const minIdx = arr.indexOf(Math.min(...arr));
      return {
        value: arr[minIdx],
        left: buildTree(arr.slice(0, minIdx)),
        right: buildTree(arr.slice(minIdx + 1))
      };
    };
    
    const inorder = async (node: Node | undefined, result: number[]) => {
      if (!node || activeLoop.stop) return;
      await inorder(node.left, result);
      result.push(node.value);
      playTone(valueToFrequency(node.value, size), noteDuration, ctx.currentTime);
      
      if (nonBlockingCallback) {
        nonBlockingCallback([...result], [result.length - 1]);
        await delay(getAdaptiveDelay(200, size));
      }
      await inorder(node.right, result);
    };
    
    const tree = buildTree(array);
    const result: number[] = [];
    await inorder(tree, result);
    
    for (let i = 0; i < result.length; i++) array[i] = result[i];
    
    await playSortedArray(array, size, nonBlockingCallback);
    
    if (!loop || activeLoop.stop) break;
    await delay(getAdaptiveDelay(200, size));
  }
};
