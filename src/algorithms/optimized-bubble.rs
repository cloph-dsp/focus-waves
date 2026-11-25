use crate::audio::Wave;
use crate::engine::SortCtx;

// Ported from TypeScript: src/utils/audio/algorithms/optimized-bubble.ts
#[allow(non_snake_case)]
pub fn generateOptimizedBubbleSort(ctx: &mut SortCtx, size: usize, loop_: bool) {
    while !ctx.stopped() {
        let mut array = ctx.random_array(size);
        let note_duration = ctx.adaptive_duration(0.0035, size);
        let audio_delay = ctx.adaptive_delay(28.0, size);

        for i in 0..array.len() {
            if ctx.stopped() {
                return;
            }
            let mut swapped = false;

            for j in 0..array.len().saturating_sub(i + 1) {
                if ctx.stopped() {
                    return;
                }
                if array[j] > array[j + 1] {
                    array.swap(j, j + 1);
                    swapped = true;
                    ctx.play(
                        ctx.freq(array[j] as f64, size as f64),
                        note_duration,
                        Wave::Triangle,
                    );
                    ctx.play_after(
                        note_duration / 2.0,
                        ctx.freq(array[j + 1] as f64, size as f64),
                        note_duration,
                        Wave::Triangle,
                    );
                    ctx.visual(&array, &[j, j + 1]);
                    ctx.delay(audio_delay);
                }
            }

            if !swapped {
                break;
            }
        }

        ctx.play_sorted(&array);
        if !loop_ || ctx.stopped() {
            return;
        }
        ctx.delay(ctx.adaptive_delay(200.0, size));
    }
}
