use crate::audio::Wave;
use crate::engine::SortCtx;

// Ported from TypeScript: src/utils/audio/algorithms/lazy.ts
#[allow(non_snake_case)]
pub fn generateLazySort(ctx: &mut SortCtx, size: usize, loop_: bool) {
    while !ctx.stopped() {
        let mut array = ctx.random_array(size);
        let mut pending: Vec<(usize, usize)> = Vec::new();

        if array.len() >= 2 {
            for i in 0..array.len() - 1 {
                if array[i] > array[i + 1] {
                    pending.push((i, i + 1));
                }
            }
        }

        while !pending.is_empty() {
            if ctx.stopped() {
                return;
            }
            let (i, j) = pending.pop().unwrap();
            if array[i] > array[j] {
                array.swap(i, j);
                ctx.play(ctx.freq(array[i] as f64, size as f64), 0.02, Wave::Sine);
                ctx.visual(&array, &[i, j]);
                ctx.delay(ctx.adaptive_delay(200.0, size));

                if i > 0 && array[i - 1] > array[i] {
                    pending.push((i - 1, i));
                }
                if j + 1 < array.len() && array[j] > array[j + 1] {
                    pending.push((j, j + 1));
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
