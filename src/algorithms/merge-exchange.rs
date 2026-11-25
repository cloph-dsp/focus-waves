use crate::audio::Wave;
use crate::engine::SortCtx;

// Ported from TypeScript: src/utils/audio/algorithms/merge-exchange.ts
// The TS generator delegates to createSimpleSortGenerator({ timingMultiplier: 0.8 }).
#[allow(non_snake_case)]
pub fn generateMergeExchangeSort(ctx: &mut SortCtx, size: usize, loop_: bool) {
    while !ctx.stopped() {
        let mut array = ctx.random_array(size);
        let note_duration = ctx.adaptive_duration(0.04 * 0.8, size);
        let audio_delay = ctx.adaptive_delay(20.0 * 0.8, size);

        for i in 1..array.len() {
            if ctx.stopped() {
                return;
            }
            let key = array[i];
            let mut j = i as isize - 1;
            while j >= 0 && array[j as usize] > key && !ctx.stopped() {
                array[(j + 1) as usize] = array[j as usize];
                ctx.play(
                    ctx.freq(array[(j + 1) as usize] as f64, size as f64),
                    note_duration,
                    Wave::Sine,
                );
                ctx.visual(&array, &[j as usize, (j + 1) as usize]);
                ctx.delay(audio_delay);
                j -= 1;
            }
            array[(j + 1) as usize] = key;
        }

        ctx.play_sorted(&array);
        if !loop_ || ctx.stopped() {
            return;
        }
        ctx.delay(ctx.adaptive_delay(200.0, size));
    }
}
