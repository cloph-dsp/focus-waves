use crate::audio::Wave;
use crate::engine::SortCtx;

// Ported from TypeScript: src/utils/audio/algorithms/oscillating-merge.ts
#[allow(non_snake_case)]
pub fn generateOscillatingMergeSort(ctx: &mut SortCtx, size: usize, loop_: bool) {
    fn oscillating_merge(
        ctx: &mut SortCtx,
        arr: &mut [i64],
        start: usize,
        end: usize,
        direction: bool,
        size: usize,
    ) {
        if end <= start + 1 || ctx.stopped() {
            return;
        }

        let mid = (start + end) / 2;
        oscillating_merge(ctx, arr, start, mid, !direction, size);
        oscillating_merge(ctx, arr, mid, end, !direction, size);

        let mut temp: Vec<i64> = Vec::new();
        if direction {
            let mut i = start;
            let mut j = mid;
            while i < mid && j < end {
                if ctx.stopped() {
                    return;
                }
                if arr[i] <= arr[j] {
                    temp.push(arr[i]);
                    i += 1;
                } else {
                    temp.push(arr[j]);
                    j += 1;
                }
            }
            while i < mid {
                temp.push(arr[i]);
                i += 1;
            }
            while j < end {
                temp.push(arr[j]);
                j += 1;
            }
        } else {
            let mut i = mid as isize - 1;
            let mut j = end as isize - 1;
            while i >= start as isize && j >= mid as isize {
                if ctx.stopped() {
                    return;
                }
                if arr[i as usize] >= arr[j as usize] {
                    temp.push(arr[i as usize]);
                    i -= 1;
                } else {
                    temp.push(arr[j as usize]);
                    j -= 1;
                }
            }
            while i >= start as isize {
                temp.push(arr[i as usize]);
                i -= 1;
            }
            while j >= mid as isize {
                temp.push(arr[j as usize]);
                j -= 1;
            }
            // Backward merge collects values from largest to smallest; flip so
            // the segment is written back in ascending order.
            temp.reverse();
        }

        for k in 0..temp.len() {
            if ctx.stopped() {
                return;
            }
            arr[start + k] = temp[k];
            ctx.play(
                ctx.freq(arr[start + k] as f64, size as f64),
                0.02,
                Wave::Sine,
            );
            ctx.visual(arr, &[start + k]);
            ctx.delay(ctx.adaptive_delay(45.0, size));
        }
    }

    while !ctx.stopped() {
        let mut array = ctx.random_array(size);

        if size > 0 {
            oscillating_merge(ctx, &mut array, 0, size, true, size);
        }

        ctx.play_sorted(&array);
        if !loop_ || ctx.stopped() {
            return;
        }
        ctx.delay(ctx.adaptive_delay(200.0, size));
    }
}
