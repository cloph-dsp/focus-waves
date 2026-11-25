use crate::audio::Wave;
use crate::engine::SortCtx;

// Ported from TypeScript: src/utils/audio/algorithms/shell-ciura.ts
// The TS stub delegates to generateShellSort (shell.ts); the logic is inlined here.
#[allow(non_snake_case)]
pub fn generateShellCiuraSort(ctx: &mut SortCtx, size: usize, loop_: bool) {
    while !ctx.stopped() {
        let mut array = ctx.random_array(size);
        let note_duration = ctx.adaptive_duration(0.0075, size);
        let audio_delay = ctx.adaptive_delay(200.0, size);

        let mut gap = array.len() / 2;
        while gap > 0 && !ctx.stopped() {
            for i in gap..array.len() {
                if ctx.stopped() {
                    return;
                }
                let temp = array[i];
                let mut j = i;
                while j >= gap && array[j - gap] > temp && !ctx.stopped() {
                    array[j] = array[j - gap];
                    ctx.play(
                        ctx.freq(array[j] as f64, size as f64),
                        note_duration,
                        Wave::Sine,
                    );
                    ctx.visual(&array, &[j, j - gap]);
                    ctx.delay(audio_delay);
                    j -= gap;
                }
                array[j] = temp;
            }
            gap /= 2;
        }

        ctx.play_sorted(&array);
        if !loop_ || ctx.stopped() {
            return;
        }
        ctx.delay(ctx.adaptive_delay(200.0, size));
    }
}
