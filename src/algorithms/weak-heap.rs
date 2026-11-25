use crate::audio::Wave;
use crate::engine::SortCtx;

fn weak_heapify(ctx: &mut SortCtx, array: &mut [i64], reverse: &mut [u8], i: usize, n: usize) {
    let mut j = i;
    while 2 * j + 1 < n {
        if ctx.stopped() {
            return;
        }
        let left = 2 * j + 1;
        let right = left + 1;
        // Sift toward the larger child; the reverse bit keeps the weak-heap tie-break.
        let mut child = left;
        if right < n && (array[right] > array[left]
            || (array[right] == array[left] && reverse[j] == 1))
        {
            child = right;
        }
        if array[child] > array[j] {
            array.swap(j, child);
            reverse[j] = 1 - reverse[j];
            j = child;
        } else {
            break;
        }
    }
}

// Ported from TypeScript: src/utils/audio/algorithms/weak-heap.ts
#[allow(non_snake_case)]
pub fn generateWeakHeapSort(ctx: &mut SortCtx, size: usize, loop_: bool) {
    while !ctx.stopped() {
        let mut array = ctx.random_array(size);
        let n = array.len();
        let mut reverse = vec![0u8; n];

        if n > 0 {
            let mut i = n - 1;
            loop {
                if ctx.stopped() {
                    return;
                }
                weak_heapify(ctx, &mut array, &mut reverse, i, n);
                if i == 0 {
                    break;
                }
                i -= 1;
            }

            let mut i = n - 1;
            while i > 0 {
                if ctx.stopped() {
                    return;
                }
                array.swap(0, i);
                ctx.play(ctx.freq(array[0] as f64, 100.0), 0.02, Wave::Sine);
                ctx.visual(&array, &[0, i]);
                ctx.delay(ctx.adaptive_delay(200.0, size));
                weak_heapify(ctx, &mut array, &mut reverse, 0, i);
                i -= 1;
            }
        }

        ctx.play_sorted(&array);
        if !loop_ || ctx.stopped() {
            return;
        }
        ctx.delay(ctx.adaptive_delay(200.0, size));
    }
}
