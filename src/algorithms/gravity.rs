use crate::audio::Wave;
use crate::engine::SortCtx;

// Ported from TypeScript: src/utils/audio/algorithms/gravity.ts
#[allow(non_snake_case)]
pub fn generateGravitySort(ctx: &mut SortCtx, size: usize, loop_: bool) {
    while !ctx.stopped() {
        let mut array = ctx.random_array(size);
        let note_duration = ctx.adaptive_duration(0.0085, size);
        let audio_delay = ctx.adaptive_delay(40.0, size);
        let max = array.iter().copied().max().unwrap_or(0);
        let mut abacus: Vec<Vec<i64>> = Vec::with_capacity(array.len());

        for i in 0..array.len() {
            if ctx.stopped() {
                return;
            }
            abacus.push(vec![1; array[i] as usize]);
            ctx.play(ctx.freq(array[i] as f64, size as f64), note_duration, Wave::Sine);
            ctx.visual(&array, &[i]);
            ctx.delay(audio_delay);
        }

        for col in 0..(max as usize) {
            if ctx.stopped() {
                return;
            }
            let mut sum = 0usize;
            for row in &abacus {
                if col < row.len() {
                    sum += 1;
                }
            }
            let mut count = sum;
            let mut row = array.len();
            while count > 0 && !ctx.stopped() {
                row -= 1;
                while abacus[row].len() <= col {
                    abacus[row].push(0);
                }
                abacus[row][col] = 1;
                count -= 1;
            }
        }

        for i in 0..array.len() {
            if ctx.stopped() {
                return;
            }
            array[i] = abacus[i].iter().filter(|&&x| x == 1).count() as i64;
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
