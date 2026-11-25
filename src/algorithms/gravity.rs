use crate::audio::Wave;
use crate::engine::SortCtx;

// Ported from TypeScript: src/utils/audio/algorithms/gravity.ts
#[allow(non_snake_case)]
pub fn generateGravitySort(ctx: &mut SortCtx, size: usize, loop_: bool) {
    while !ctx.stopped() {
        let mut array = ctx.random_array(size);
        let note_duration = ctx.adaptive_duration(0.0085, size);
        let audio_delay = ctx.adaptive_delay(40.0, size);
        let max = array.iter().copied().max().unwrap_or(0) as usize;
        let mut abacus: Vec<Vec<i64>> = Vec::with_capacity(array.len());

        for i in 0..array.len() {
            if ctx.stopped() {
                return;
            }
            let mut row = vec![0i64; max];
            for bead in row.iter_mut().take(array[i] as usize) {
                *bead = 1;
            }
            abacus.push(row);
            ctx.play(ctx.freq(array[i] as f64, size as f64), note_duration, Wave::Sine);
            ctx.visual(&array, &[i]);
            ctx.delay(audio_delay);
        }

        for col in 0..max {
            if ctx.stopped() {
                return;
            }
            let count = abacus.iter().filter(|row| row[col] == 1).count();
            let split = array.len() - count;
            for (idx, row) in abacus.iter_mut().enumerate() {
                row[col] = if idx >= split { 1 } else { 0 };
            }
            ctx.play(ctx.freq(count as f64, size as f64), note_duration, Wave::Sine);
            ctx.delay(audio_delay);
        }

        for i in 0..array.len() {
            if ctx.stopped() {
                return;
            }
            array[i] = abacus[i].iter().sum();
            ctx.play(ctx.freq(array[i] as f64, size as f64), note_duration, Wave::Sine);
            ctx.visual(&array, &[i]);
            ctx.delay(audio_delay);
        }

        ctx.play_sorted(&array);
        if !loop_ || ctx.stopped() {
            return;
        }
        ctx.delay(ctx.adaptive_delay(200.0, size));
    }
}
