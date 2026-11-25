use crate::audio::Wave;
use crate::engine::SortCtx;

// Ported from TypeScript: src/utils/audio/algorithms/counting.ts
#[allow(non_snake_case)]
pub fn generateCountingSort(ctx: &mut SortCtx, size: usize, loop_: bool) {
    while !ctx.stopped() {
        let mut array = ctx.random_array(size);
        let note_duration = ctx.adaptive_duration(0.0075, size);
        let max_value = *array.iter().max().unwrap_or(&0);
        let mut count = vec![0i64; max_value as usize + 1];

        for value in array.iter() {
            if ctx.stopped() {
                return;
            }
            count[*value as usize] += 1;
        }

        let mut index = 0usize;
        for i in 0..count.len() {
            if ctx.stopped() {
                return;
            }
            while count[i] > 0 && !ctx.stopped() {
                array[index] = i as i64;
                ctx.play(ctx.freq(i as f64, size as f64), note_duration, Wave::Sine);
                ctx.visual(&array, &[index]);
                ctx.delay(ctx.adaptive_delay(45.0, size));
                index += 1;
                count[i] -= 1;
            }
        }

        ctx.play_sorted(&array);
        if !loop_ || ctx.stopped() {
            return;
        }
        ctx.delay(ctx.adaptive_delay(200.0, size));
    }
}
