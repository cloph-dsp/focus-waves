use crate::audio::Wave;
use crate::engine::SortCtx;

// Ported from TypeScript: src/utils/audio/algorithms/tag.ts
#[allow(non_snake_case)]
pub fn generateTagSort(ctx: &mut SortCtx, size: usize, loop_: bool) {
    while !ctx.stopped() {
        let mut array = ctx.random_array(size);
        let note_duration = ctx.adaptive_duration(0.0085, size);

        // Sorting the (value, index) tags sonifies every comparison.
        let mut tags: Vec<(i64, usize)> = array
            .iter()
            .enumerate()
            .map(|(idx, &val)| (val, idx))
            .collect();
        tags.sort_by(|a, b| {
            ctx.play(
                ctx.freq(a.0 as f64, size as f64),
                note_duration / 3.0,
                Wave::Sine,
            );
            a.0.cmp(&b.0)
        });

        for i in 0..tags.len() {
            if ctx.stopped() {
                return;
            }
            array[i] = tags[i].0;
            ctx.play(
                ctx.freq(array[i] as f64, size as f64),
                note_duration,
                Wave::Sine,
            );
            ctx.visual(&array, &[i]);
            ctx.delay(ctx.adaptive_delay(40.0, size));
        }

        ctx.play_sorted(&array);
        if !loop_ || ctx.stopped() {
            return;
        }
        ctx.delay(ctx.adaptive_delay(200.0, size));
    }
}
