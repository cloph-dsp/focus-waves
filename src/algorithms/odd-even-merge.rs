use crate::audio::Wave;
use crate::engine::SortCtx;

// Ported from TypeScript: src/utils/audio/algorithms/odd-even-merge.ts
// The TS variant delegates to generateSimpleSort with timingMultiplier 0.75,
// i.e. createSimpleSortGenerator's insertion-sort body (inlined here).
#[allow(non_snake_case)]
pub fn generateOddEvenMergeSort(ctx: &mut SortCtx, size: usize, loop_: bool) {
    while !ctx.stopped() {
        let mut array = ctx.random_array(size);
        let note_duration = ctx.adaptive_duration(0.04 * 0.75, size);
        let audio_delay = ctx.adaptive_delay(20.0 * 0.75, size);

        for i in 1..array.len() {
            if ctx.stopped() {
                return;
            }
            let key = array[i];
            let mut j = i;
            while j > 0 && array[j - 1] > key && !ctx.stopped() {
                array[j] = array[j - 1];
                ctx.play(
                    ctx.freq(array[j] as f64, size as f64),
                    note_duration,
                    Wave::Sine,
                );
                ctx.visual(&array, &[j - 1, j]);
                ctx.delay(audio_delay);
                j -= 1;
            }
            array[j] = key;
        }

        ctx.play_sorted(&array);
        if !loop_ || ctx.stopped() {
            return;
        }
        ctx.delay(ctx.adaptive_delay(200.0, size));
    }
}
