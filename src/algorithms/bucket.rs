use crate::audio::Wave;
use crate::engine::SortCtx;

// Ported from TypeScript: src/utils/audio/algorithms/bucket.ts
#[allow(non_snake_case)]
pub fn generateBucketSort(ctx: &mut SortCtx, size: usize, loop_: bool) {
    while !ctx.stopped() {
        let mut array = ctx.random_array(size);
        let note_duration = ctx.adaptive_duration(0.0075, size);
        let bucket_count = 10usize;
        let mut buckets: Vec<Vec<i64>> = vec![Vec::new(); bucket_count];
        let max_value = *array.iter().max().unwrap_or(&1);
        let audio_delay = ctx.adaptive_delay(200.0, size);

        // Distribute into buckets.
        for value in array.iter() {
            if ctx.stopped() {
                return;
            }
            let bucket_index = ((*value as f64 / max_value as f64) * ((bucket_count - 1) as f64))
                .floor() as usize;
            let bucket_index = bucket_index.min(bucket_count - 1);
            buckets[bucket_index].push(*value);
            ctx.play(
                ctx.freq(*value as f64, size as f64),
                note_duration / 2.0,
                Wave::Sine,
            );
        }

        // Sort each bucket and place back.
        let mut index = 0usize;
        for bucket in buckets.iter_mut() {
            if ctx.stopped() {
                return;
            }
            bucket.sort_unstable();
            for value in bucket.iter() {
                if ctx.stopped() {
                    return;
                }
                array[index] = *value;
                ctx.play(
                    ctx.freq(array[index] as f64, size as f64),
                    note_duration,
                    Wave::Sine,
                );
                ctx.visual(&array, &[index]);
                ctx.delay(audio_delay);
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
