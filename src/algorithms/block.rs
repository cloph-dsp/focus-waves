use crate::audio::Wave;
use crate::engine::SortCtx;

// Ported from TypeScript: src/utils/audio/algorithms/block.ts
#[allow(non_snake_case)]
pub fn generateBlockSort(ctx: &mut SortCtx, size: usize, loop_: bool) {
    while !ctx.stopped() {
        let mut array = ctx.random_array(size);
        let note_duration = ctx.adaptive_duration(0.0075, size);
        let audio_delay = ctx.adaptive_delay(45.0, size);

        let len = array.len();
        let block_size = ((len as f64).sqrt() as usize).max(1);
        let mut i = 0;
        while i < len && !ctx.stopped() {
            let end = (i + block_size).min(len);
            for j in i + 1..end {
                if ctx.stopped() {
                    return;
                }
                let key = array[j];
                let mut k = j as isize - 1;
                while k >= i as isize && array[k as usize] > key && !ctx.stopped() {
                    array[(k + 1) as usize] = array[k as usize];
                    ctx.play(
                        ctx.freq(array[(k + 1) as usize] as f64, size as f64),
                        note_duration,
                        Wave::Sine,
                    );
                    ctx.visual(&array, &[k as usize, (k + 1) as usize]);
                    ctx.delay(audio_delay);
                    k -= 1;
                }
                array[(k + 1) as usize] = key;
            }
            i += block_size;
        }

        ctx.play_sorted(&array);

        if !loop_ || ctx.stopped() {
            return;
        }
        ctx.delay(ctx.adaptive_delay(200.0, size));
    }
}
