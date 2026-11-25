use crate::audio::Wave;
use crate::engine::SortCtx;

// Ported from TypeScript: src/utils/audio/algorithms/natural-merge.ts
// The TS variant delegates to generateMergeSort; the merge-sort body is inlined here
// so this file does not depend on another porting lane.
#[allow(non_snake_case)]
pub fn generateNaturalMergeSort(ctx: &mut SortCtx, size: usize, loop_: bool) {
    fn merge(
        ctx: &mut SortCtx,
        arr: &mut [i64],
        left: usize,
        mid: usize,
        right: usize,
        size: usize,
        note_duration: f32,
        audio_delay: u64,
    ) {
        let left_arr = arr[left..=mid].to_vec();
        let right_arr = arr[mid + 1..=right].to_vec();
        let (mut i, mut j, mut k) = (0usize, 0usize, left);

        while i < left_arr.len() && j < right_arr.len() && !ctx.stopped() {
            if left_arr[i] <= right_arr[j] {
                arr[k] = left_arr[i];
                i += 1;
            } else {
                arr[k] = right_arr[j];
                j += 1;
            }
            ctx.play(
                ctx.freq(arr[k] as f64, size as f64),
                note_duration,
                Wave::Sine,
            );
            ctx.visual(arr, &[k]);
            ctx.delay(audio_delay);
            k += 1;
        }

        while i < left_arr.len() && !ctx.stopped() {
            arr[k] = left_arr[i];
            i += 1;
            k += 1;
            ctx.play(
                ctx.freq(arr[k - 1] as f64, size as f64),
                note_duration,
                Wave::Sine,
            );
            ctx.visual(arr, &[k - 1]);
            ctx.delay(audio_delay);
        }

        while j < right_arr.len() && !ctx.stopped() {
            arr[k] = right_arr[j];
            j += 1;
            k += 1;
            ctx.play(
                ctx.freq(arr[k - 1] as f64, size as f64),
                note_duration,
                Wave::Sine,
            );
            ctx.visual(arr, &[k - 1]);
            ctx.delay(audio_delay);
        }
    }

    fn merge_sort(
        ctx: &mut SortCtx,
        arr: &mut [i64],
        left: usize,
        right: usize,
        size: usize,
        note_duration: f32,
        audio_delay: u64,
    ) {
        if left < right && !ctx.stopped() {
            let mid = (left + right) / 2;
            merge_sort(ctx, arr, left, mid, size, note_duration, audio_delay);
            merge_sort(ctx, arr, mid + 1, right, size, note_duration, audio_delay);
            merge(ctx, arr, left, mid, right, size, note_duration, audio_delay);
        }
    }

    while !ctx.stopped() {
        let mut array = ctx.random_array(size);
        let note_duration = ctx.adaptive_duration(0.007, size);
        let audio_delay = ctx.adaptive_delay(200.0, size);

        let n = array.len();
        if n > 0 {
            merge_sort(ctx, &mut array, 0, n - 1, size, note_duration, audio_delay);
        }

        ctx.play_sorted(&array);
        if !loop_ || ctx.stopped() {
            return;
        }
        ctx.delay(ctx.adaptive_delay(200.0, size));
    }
}
