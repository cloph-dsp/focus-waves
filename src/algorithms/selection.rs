use crate::audio::Wave;
use crate::engine::SortCtx;

// Ported from TypeScript: src/utils/audio/algorithms/selection.ts
#[allow(non_snake_case)]
pub fn generateSelectionSort(ctx: &mut SortCtx, size: usize, loop_: bool) {
    while !ctx.stopped() {
        let mut array = ctx.random_array(size);
        let note_duration = ctx.adaptive_duration(0.008, size);
        let audio_delay = ctx.adaptive_delay(65.0, size);

        for i in 0..array.len().saturating_sub(1) {
            if ctx.stopped() {
                return;
            }
            let mut min_idx = i;
            for j in i + 1..array.len() {
                if ctx.stopped() {
                    return;
                }
                if array[j] < array[min_idx] {
                    min_idx = j;
                }
                ctx.play(
                    ctx.freq(array[j] as f64, size as f64),
                    note_duration / 2.0,
                    Wave::Sine,
                );
                ctx.visual(&array, &[i, j, min_idx]);
                ctx.delay(audio_delay);
            }
            if min_idx != i {
                array.swap(i, min_idx);
                ctx.play(
                    ctx.freq(array[i] as f64, size as f64),
                    note_duration * 1.5,
                    Wave::Sine,
                );
                ctx.visual(&array, &[i, min_idx]);
                ctx.delay(audio_delay);
            }
        }

        ctx.play_sorted(&array);
        if !loop_ || ctx.stopped() {
            return;
        }
        ctx.delay(ctx.adaptive_delay(200.0, size));
    }
}
