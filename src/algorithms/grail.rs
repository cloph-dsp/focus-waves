use crate::audio::Wave;
use crate::engine::SortCtx;

// Ported from TypeScript: src/utils/audio/algorithms/grail.ts
fn rotate(ctx: &mut SortCtx, arr: &mut [i64], start: usize, mid: usize, end: usize, size: usize) {
    let mut start = start;
    let mut mid = mid;
    while start < mid && mid < end {
        if ctx.stopped() {
            return;
        }
        arr.swap(start, mid);
        ctx.play(ctx.freq(arr[start] as f64, size as f64), 0.02, Wave::Sine);
        ctx.visual(arr, &[start, mid]);
        ctx.delay(ctx.adaptive_delay(40.0, size));
        start += 1;
        mid += 1;
    }
}

fn grail_merge(ctx: &mut SortCtx, arr: &mut [i64], start: usize, mid: usize, end: usize, size: usize) {
    let mut i = start;
    let mut j = mid;
    while i < j && j < end {
        if ctx.stopped() {
            return;
        }
        if arr[i] <= arr[j] {
            i += 1;
        } else {
            rotate(ctx, arr, i, j, j + 1, size);
            j += 1;
        }
        ctx.play(ctx.freq(arr[i] as f64, size as f64), 0.02, Wave::Sine);
        ctx.visual(arr, &[i, j]);
        ctx.delay(ctx.adaptive_delay(45.0, size));
    }
}

#[allow(non_snake_case)]
pub fn generateGrailSort(ctx: &mut SortCtx, size: usize, loop_: bool) {
    while !ctx.stopped() {
        let mut array = ctx.random_array(size);
        let mut width = 1usize;

        while width < size {
            let mut start = 0usize;
            while start < size {
                if ctx.stopped() {
                    return;
                }
                let mid = (start + width).min(size);
                let end = (start + width * 2).min(size);
                if mid < end {
                    grail_merge(ctx, &mut array, start, mid, end, size);
                }
                start += width * 2;
            }
            width *= 2;
        }

        ctx.play_sorted(&array);
        if !loop_ || ctx.stopped() {
            return;
        }
        ctx.delay(ctx.adaptive_delay(200.0, size));
    }
}
