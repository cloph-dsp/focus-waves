use crate::audio::Wave;
use crate::engine::SortCtx;

// Ported from TypeScript: src/utils/audio/algorithms/postman.ts
#[allow(non_snake_case)]
pub fn generatePostmanSort(ctx: &mut SortCtx, size: usize, loop_: bool) {
    while !ctx.stopped() {
        let mut array = ctx.random_array(size);
        let note_duration = ctx.adaptive_duration(0.0085, size);
        let audio_delay = ctx.adaptive_delay(40.0, size);
        let buckets = 10usize;

        for _pass in 0..2 {
            if ctx.stopped() {
                return;
            }
            let mut bins: Vec<Vec<i64>> = vec![Vec::new(); buckets];

            for i in 0..array.len() {
                if ctx.stopped() {
                    return;
                }
                let bin = ((array[i] as f64 / size as f64) * ((buckets - 1) as f64)).floor()
                    as usize;
                bins[bin].push(array[i]);
                ctx.play(
                    ctx.freq(array[i] as f64, size as f64),
                    note_duration,
                    Wave::Sine,
                );
                ctx.visual(&array, &[i]);
                ctx.delay(audio_delay);
            }

            let mut index = 0usize;
            for bin in &mut bins {
                bin.sort_unstable();
                for &val in bin.iter() {
                    array[index] = val;
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
