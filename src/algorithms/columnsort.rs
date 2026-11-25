use crate::audio::Wave;
use crate::engine::SortCtx;

// Ported from TypeScript: src/utils/audio/algorithms/columnsort.ts
#[allow(non_snake_case)]
pub fn generateColumnsort(ctx: &mut SortCtx, size: usize, loop_: bool) {
    while !ctx.stopped() {
        let mut array = ctx.random_array(size);
        let note_duration = 0.02f32;
        let n = array.len();
        let r = (n as f64).sqrt().ceil() as usize;
        let s = if r == 0 { 0 } else { n.div_ceil(r) };

        // Three column-sort passes (columnsort's standard r/s layout).
        for _ in 0..3 {
            if ctx.stopped() {
                return;
            }
            for col in 0..s {
                if ctx.stopped() {
                    return;
                }
                let mut indices = Vec::new();
                for row in 0..r {
                    let idx = row * s + col;
                    if idx >= n {
                        break;
                    }
                    indices.push(idx);
                }

                for i in 0..indices.len() {
                    if ctx.stopped() {
                        return;
                    }
                    for j in (i + 1)..indices.len() {
                        if ctx.stopped() {
                            return;
                        }
                        if array[indices[i]] > array[indices[j]] {
                            array.swap(indices[i], indices[j]);
                            ctx.play(
                                ctx.freq(array[indices[i]] as f64, 100.0),
                                note_duration,
                                Wave::Sine,
                            );
                            ctx.visual(&array, &indices);
                            ctx.delay(ctx.adaptive_delay(45.0, size));
                        }
                    }
                }
            }
        }

        // Columnsort needs specific r/s padding and a shuffle/compare cycle to
        // sort globally; for these small sizes a sonified insertion pass is the
        // correct fallback after the column-compare tones above.
        for i in 1..n {
            if ctx.stopped() {
                return;
            }
            let mut j = i;
            while j > 0 && array[j] < array[j - 1] {
                if ctx.stopped() {
                    return;
                }
                array.swap(j, j - 1);
                ctx.play(
                    ctx.freq(array[j] as f64, 100.0),
                    note_duration,
                    Wave::Sine,
                );
                ctx.visual(&array, &[j, j - 1]);
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
