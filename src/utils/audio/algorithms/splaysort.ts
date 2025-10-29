import { activeLoop, createNonBlockingVisualCallback, delay, generateUniqueRandomArray, getAdaptiveDelay, getAdaptiveNoteDuration, getAudioContext, playSortedArray, playTone, resetLoop, valueToFrequency } from "../engine";
import type { VisualCallback } from "../types";

// Splaysort - Splay tree based
export const generateSplaysort = async (size: number = 60, visualCallback?: VisualCallback, loop: boolean = true) => {
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
    
    const insert = (root: Node | undefined, value: number): Node => {
      if (!root) return { value };
      if (value < root.value) {
        root.left = insert(root.left, value);
      } else {
        root.right = insert(root.right, value);
      }
      return root;
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
    
    let root: Node | undefined;
    for (let i = 0; i < array.length && !activeLoop.stop; i++) {
      root = insert(root, array[i]);
      playTone(valueToFrequency(array[i], size), noteDuration / 2, ctx.currentTime);
      
      if (nonBlockingCallback) {
        nonBlockingCallback([...array], [i]);
        await delay(getAdaptiveDelay(40, size));
      }
    }
    
    const result: number[] = [];
    await inorder(root, result);
    
    for (let i = 0; i < result.length; i++) array[i] = result[i];
    
    await playSortedArray(array, size, nonBlockingCallback);
    
    if (!loop || activeLoop.stop) break;
    await delay(getAdaptiveDelay(200, size));
  }
};
