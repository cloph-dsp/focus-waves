import { activeLoop, createNonBlockingVisualCallback, delay, generateUniqueRandomArray, getAdaptiveDelay, getAdaptiveNoteDuration, getAudioContext, playSortedArray, playTone, resetLoop, valueToFrequency } from "../engine";
import type { VisualCallback } from "../types";

// Tree Sort - Binary Search Tree based
export const generateTreeSort = async (size: number = 60, visualCallback?: VisualCallback, loop: boolean = true) => {
  resetLoop();
  
  // Wrap visual callback to be non-blocking
  const nonBlockingCallback = createNonBlockingVisualCallback(visualCallback);  
  while (!activeLoop.stop) {
    const array = generateUniqueRandomArray(size);
    const ctx = getAudioContext();
    const noteDuration = getAdaptiveNoteDuration(0.0075, size);
    
    class TreeNode {
      value: number;
      left: TreeNode | null = null;
      right: TreeNode | null = null;
      
      constructor(value: number) {
        this.value = value;
      }
    }
    
    const insert = async (root: TreeNode | null, value: number): Promise<TreeNode> => {
      if (!root) {
        playTone(valueToFrequency(value, size), noteDuration, ctx.currentTime);
        return new TreeNode(value);
      }
      
      if (value < root.value) {
        root.left = await insert(root.left, value);
      } else {
        root.right = await insert(root.right, value);
      }
      
      return root;
    };
    
    const inorderTraversal = async (root: TreeNode | null, result: number[]) => {
      if (root && !activeLoop.stop) {
        await inorderTraversal(root.left, result);
        result.push(root.value);
        playTone(valueToFrequency(root.value, size), noteDuration, ctx.currentTime);
        
        if (nonBlockingCallback) {
          nonBlockingCallback([...result, ...Array(array.length - result.length).fill(0)], [result.length - 1]);
          await delay(getAdaptiveDelay(200, size));
        }
        
        await inorderTraversal(root.right, result);
      }
    };
    
    let root: TreeNode | null = null;
    for (let i = 0; i < array.length && !activeLoop.stop; i++) {
      root = await insert(root, array[i]);
    }
    
    const sorted: number[] = [];
    await inorderTraversal(root, sorted);
    
    for (let i = 0; i < sorted.length; i++) {
      array[i] = sorted[i];
    }
    
    await playSortedArray(array, size, nonBlockingCallback);
    
    if (!loop || activeLoop.stop) break;
    await delay(getAdaptiveDelay(200, size));
  }
};
