use crate::audio::Wave;
use crate::engine::SortCtx;

// Ported from TypeScript: src/utils/audio/algorithms/double-selection.ts
#[allow(non_snake_case)]
pub fn generateDoubleSelectionSort(ctx: &mut SortCtx, size: usize, loop_: bool) {
    while !ctx.stopped() {
        let mut array = ctx.random_array(size);
        let note_duration = ctx.adaptive_duration(0.008, size);
        let scan_delay = ctx.adaptive_delay(45.0, size);
        let swap_delay = ctx.adaptive_delay(55.0, size);
        let n = array.len();

        for i in 0..n.div_ceil(2) {
            if ctx.stopped() {
                return;
            }
            let mut min_idx = i;
            let mut max_idx = i;

            for j in i..(n - i) {
                if ctx.stopped() {
                    return;
                }
                if array[j] < array[min_idx] {
                    min_idx = j;
                }
                if array[j] > array[max_idx] {
                    max_idx = j;
                }
                ctx.play(ctx.freq(array[j] as f64, size as f64), note_duration / 3.0, Wave::Sine);
                ctx.visual(&array, &[j, min_idx, max_idx]);
                ctx.delay(scan_delay);
            }

            if min_idx != i {
                array.swap(i, min_idx);
                if max_idx == i {
                    max_idx = min_idx;
                }
            }
            let max_pos = n - 1 - i;
            if max_idx != max_pos {
                array.swap(max_pos, max_idx);
            }

            ctx.play(ctx.freq(array[i] as f64, size as f64), note_duration, Wave::Sine);
            ctx.play_after(
                note_duration / 2.0,
                ctx.freq(array[max_pos] as f64, size as f64),
                note_duration,
                Wave::Sine,
            );
            ctx.visual(&array, &[i, max_pos]);
            ctx.delay(swap_delay);
        }

        ctx.play_sorted(&array);
        if !loop_ || ctx.stopped() {
            return;
        }
        ctx.delay(ctx.adaptive_delay(200.0, size));
    }
}
