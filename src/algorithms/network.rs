use crate::audio::Wave;
use crate::engine::SortCtx;

// Ported from TypeScript: src/utils/audio/algorithms/network.ts
#[allow(non_snake_case)]
pub fn generateNetworkSort(ctx: &mut SortCtx, size: usize, loop_: bool) {
    fn compare(
        ctx: &mut SortCtx,
        array: &mut [i64],
        i: usize,
        j: usize,
        size: usize,
        note_duration: f32,
    ) {
        if i < array.len() && j < array.len() && array[i] > array[j] {
            array.swap(i, j);
            ctx.play(
                ctx.freq(array[i] as f64, size as f64),
                note_duration,
                Wave::Sine,
            );
            ctx.play_after(
                note_duration / 2.0,
                ctx.freq(array[j] as f64, size as f64),
                note_duration,
                Wave::Sine,
            );
            ctx.visual(array, &[i, j]);
            ctx.delay(ctx.adaptive_delay(200.0, size));
        }
    }

    while !ctx.stopped() {
        let mut array = ctx.random_array(size);
        let note_duration = ctx.adaptive_duration(0.0075, size);

        let n = array.len();
        let mut k = 2usize;
        while k <= n && !ctx.stopped() {
            let mut j = k / 2;
            while j > 0 && !ctx.stopped() {
                for i in 0..n {
                    if ctx.stopped() {
                        return;
                    }
                    let l = i ^ j;
                    if l > i {
                        if (i & k) == 0 {
                            compare(ctx, &mut array, i, l, size, note_duration);
                        } else {
                            compare(ctx, &mut array, l, i, size, note_duration);
                        }
                    }
                }
                j /= 2;
            }
            k *= 2;
        }

        ctx.play_sorted(&array);
        if !loop_ || ctx.stopped() {
            return;
        }
        ctx.delay(ctx.adaptive_delay(200.0, size));
    }
}
