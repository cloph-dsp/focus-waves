use crate::audio::Wave;
use crate::engine::SortCtx;

// Ported from TypeScript: src/utils/audio/algorithms/flash.ts
#[allow(non_snake_case)]
pub fn generateFlashSort(ctx: &mut SortCtx, size: usize, loop_: bool) {
    while !ctx.stopped() {
        let mut array = ctx.random_array(size);
        let note_duration = ctx.adaptive_duration(0.0085, size);
        let audio_delay = ctx.adaptive_delay(40.0, size);
        let n = array.len();
        let m = (size as f64 * 0.43).floor() as usize;
        let min = *array.iter().min().unwrap_or(&0);
        let max = *array.iter().max().unwrap_or(&0);

        if m > 0 && max > min {
            let c1 = (m - 1) as f64 / (max - min) as f64;
            let mut buckets = vec![0usize; m];

            for i in 0..n {
                if ctx.stopped() {
                    return;
                }
                let k = ((c1 * (array[i] - min) as f64).floor() as usize).min(m - 1);
                buckets[k] += 1;
                ctx.play(ctx.freq(array[i] as f64, size as f64), note_duration, Wave::Sine);
                ctx.visual(&array, &[i]);
                ctx.delay(audio_delay);
            }

            for i in 1..m {
                buckets[i] += buckets[i - 1];
            }

            for i in 0..n {
                if ctx.stopped() {
                    return;
                }
                let k = ((c1 * (array[i] - min) as f64).floor() as usize).min(m - 1);
                while i >= buckets[k] && buckets[k] > 0 && !ctx.stopped() {
                    let j = buckets[k] - 1;
                    array.swap(i, j);
                    ctx.play(ctx.freq(array[j] as f64, size as f64), note_duration, Wave::Sine);
                    ctx.visual(&array, &[i, j]);
                    ctx.delay(audio_delay);
                    buckets[k] -= 1;
                }
            }
        }

        // The TS source finishes with generateInsertionSort(size, visualCallback, false).
        super::insertion::generateInsertionSort(ctx, size, false);
        if ctx.stopped() {
            return;
        }
        ctx.play_sorted(&array);
        if !loop_ || ctx.stopped() {
            return;
        }
        ctx.delay(ctx.adaptive_delay(200.0, size));
    }
}
