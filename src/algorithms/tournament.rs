use crate::audio::Wave;
use crate::engine::SortCtx;

// Ported from TypeScript: src/utils/audio/algorithms/tournament.ts
#[allow(non_snake_case)]
pub fn generateTournamentSort(ctx: &mut SortCtx, size: usize, loop_: bool) {
    while !ctx.stopped() {
        let mut array = ctx.random_array(size);
        let note_duration = ctx.adaptive_duration(0.0075, size);
        let mut tree = array.clone();

        for i in 0..array.len() {
            if ctx.stopped() {
                return;
            }
            let mut min_idx = 0usize;
            for j in 1..tree.len() {
                if ctx.stopped() {
                    return;
                }
                if tree[j] < tree[min_idx] {
                    min_idx = j;
                }
                ctx.play(
                    ctx.freq(tree[j] as f64, size as f64),
                    note_duration / 2.0,
                    Wave::Sine,
                );
                ctx.visual(&tree, &[j, min_idx]);
                ctx.delay(ctx.adaptive_delay(40.0, size));
            }
            array[i] = tree[min_idx];
            // TypeScript uses Infinity for the exhausted slot; i64::MAX is our infinity.
            tree[min_idx] = i64::MAX;
            ctx.play(
                ctx.freq(array[i] as f64, size as f64),
                note_duration * 1.5,
                Wave::Sine,
            );
            ctx.visual(&array, &[i]);
            ctx.delay(ctx.adaptive_delay(200.0, size));
        }

        ctx.play_sorted(&array);
        if !loop_ || ctx.stopped() {
            return;
        }
        ctx.delay(ctx.adaptive_delay(200.0, size));
    }
}
