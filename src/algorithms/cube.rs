use crate::audio::Wave;
use crate::engine::SortCtx;

// Ported from TypeScript: src/utils/audio/algorithms/cube.ts
#[allow(non_snake_case)]
pub fn generateCubeSort(ctx: &mut SortCtx, size: usize, loop_: bool) {
    while !ctx.stopped() {
        let mut array = ctx.random_array(size);
        let cube_root = (size as f64).cbrt().ceil() as usize;

        for _phase in 0..3 {
            for block in 0..cube_root {
                let block_start = block * cube_root;
                let block_end = ((block + 1) * cube_root).min(size);
                for i in block_start..block_end {
                    for j in (i + 1)..block_end {
                        if ctx.stopped() {
                            return;
                        }
                        if array[i] > array[j] {
                            array.swap(i, j);
                            ctx.play(ctx.freq(array[i] as f64, size as f64), 0.02, Wave::Sine);
                            ctx.visual(&array, &[i, j]);
                            ctx.delay(ctx.adaptive_delay(45.0, size));
                        }
                    }
                }
            }
        }

        // Block-local order alone is not global order; finish with a full pass.
        for i in 1..array.len() {
            let mut j = i;
            while j > 0 && array[j - 1] > array[j] {
                if ctx.stopped() {
                    return;
                }
                array.swap(j - 1, j);
                ctx.play(ctx.freq(array[j - 1] as f64, size as f64), 0.02, Wave::Sine);
                ctx.visual(&array, &[j - 1, j]);
                ctx.delay(ctx.adaptive_delay(45.0, size));
                j -= 1;
            }
        }

        ctx.play_sorted(&array);
        if !loop_ || ctx.stopped() {
            return;
        }
        ctx.delay(ctx.adaptive_delay(200.0, size));
    }
}
