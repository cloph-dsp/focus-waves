use crate::audio::Wave;
use crate::engine::SortCtx;

// Ported from TypeScript: src/utils/audio/algorithms/iterative-merge.ts
#[allow(non_snake_case)]
pub fn generateIterativeMergeSort(ctx: &mut SortCtx, size: usize, loop_: bool) {
    while !ctx.stopped() {
        let mut array = ctx.random_array(size);
        let note_duration = ctx.adaptive_duration(0.0085, size);
        let audio_delay = ctx.adaptive_delay(40.0, size);

        let mut width = 1usize;
        while width < array.len() && !ctx.stopped() {
            let mut i = 0usize;
            while i < array.len() && !ctx.stopped() {
                let left = i;
                let mid = (i + width).min(array.len());
                let right = (i + width * 2).min(array.len());
                let left_arr = array[left..mid].to_vec();
                let right_arr = array[mid..right].to_vec();
                let (mut l, mut r, mut k) = (0usize, 0usize, left);

                while l < left_arr.len() && r < right_arr.len() && !ctx.stopped() {
                    if left_arr[l] <= right_arr[r] {
                        array[k] = left_arr[l];
                        l += 1;
                    } else {
                        array[k] = right_arr[r];
                        r += 1;
                    }
                    ctx.play(
                        ctx.freq(array[k] as f64, size as f64),
                        note_duration,
                        Wave::Sine,
                    );
                    ctx.visual(&array, &[k]);
                    ctx.delay(audio_delay);
                    k += 1;
                }
                while l < left_arr.len() && !ctx.stopped() {
                    array[k] = left_arr[l];
                    l += 1;
                    k += 1;
                }
                while r < right_arr.len() && !ctx.stopped() {
                    array[k] = right_arr[r];
                    r += 1;
                    k += 1;
                }
                i += width * 2;
            }
            width *= 2;
        }

        ctx.play_sorted(&array);
        if !loop_ || ctx.stopped() {
            return;
        }
        ctx.delay(ctx.adaptive_delay(200.0, size));
    }
}
