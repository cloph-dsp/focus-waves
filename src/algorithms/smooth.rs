use crate::audio::Wave;
use crate::engine::SortCtx;

fn sift(
    ctx: &mut SortCtx,
    arr: &mut [i64],
    root: usize,
    size: usize,
    note_duration: f32,
) {
    let mut root = root;
    while root > 0 && !ctx.stopped() {
        let left = root - 1;
        if arr[left] > arr[root] {
            arr.swap(left, root);
            ctx.play(ctx.freq(arr[root] as f64, size as f64), note_duration, Wave::Sine);
            ctx.visual(arr, &[left, root]);
            ctx.delay(ctx.adaptive_delay(200.0, size));
            root = left;
        } else {
            break;
        }
    }
}

// Ported from TypeScript: src/utils/audio/algorithms/smooth.ts
#[allow(non_snake_case)]
pub fn generateSmoothSort(ctx: &mut SortCtx, size: usize, loop_: bool) {
    while !ctx.stopped() {
        let mut array = ctx.random_array(size);
        let note_duration = ctx.adaptive_duration(0.0075, size);

        for i in 0..array.len() {
            if ctx.stopped() {
                return;
            }
            sift(ctx, &mut array, i, size, note_duration);
        }

        let mut i = array.len();
        while i > 1 {
            i -= 1;
            if ctx.stopped() {
                return;
            }
            array.swap(0, i);
            ctx.play(ctx.freq(array[0] as f64, size as f64), note_duration, Wave::Sine);
            ctx.visual(&array, &[0, i]);
            ctx.delay(ctx.adaptive_delay(200.0, size));
            sift(ctx, &mut array, 0, size, note_duration);
        }

        ctx.play_sorted(&array);
        if !loop_ || ctx.stopped() {
            return;
        }
        ctx.delay(ctx.adaptive_delay(200.0, size));
    }
}
