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

        // The TS source calls generateInsertionSort here, which draws a fresh random
        // array and would make that helper's play_sorted the captured one. Finish the
        // insertion pass on THIS array instead, keeping flash's faster note timing.
        for i in 1..n {
            if ctx.stopped() {
                return;
            }
            let key = array[i];
            let mut j = i;
            while j > 0 && array[j - 1] > key && !ctx.stopped() {
                array[j] = array[j - 1];
                ctx.play(ctx.freq(array[j] as f64, size as f64), note_duration, Wave::Sine);
                ctx.visual(&array, &[j - 1, j]);
                ctx.delay(audio_delay);
                j -= 1;
            }
            array[j] = key;
            ctx.play(ctx.freq(key as f64, size as f64), note_duration * 1.2, Wave::Sine);
            ctx.visual(&array, &[j]);
            ctx.delay(audio_delay);
        }

        ctx.play_sorted(&array);
        if !loop_ || ctx.stopped() {
            return;
        }
        ctx.delay(ctx.adaptive_delay(200.0, size));
    }
}
