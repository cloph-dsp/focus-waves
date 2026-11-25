use crate::engine::SortCtx;

// Ported from TypeScript: src/utils/audio/algorithms/fibonacci-heap.ts
// The source simply delegates to generateHeapSort (the "Fibonacci heap" is a placeholder).
#[allow(non_snake_case)]
pub fn generateFibonacciHeapSort(ctx: &mut SortCtx, size: usize, loop_: bool) {
    super::heap::generateHeapSort(ctx, size, loop_);
}
