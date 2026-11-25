use crate::audio::Wave;
use crate::engine::SortCtx;

// Ported from TypeScript: src/utils/audio/algorithms/aa-tree.ts
// The TS generator delegates directly to generateBinaryTreeSort, so we inline
// the same array-based tree insertion sort here.
#[allow(non_snake_case)]
pub fn generateAATreeSort(ctx: &mut SortCtx, size: usize, loop_: bool) {
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
            let mut pos = 0;
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

        for (i, value) in result.iter().enumerate() {
            array[i] = *value;
        }
        ctx.play_sorted(&array);

        if !loop_ || ctx.stopped() {
            return;
        }
        ctx.delay(ctx.adaptive_delay(200.0, size));
    }
}
