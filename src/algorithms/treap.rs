use crate::audio::Wave;
use crate::engine::SortCtx;

// Ported from TypeScript: src/utils/audio/algorithms/treap.ts
// The TS generator is an alias of generateBinaryTreeSort, so that body is inlined.
#[allow(non_snake_case)]
pub fn generateTreapSort(ctx: &mut SortCtx, size: usize, loop_: bool) {
    while !ctx.stopped() {
        let mut array = ctx.random_array(size);
        let note_duration = ctx.adaptive_duration(0.007, size);
        let audio_delay = ctx.adaptive_delay(200.0, size);

        let mut result: Vec<i64> = Vec::with_capacity(array.len());
        for i in 0..array.len() {
            if ctx.stopped() {
                return;
            }
            let mut pos = 0usize;
            for (j, &value) in result.iter().enumerate() {
                if ctx.stopped() {
                    return;
                }
                if array[i] > value {
                    pos = j + 1;
                }
            }
            result.insert(pos, array[i]);
            ctx.play(
                ctx.freq(array[i] as f64, size as f64),
                note_duration,
                Wave::Square,
            );
            ctx.visual(&result, &[pos]);
            ctx.delay(audio_delay);
        }

        for i in 0..result.len() {
            if ctx.stopped() {
                return;
            }
            array[i] = result[i];
        }
        ctx.play_sorted(&array);
        if !loop_ || ctx.stopped() {
            return;
        }
        ctx.delay(ctx.adaptive_delay(200.0, size));
    }
}
