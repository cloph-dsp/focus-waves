use crate::audio::Wave;
use crate::engine::SortCtx;

// Ported from TypeScript: src/utils/audio/algorithms/pancake.ts
#[allow(non_snake_case)]
pub fn generatePancakeSort(ctx: &mut SortCtx, size: usize, loop_: bool) {
    fn flip(ctx: &mut SortCtx, arr: &mut [i64], k: usize, size: usize, note_duration: f32) {
        let mut left = 0usize;
        let mut k = k;
        while left < k && !ctx.stopped() {
            arr.swap(left, k);
            ctx.play(
                ctx.freq(arr[left] as f64, size as f64),
                note_duration,
                Wave::Sine,
            );
            ctx.play_after(
                note_duration / 2.0,
                ctx.freq(arr[k] as f64, size as f64),
                note_duration,
                Wave::Sine,
            );
            ctx.visual(arr, &[left, k]);
            ctx.delay(ctx.adaptive_delay(40.0, size));
            left += 1;
            k -= 1;
        }
    }

    while !ctx.stopped() {
        let mut array = ctx.random_array(size);
        let note_duration = ctx.adaptive_duration(0.0085, size);

        let mut curr_size = array.len();
        while curr_size > 1 && !ctx.stopped() {
            let mut max_idx = 0usize;
            for i in 1..curr_size {
                if array[i] > array[max_idx] {
                    max_idx = i;
                }
            }

            if max_idx != curr_size - 1 {
                if max_idx != 0 {
                    flip(ctx, &mut array, max_idx, size, note_duration);
                }
                flip(ctx, &mut array, curr_size - 1, size, note_duration);
            }
            curr_size -= 1;
        }

        ctx.play_sorted(&array);
        if !loop_ || ctx.stopped() {
            return;
        }
        ctx.delay(ctx.adaptive_delay(200.0, size));
    }
}
