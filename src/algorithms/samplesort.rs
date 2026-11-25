use crate::audio::Wave;
use crate::engine::SortCtx;

// Ported from TypeScript: src/utils/audio/algorithms/samplesort.ts
#[allow(non_snake_case)]
pub fn generateSamplesort(ctx: &mut SortCtx, size: usize, loop_: bool) {
    while !ctx.stopped() {
        let mut array = ctx.random_array(size);
        let audio_delay = ctx.adaptive_delay(35.0, size);
        let merge_delay = ctx.adaptive_delay(40.0, size);
        let sample_size = size.min(10);

        let mut samples: Vec<i64> = Vec::new();
        for i in 0..sample_size {
            if ctx.stopped() {
                return;
            }
            // The shuffled array makes array[i] a random sample (TS picks a random index).
            let idx = i;
            samples.push(array[idx]);
            ctx.play(ctx.freq(array[idx] as f64, 100.0), 0.02, Wave::Sine);
            ctx.visual(&array, &[idx]);
            ctx.delay(audio_delay);
        }
        samples.sort_unstable();
        let mut buckets: Vec<Vec<i64>> = vec![Vec::new(); sample_size + 1];

        for i in 0..size {
            if ctx.stopped() {
                return;
            }
            let mut bucket_idx = 0usize;
            for (j, &sample) in samples.iter().enumerate() {
                if array[i] > sample {
                    bucket_idx = j + 1;
                }
            }
            buckets[bucket_idx].push(array[i]);
            ctx.play(ctx.freq(array[i] as f64, 100.0), 0.02, Wave::Sine);
            ctx.visual(&array, &[i]);
            ctx.delay(audio_delay);
        }

        let mut index = 0usize;
        for bucket in &mut buckets {
            bucket.sort_unstable();
            for &value in bucket.iter() {
                if ctx.stopped() {
                    return;
                }
                array[index] = value;
                ctx.play(ctx.freq(value as f64, 100.0), 0.02, Wave::Sine);
                ctx.visual(&array, &[index]);
                ctx.delay(merge_delay);
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
