use crate::audio::Wave;
use crate::engine::SortCtx;

// Ported from TypeScript: src/utils/audio/algorithms/spreadsort.ts
#[allow(non_snake_case)]
pub fn generateSpreadsort(ctx: &mut SortCtx, size: usize, loop_: bool) {
    while !ctx.stopped() {
        // shortcut: TS draws 0..99 directly; shuffled 1..=size folded into 0..99 instead,
        // upgrade to rand::rng().random_range(0..100) if exact duplicates matter.
        let mut array: Vec<i64> = ctx.random_array(size).into_iter().map(|v| v % 100).collect();
        let max = *array.iter().max().unwrap_or(&1);
        let bucket_count = size.min(10);
        let mut buckets: Vec<Vec<i64>> = vec![Vec::new(); bucket_count];

        for i in 0..array.len() {
            if ctx.stopped() {
                return;
            }
            let bucket_index = if max > 0 {
                ((array[i] as f64 / max as f64) * (bucket_count - 1) as f64).floor() as usize
            } else {
                0
            };
            buckets[bucket_index.min(bucket_count - 1)].push(array[i]);
            ctx.play(ctx.freq(array[i] as f64, 100.0), 0.02, Wave::Sine);
            ctx.visual(&array, &[i]);
            ctx.delay(ctx.adaptive_delay(35.0, size));
        }

        let mut index = 0;
        for bucket in &mut buckets {
            bucket.sort_unstable();
            for &value in bucket.iter() {
                if ctx.stopped() {
                    return;
                }
                array[index] = value;
                ctx.play(ctx.freq(value as f64, 100.0), 0.02, Wave::Sine);
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
