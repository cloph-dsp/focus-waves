use crate::audio::Wave;
use crate::engine::SortCtx;

// Ported from TypeScript: src/utils/audio/algorithms/comb.ts
#[allow(non_snake_case)]
pub fn generateCombSort(ctx: &mut SortCtx, size: usize, loop_: bool) {
    while !ctx.stopped() {
        let mut array = ctx.random_array(size);
        let note_duration = ctx.adaptive_duration(0.0075, size);
        let shrink = 1.3f64;
        let n = array.len();
        let mut gap = n;
        let mut sorted = false;

        while !sorted && !ctx.stopped() {
            gap = ((gap as f64) / shrink).floor() as usize;
            if gap <= 1 {
                gap = 1;
                sorted = true;
            }

            let mut i = 0usize;
            while i + gap < n {
                if ctx.stopped() {
                    return;
                }
                if array[i] > array[i + gap] {
                    array.swap(i, i + gap);
                    ctx.play(ctx.freq(array[i] as f64, size as f64), note_duration, Wave::Sine);
                    sorted = false;
                    ctx.visual(&array, &[i, i + gap]);
                    ctx.delay(ctx.adaptive_delay(45.0, size));
                }
                i += 1;
            }
        }

        ctx.play_sorted(&array);
        if !loop_ || ctx.stopped() {
            return;
        }
        ctx.delay(ctx.adaptive_delay(200.0, size));
    }
}
