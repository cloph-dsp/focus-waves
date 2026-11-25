use crate::audio::Wave;
use crate::engine::SortCtx;

// Ported from TypeScript: src/utils/audio/algorithms/sleep.ts
#[allow(non_snake_case)]
pub fn generateSleepSort(ctx: &mut SortCtx, size: usize, loop_: bool) {
    while !ctx.stopped() {
        let mut array = ctx.random_array(size);
        let note_duration = ctx.adaptive_duration(0.0085, size);

        // Values are 1..=size, so timers fire in ascending value order. As each
        // timer fires, move that value into the next output slot and sonify it.
        let mut previous = 0i64;
        for out in 0..array.len() {
            if ctx.stopped() {
                return;
            }
            let value = (out + 1) as i64;
            ctx.delay(((value - previous) * 5).max(0) as u64);
            previous = value;

            if let Some(found) = (out..array.len()).find(|&i| array[i] == value) {
                array.swap(out, found);
            }
            ctx.play(ctx.freq(value as f64, size as f64), note_duration, Wave::Sine);
            ctx.visual(&array, &[out]);
            ctx.delay(ctx.adaptive_delay(35.0, size));
        }

        ctx.play_sorted(&array);
        if !loop_ || ctx.stopped() {
            return;
        }
        ctx.delay(ctx.adaptive_delay(200.0, size));
    }
}
