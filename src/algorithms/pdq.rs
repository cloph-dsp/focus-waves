use crate::audio::Wave;
use crate::engine::SortCtx;

// Ported from TypeScript: src/utils/audio/algorithms/pdq.ts
#[allow(non_snake_case)]
pub fn generatePDQSort(ctx: &mut SortCtx, size: usize, loop_: bool) {
    fn pdq_partition(
        ctx: &mut SortCtx,
        arr: &mut [i64],
        low: usize,
        high: usize,
        size: usize,
    ) -> usize {
        let pivot = arr[(low + high) / 2];
        let mut i = low as isize;
        let mut j = high as isize;

        loop {
            if ctx.stopped() {
                return i as usize;
            }
            while (i as usize) < arr.len() && arr[i as usize] < pivot {
                i += 1;
            }
            while j >= 0 && arr[j as usize] > pivot {
                j -= 1;
            }
            if i <= j {
                if ctx.stopped() {
                    return i as usize;
                }
                let iu = i as usize;
                let ju = j as usize;
                arr.swap(iu, ju);
                ctx.play(ctx.freq(arr[iu] as f64, size as f64), 0.02, Wave::Sine);
                ctx.visual(arr, &[iu, ju]);
                ctx.delay(ctx.adaptive_delay(45.0, size));
                i += 1;
                j -= 1;
            } else {
                break;
            }
        }
        i as usize
    }

    fn pdq_sort(
        ctx: &mut SortCtx,
        arr: &mut [i64],
        low: usize,
        high: usize,
        depth: i32,
        size: usize,
    ) {
        if low < high {
            if depth == 0 {
                for i in low..=high {
                    for j in (i + 1)..=high {
                        if ctx.stopped() {
                            return;
                        }
                        if arr[i] > arr[j] {
                            arr.swap(i, j);
                            ctx.play(
                                ctx.freq(arr[i] as f64, size as f64),
                                0.02,
                                Wave::Sine,
                            );
                            ctx.visual(arr, &[i, j]);
                            ctx.delay(ctx.adaptive_delay(40.0, size));
                        }
                    }
                }
            } else {
                let pi = pdq_partition(ctx, arr, low, high, size);
                if ctx.stopped() {
                    return;
                }
                if pi > 0 {
                    pdq_sort(ctx, arr, low, pi - 1, depth - 1, size);
                }
                pdq_sort(ctx, arr, pi, high, depth - 1, size);
            }
        }
    }

    while !ctx.stopped() {
        let mut array = ctx.random_array(size);
        let depth = ((size.max(1) as f64).log2().floor() as i32) * 2;

        if size > 0 {
            pdq_sort(ctx, &mut array, 0, size - 1, depth, size);
        }

        ctx.play_sorted(&array);
        if !loop_ || ctx.stopped() {
            return;
        }
        ctx.delay(ctx.adaptive_delay(200.0, size));
    }
}
