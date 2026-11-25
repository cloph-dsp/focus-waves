use crate::audio::Wave;
use crate::engine::SortCtx;

// Ported from TypeScript: src/utils/audio/algorithms/sleep.ts
#[allow(non_snake_case)]
pub fn generateSleepSort(ctx: &mut SortCtx, size: usize, loop_: bool) {
    while !ctx.stopped() {
        let mut array = ctx.random_array(size);
        let note_duration = ctx.adaptive_duration(0.0085, size);

        // Timers fire in ascending value order; replay that schedule without spawning threads.
        let mut result = array.clone();
        result.sort_unstable();
        let mut previous = 0i64;
        for &value in &result {
            if ctx.stopped() {
                return;
            }
            ctx.delay(((value - previous) * 5).max(0) as u64);
            ctx.play(ctx.freq(value as f64, size as f64), note_duration, Wave::Sine);
            previous = value;
        }

        for i in 0..result.len() {
            if ctx.stopped() {
                return;
            }
            array[i] = result[i];
            ctx.visual(&array, &[i]);
            ctx.delay(ctx.adaptive_delay(35.0, size));
        }

        ctx.play_sorted(&array);
        if !loop_ || ctx.stopped() {
            return;
        }
        ctx.delay(ctx.adaptive_delay(200.0, size));
    }
}
