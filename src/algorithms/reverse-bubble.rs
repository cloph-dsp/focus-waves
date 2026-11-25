use crate::audio::Wave;
use crate::engine::SortCtx;

// Ported from TypeScript: src/utils/audio/algorithms/reverse-bubble.ts
#[allow(non_snake_case)]
pub fn generateReverseBubbleSort(ctx: &mut SortCtx, size: usize, loop_: bool) {
    while !ctx.stopped() {
        let mut array = ctx.random_array(size);
        let note_duration = ctx.adaptive_duration(0.0035, size);
        let audio_delay = ctx.adaptive_delay(32.0, size);

        for i in 0..array.len() {
            if ctx.stopped() {
                return;
            }
            for j in (i + 1..array.len()).rev() {
                if ctx.stopped() {
                    return;
                }
                if array[j] < array[j - 1] {
                    array.swap(j, j - 1);
                    ctx.play(
                        ctx.freq(array[j] as f64, size as f64),
                        note_duration,
                        Wave::Sine,
                    );
                    ctx.play_after(
                        note_duration / 2.0,
                        ctx.freq(array[j - 1] as f64, size as f64),
                        note_duration,
                        Wave::Sine,
                    );
                    ctx.visual(&array, &[j - 1, j]);
                    ctx.delay(audio_delay);
                }
            }
        }

        ctx.play_sorted(&array);
        if !loop_ || ctx.stopped() {
            return;
        }
        ctx.delay(ctx.adaptive_delay(200.0, size));
    }
}
