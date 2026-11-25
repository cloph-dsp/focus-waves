use crate::audio::Wave;
use crate::engine::SortCtx;

// Ported from TypeScript: src/utils/audio/algorithms/american-flag.ts
#[allow(non_snake_case)]
pub fn generateAmericanFlagSort(ctx: &mut SortCtx, size: usize, loop_: bool) {
    while !ctx.stopped() {
        let mut array = ctx.random_array(size);
        let note_duration = ctx.adaptive_duration(0.0085, size);
        let audio_delay = ctx.adaptive_delay(40.0, size);

        let max_value = *array.iter().max().unwrap_or(&0);
        let mut max_digits = 1;
        let mut m = max_value;
        while m >= 10 {
            max_digits += 1;
            m /= 10;
        }

        for digit in (0..max_digits).rev() {
            if ctx.stopped() {
                return;
            }
            let divisor = 10_i64.pow(digit as u32);
            let mut buckets: Vec<Vec<i64>> = vec![Vec::new(); 10];

            for i in 0..array.len() {
                if ctx.stopped() {
                    return;
                }
                let d = ((array[i] / divisor) % 10) as usize;
                buckets[d].push(array[i]);
                ctx.play(ctx.freq(array[i] as f64, size as f64), note_duration, Wave::Sine);
                ctx.visual(&array, &[i]);
                ctx.delay(audio_delay);
            }

            let mut index = 0;
            for bucket in &buckets {
                for value in bucket {
                    array[index] = *value;
                    index += 1;
                }
            }
        }

        ctx.play_sorted(&array);

        if !loop_ || ctx.stopped() {
            return;
        }
        ctx.delay(ctx.adaptive_delay(200.0, size));
    }
}
