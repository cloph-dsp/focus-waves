use crate::audio::Wave;
use crate::engine::SortCtx;

// Ported from TypeScript: src/utils/audio/algorithms/dual-pivot-quick.ts
fn dual_pivot_sort(ctx: &mut SortCtx, arr: &mut [i64], low: usize, high: usize, size: usize) {
    if ctx.stopped() {
        return;
    }
    if low < high {
        if arr[low] > arr[high] {
            arr.swap(low, high);
        }

        let pivot1 = arr[low];
        let pivot2 = arr[high];
        let mut i = low + 1;
        let mut lt = low + 1;
        let mut gt = high - 1;

        while i <= gt {
            if ctx.stopped() {
                return;
            }
            if arr[i] < pivot1 {
                arr.swap(i, lt);
                lt += 1;
            } else if arr[i] > pivot2 {
                arr.swap(i, gt);
                gt -= 1;
                i -= 1;
            }
            ctx.play(ctx.freq(arr[i] as f64, size as f64), 0.02, Wave::Sine);
            ctx.visual(arr, &[i, lt, gt]);
            ctx.delay(ctx.adaptive_delay(45.0, size));
            i += 1;
        }

        arr.swap(low, lt - 1);
        arr.swap(high, gt + 1);

        if lt >= low + 2 {
            dual_pivot_sort(ctx, arr, low, lt - 2, size);
        }
        dual_pivot_sort(ctx, arr, lt, gt, size);
        dual_pivot_sort(ctx, arr, gt + 2, high, size);
    }
}

#[allow(non_snake_case)]
pub fn generateDualPivotQuickSort(ctx: &mut SortCtx, size: usize, loop_: bool) {
    while !ctx.stopped() {
        let mut array = ctx.random_array(size);
        if size > 0 {
            dual_pivot_sort(ctx, &mut array, 0, size - 1, size);
        }
        if ctx.stopped() {
            return;
        }
        ctx.play_sorted(&array);
        if !loop_ || ctx.stopped() {
            return;
        }
        ctx.delay(ctx.adaptive_delay(200.0, size));
    }
}
