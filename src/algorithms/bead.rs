use crate::audio::Wave;
use crate::engine::SortCtx;

// Ported from TypeScript: src/utils/audio/algorithms/bead.ts
#[allow(non_snake_case)]
pub fn generateBeadSort(ctx: &mut SortCtx, size: usize, loop_: bool) {
    while !ctx.stopped() {
        let mut array = ctx.random_array(size);
        let note_duration = ctx.adaptive_duration(0.008, size);
        let audio_delay = ctx.adaptive_delay(40.0, size);

        let max = (*array.iter().max().unwrap_or(&0)) as usize;
        let mut beads: Vec<Vec<bool>> = vec![vec![false; max]; array.len()];

        for i in 0..array.len() {
            for j in 0..(array[i] as usize).min(max) {
                beads[i][j] = true;
            }
        }

        for j in 0..max {
            if ctx.stopped() {
                return;
            }
            let mut sum = 0usize;
            for row in beads.iter_mut() {
                if j < row.len() && row[j] {
                    sum += 1;
                }
                if j < row.len() {
                    row[j] = false;
                }
            }

            let start = array.len().saturating_sub(sum);
            for i in start..array.len() {
                if ctx.stopped() {
                    return;
                }
                beads[i][j] = true;
                let current_value = beads[i].iter().filter(|&&bead| bead).count() as i64;
                array[i] = current_value;
                ctx.play(
                    ctx.freq((current_value.max(1)) as f64, size as f64),
                    note_duration,
                    Wave::Sine,
                );
                ctx.visual(&array, &[i]);
                ctx.delay(audio_delay);
            }
        }

        ctx.play_sorted(&array);

        if !loop_ || ctx.stopped() {
            return;
        }
        ctx.delay(ctx.adaptive_delay(200.0, size));
    }
}
