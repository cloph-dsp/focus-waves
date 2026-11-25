use crate::audio::Wave;
use crate::engine::SortCtx;

// Ported from TypeScript: src/utils/audio/algorithms/odd-even.ts
#[allow(non_snake_case)]
pub fn generateOddEvenSort(ctx: &mut SortCtx, size: usize, loop_: bool) {
    while !ctx.stopped() {
        let mut array = ctx.random_array(size);
        let note_duration = ctx.adaptive_duration(0.0075, size);
        let mut sorted = false;

        while !sorted && !ctx.stopped() {
            sorted = true;

            // Odd phase
            let mut i = 1usize;
            while i < array.len().saturating_sub(1) && !ctx.stopped() {
                if array[i] > array[i + 1] {
                    array.swap(i, i + 1);
                    ctx.play(
                        ctx.freq(array[i] as f64, size as f64),
                        note_duration,
                        Wave::Sine,
                    );
                    sorted = false;
                    ctx.visual(&array, &[i, i + 1]);
                    ctx.delay(ctx.adaptive_delay(200.0, size));
                }
                i += 2;
            }

            // Even phase
            let mut i = 0usize;
            while i < array.len().saturating_sub(1) && !ctx.stopped() {
                if array[i] > array[i + 1] {
                    array.swap(i, i + 1);
                    ctx.play(
                        ctx.freq(array[i + 1] as f64, size as f64),
                        note_duration,
                        Wave::Sine,
                    );
                    sorted = false;
                    ctx.visual(&array, &[i, i + 1]);
                    ctx.delay(ctx.adaptive_delay(200.0, size));
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
