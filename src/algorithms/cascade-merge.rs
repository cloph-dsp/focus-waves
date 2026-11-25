use crate::audio::Wave;
use crate::engine::SortCtx;

fn merge(
    ctx: &SortCtx,
    arr: &mut [i64],
    left: usize,
    mid: usize,
    right: usize,
    note_duration: f32,
    size: usize,
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
        ctx.play(ctx.freq(arr[k] as f64, size as f64), note_duration, Wave::Sine);
        ctx.visual(arr, &[k]);
        ctx.delay(audio_delay);
        k += 1;
    }

    while i < left_arr.len() && !ctx.stopped() {
        arr[k] = left_arr[i];
        ctx.play(ctx.freq(arr[k] as f64, size as f64), note_duration, Wave::Sine);
        i += 1;
        k += 1;
        ctx.visual(arr, &[k - 1]);
        ctx.delay(audio_delay);
    }

    while j < right_arr.len() && !ctx.stopped() {
        arr[k] = right_arr[j];
        ctx.play(ctx.freq(arr[k] as f64, size as f64), note_duration, Wave::Sine);
        j += 1;
        k += 1;
        ctx.visual(arr, &[k - 1]);
        ctx.delay(audio_delay);
    }
}

fn merge_sort(
    ctx: &SortCtx,
    arr: &mut [i64],
    left: usize,
    right: usize,
    note_duration: f32,
    size: usize,
    audio_delay: u64,
) {
    if left < right && !ctx.stopped() {
        let mid = (left + right) / 2;
        merge_sort(ctx, arr, left, mid, note_duration, size, audio_delay);
        merge_sort(ctx, arr, mid + 1, right, note_duration, size, audio_delay);
        merge(ctx, arr, left, mid, right, note_duration, size, audio_delay);
    }
}

// Ported from TypeScript: src/utils/audio/algorithms/cascade-merge.ts
// (cascade-merge.ts delegates to merge.ts.)
#[allow(non_snake_case)]
pub fn generateCascadeMergeSort(ctx: &mut SortCtx, size: usize, loop_: bool) {
    while !ctx.stopped() {
        let mut array = ctx.random_array(size);
        let note_duration = ctx.adaptive_duration(0.007, size);
        let audio_delay = ctx.adaptive_delay(200.0, size);

        if !array.is_empty() {
            let n = array.len();
            merge_sort(ctx, &mut array, 0, n - 1, note_duration, size, audio_delay);
        }

        ctx.play_sorted(&array);
        if !loop_ || ctx.stopped() {
            return;
        }
        ctx.delay(ctx.adaptive_delay(200.0, size));
    }
}
