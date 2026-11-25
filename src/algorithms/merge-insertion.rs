use crate::audio::Wave;
use crate::engine::SortCtx;

// Ported from TypeScript: src/utils/audio/algorithms/merge-insertion.ts
#[allow(non_snake_case)]
pub fn generateMergeInsertionSort(ctx: &mut SortCtx, size: usize, loop_: bool) {
    while !ctx.stopped() {
        let mut array = ctx.random_array(size);
        let note_duration = ctx.adaptive_duration(0.0075, size);

        if array.len() <= 1 {
            ctx.play_sorted(&array);
            if !loop_ || ctx.stopped() {
                return;
            }
            ctx.delay(ctx.adaptive_delay(200.0, size));
            continue;
        }

        let mut pairs: Vec<(i64, i64)> = Vec::new();
        let mut i = 0usize;
        while i + 1 < array.len() && !ctx.stopped() {
            if array[i] > array[i + 1] {
                pairs.push((array[i + 1], array[i]));
            } else {
                pairs.push((array[i], array[i + 1]));
            }
            ctx.play(
                ctx.freq(array[i] as f64, size as f64),
                note_duration,
                Wave::Sine,
            );
            ctx.visual(&array, &[i, i + 1]);
            ctx.delay(ctx.adaptive_delay(200.0, size));
            i += 2;
        }

        let mut sorted: Vec<i64> = pairs.iter().map(|p| p.0).collect();
        sorted.sort_unstable();

        for &(_, larger) in &pairs {
            let pos = sorted
                .iter()
                .position(|&x| x > larger)
                .unwrap_or(sorted.len());
            sorted.insert(pos, larger);
            ctx.play(
                ctx.freq(larger as f64, size as f64),
                note_duration,
                Wave::Sine,
            );
            ctx.visual(&sorted, &[pos]);
            ctx.delay(ctx.adaptive_delay(200.0, size));
        }

        for i in 0..array.len() {
            array[i] = sorted[i];
        }

        ctx.play_sorted(&array);
        if !loop_ || ctx.stopped() {
            return;
        }
        ctx.delay(ctx.adaptive_delay(200.0, size));
    }
}
