use crate::audio::Wave;
use crate::engine::SortCtx;

// Ported from TypeScript: src/utils/audio/algorithms/gnome.ts
#[allow(non_snake_case)]
pub fn generateGnomeSort(ctx: &mut SortCtx, size: usize, loop_: bool) {
    while !ctx.stopped() {
        let mut array = ctx.random_array(size);
        let note_duration = ctx.adaptive_duration(0.008, size);
        let audio_delay = ctx.adaptive_delay(200.0, size);
        let mut i = 0usize;

        while i < array.len() && !ctx.stopped() {
            if i == 0 || array[i] >= array[i - 1] {
                ctx.play(ctx.freq(array[i] as f64, size as f64), note_duration / 2.0, Wave::Sine);
                i += 1;
            } else {
                array.swap(i, i - 1);
                ctx.play(ctx.freq(array[i - 1] as f64, size as f64), note_duration, Wave::Sine);
                ctx.visual(&array, &[i, i - 1]);
                ctx.delay(audio_delay);
                i -= 1;
            }
        }

        ctx.play_sorted(&array);
        if !loop_ || ctx.stopped() {
            return;
        }
        ctx.delay(ctx.adaptive_delay(200.0, size));
    }
}
