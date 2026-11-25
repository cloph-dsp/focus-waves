use crate::audio::Wave;
use crate::engine::SortCtx;

// Ported from TypeScript: src/utils/audio/algorithms/brick.ts
#[allow(non_snake_case)]
pub fn generateBrickSort(ctx: &mut SortCtx, size: usize, loop_: bool) {
    while !ctx.stopped() {
        let mut array = ctx.random_array(size);
        let note_duration = 0.02f32;
        let audio_delay = ctx.adaptive_delay(200.0, size);
        let n = array.len();

        let mut sorted = false;
        while !sorted {
            if ctx.stopped() {
                return;
            }
            sorted = true;

            // Odd phase.
            let mut i = 1usize;
            while i + 1 < n {
                if ctx.stopped() {
                    return;
                }
                if array[i] > array[i + 1] {
                    array.swap(i, i + 1);
                    sorted = false;
                    ctx.play(ctx.freq(array[i] as f64, 100.0), note_duration, Wave::Sine);
                    ctx.visual(&array, &[i, i + 1]);
                    ctx.delay(audio_delay);
                }
                i += 2;
            }

            // Even phase.
            let mut i = 0usize;
            while i + 1 < n {
                if ctx.stopped() {
                    return;
                }
                if array[i] > array[i + 1] {
                    array.swap(i, i + 1);
                    sorted = false;
                    ctx.play(ctx.freq(array[i] as f64, 100.0), note_duration, Wave::Sine);
                    ctx.visual(&array, &[i, i + 1]);
                    ctx.delay(audio_delay);
                }
                i += 2;
            }
        }

        ctx.play_sorted(&array);
        if !loop_ || ctx.stopped() {
            return;
        }
        ctx.delay(ctx.adaptive_delay(200.0, size));
    }
}
