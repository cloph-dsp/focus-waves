use crate::audio::Wave;
use crate::engine::SortCtx;

// Ported from TypeScript: src/utils/audio/algorithms/insertion.ts
#[allow(non_snake_case)]
pub fn generateInsertionSort(ctx: &mut SortCtx, size: usize, loop_: bool) {
    while !ctx.stopped() {
        let mut array = ctx.random_array(size);
        let note_duration = ctx.adaptive_duration(0.008, size);
        let audio_delay = ctx.adaptive_delay(55.0, size);
        let n = array.len();

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
