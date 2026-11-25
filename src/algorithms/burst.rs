use crate::audio::Wave;
use crate::engine::SortCtx;
use std::collections::BTreeMap;

// Ported from TypeScript: src/utils/audio/algorithms/burst.ts
#[allow(non_snake_case)]
pub fn generateBurstSort(ctx: &mut SortCtx, size: usize, loop_: bool) {
    while !ctx.stopped() {
        let mut array = ctx.random_array(size);
        let note_duration = ctx.adaptive_duration(0.0085, size);
        let mut buckets: BTreeMap<i64, Vec<i64>> = BTreeMap::new();

        for i in 0..array.len() {
            if ctx.stopped() {
                return;
            }
            let key = array[i] / 10;
            buckets.entry(key).or_default().push(array[i]);
            ctx.play(
                ctx.freq(array[i] as f64, size as f64),
                note_duration,
                Wave::Sine,
            );
            ctx.visual(&array, &[i]);
            ctx.delay(ctx.adaptive_delay(40.0, size));
        }

        let mut index = 0usize;
        for (_, bucket) in buckets.iter_mut() {
            if ctx.stopped() {
                return;
            }
            bucket.sort_unstable();
            for value in bucket.iter() {
                if ctx.stopped() {
                    return;
                }
                array[index] = *value;
                ctx.play(ctx.freq(*value as f64, size as f64), note_duration, Wave::Sine);
                ctx.visual(&array, &[index]);
                ctx.delay(ctx.adaptive_delay(40.0, size));
                index += 1;
            }
        }

        ctx.play_sorted(&array);
        if !loop_ || ctx.stopped() {
            return;
        }
        ctx.delay(ctx.adaptive_delay(200.0, size));
    }
}
