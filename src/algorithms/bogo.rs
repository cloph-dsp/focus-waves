use crate::audio::Wave;
use crate::engine::SortCtx;
use rand::RngExt;

fn is_sorted(arr: &[i64]) -> bool {
    for i in 0..arr.len().saturating_sub(1) {
        if arr[i] > arr[i + 1] {
            return false;
        }
    }
    true
}

// Ported from TypeScript: src/utils/audio/algorithms/bogo.ts
#[allow(non_snake_case)]
pub fn generateBogoSort(ctx: &mut SortCtx, size: usize, loop_: bool) {
    while !ctx.stopped() {
        let mut array = ctx.random_array(size);
        let note_duration = ctx.adaptive_duration(0.008, size);
        let audio_delay = ctx.adaptive_delay(35.0, size);
        let mut rng = rand::rng();

        while !is_sorted(&array) && !ctx.stopped() {
            for i in (1..array.len()).rev() {
                if ctx.stopped() {
                    return;
                }
                let j = rng.random_range(0..=i);
                array.swap(i, j);
                ctx.play(
                    ctx.freq(array[i] as f64, size as f64),
                    note_duration,
                    Wave::Sine,
                );
                ctx.visual(&array, &[i, j]);
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
