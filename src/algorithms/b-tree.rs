use crate::audio::Wave;
use crate::engine::SortCtx;

// Ported from TypeScript: src/utils/audio/algorithms/b-tree.ts
// (b-tree.ts delegates to binary-tree.ts: insertion into a sorted result with a square wave.)
#[allow(non_snake_case)]
pub fn generateBTreeSort(ctx: &mut SortCtx, size: usize, loop_: bool) {
    while !ctx.stopped() {
        let mut array = ctx.random_array(size);
        let note_duration = ctx.adaptive_duration(0.007, size);
        let audio_delay = ctx.adaptive_delay(200.0, size);
        let mut result: Vec<i64> = Vec::with_capacity(array.len());

        for i in 0..array.len() {
            if ctx.stopped() {
                return;
            }
            let value = array[i];
            let mut pos = 0usize;
            for (j, existing) in result.iter().enumerate() {
                if value > *existing {
                    pos = j + 1;
                }
            }
            result.insert(pos, value);
            ctx.play(ctx.freq(value as f64, size as f64), note_duration, Wave::Square);
            ctx.visual(&result, &[pos]);
            ctx.delay(audio_delay);
        }

        array.copy_from_slice(&result);
        ctx.play_sorted(&array);
        if !loop_ || ctx.stopped() {
            return;
        }
        ctx.delay(ctx.adaptive_delay(200.0, size));
    }
}
