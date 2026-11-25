use crate::audio::Wave;
use crate::engine::SortCtx;

// Ported from TypeScript: src/utils/audio/algorithms/hoare-partition.ts
// The source delegates to generateQuickSort, so the quick sort behavior is inlined here.
fn partition(
    ctx: &mut SortCtx,
    arr: &mut [i64],
    low: usize,
    high: usize,
    note_duration: f32,
    audio_delay: u64,
    size: usize,
) -> usize {
    let pivot = arr[high];
    // TS starts at low - 1 and pre-increments; starting at low is equivalent.
    let mut i = low;

    for j in low..high {
        if ctx.stopped() {
            break;
        }
        if arr[j] < pivot {
            arr.swap(i, j);
            ctx.play(ctx.freq(arr[i] as f64, size as f64), note_duration, Wave::Saw);
            ctx.visual(arr, &[i, j]);
            ctx.delay(audio_delay);
            i += 1;
        }
    }

    arr.swap(i, high);
    ctx.play(ctx.freq(arr[i] as f64, size as f64), note_duration * 1.5, Wave::Saw);
    ctx.visual(arr, &[i, high]);
    ctx.delay(audio_delay);

    i
}

fn quick_sort(
    ctx: &mut SortCtx,
    arr: &mut [i64],
    low: usize,
    high: usize,
    note_duration: f32,
    audio_delay: u64,
    size: usize,
) {
    if ctx.stopped() {
        return;
    }
    if low < high {
        let pi = partition(ctx, arr, low, high, note_duration, audio_delay, size);
        if pi > low {
            quick_sort(ctx, arr, low, pi - 1, note_duration, audio_delay, size);
        }
        quick_sort(ctx, arr, pi + 1, high, note_duration, audio_delay, size);
    }
}

#[allow(non_snake_case)]
pub fn generateHoarePartitionSort(ctx: &mut SortCtx, size: usize, loop_: bool) {
    while !ctx.stopped() {
        let mut array = ctx.random_array(size);
        let note_duration = ctx.adaptive_duration(0.003, size);
        let audio_delay = ctx.adaptive_delay(25.0, size);
        if size > 0 {
            quick_sort(ctx, &mut array, 0, size - 1, note_duration, audio_delay, size);
        }
        if ctx.stopped() {
            return;
        }
        ctx.play_sorted(&array);
        if !loop_ || ctx.stopped() {
            return;
        }
        ctx.delay(ctx.adaptive_delay(200.0, size));
    }
}
