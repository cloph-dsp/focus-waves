use crate::audio::Wave;
use crate::engine::SortCtx;

// Ported from TypeScript: src/utils/audio/algorithms/bingo.ts
#[allow(non_snake_case)]
pub fn generateBingoSort(ctx: &mut SortCtx, size: usize, loop_: bool) {
    while !ctx.stopped() {
        let mut array = ctx.random_array(size);
        let note_duration = ctx.adaptive_duration(0.004, size);
        let scan_delay = ctx.adaptive_delay(24.0, size);
        let settle_delay = ctx.adaptive_delay(40.0, size);

        let mut end = array.len() as isize - 1;
        while end > 0 && !ctx.stopped() {
            let mut max_value = array[0];

            for i in 1..=end {
                if ctx.stopped() {
                    return;
                }
                let idx = i as usize;
                if array[idx] > max_value {
                    max_value = array[idx];
                }
                ctx.play(
                    ctx.freq(array[idx] as f64, size as f64),
                    note_duration / 2.0,
                    Wave::Saw,
                );
                ctx.visual(&array, &[idx]);
                ctx.delay(scan_delay);
            }

            let mut idx = end;
            while idx >= 0 && !ctx.stopped() {
                if array[idx as usize] == max_value {
                    array.swap(idx as usize, end as usize);
                    ctx.play_after(
                        note_duration,
                        ctx.freq(array[end as usize] as f64, size as f64),
                        note_duration,
                        Wave::Square,
                    );
                    ctx.visual(&array, &[idx as usize, end as usize]);
                    ctx.delay(settle_delay);
                    end -= 1;

                    if idx > end {
                        idx = end;
                        continue;
                    }
                }
                idx -= 1;
            }
        }

        ctx.play_sorted(&array);

        if !loop_ || ctx.stopped() {
            return;
        }
        ctx.delay(ctx.adaptive_delay(200.0, size));
    }
}
