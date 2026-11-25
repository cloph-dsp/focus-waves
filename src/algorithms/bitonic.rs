use crate::audio::Wave;
use crate::engine::SortCtx;

// Explicit sonification/timing knobs; a struct would add noise at every call site.
#[allow(clippy::too_many_arguments)]
fn comp_and_swap(
    ctx: &mut SortCtx,
    arr: &mut [i64],
    i: usize,
    j: usize,
    dir: bool,
    size: usize,
    note_duration: f32,
    audio_delay: u64,
) {
    if (arr[i] > arr[j] && dir) || (arr[i] < arr[j] && !dir) {
        arr.swap(i, j);
        ctx.play(ctx.freq(arr[i] as f64, size as f64), note_duration, Wave::Sine);
        ctx.visual(&arr[..size.min(arr.len())], &[i, j]);
        ctx.delay(audio_delay);
    }
}

// Explicit sonification/timing knobs; a struct would add noise at every call site.
#[allow(clippy::too_many_arguments)]
fn bitonic_merge(
    ctx: &mut SortCtx,
    arr: &mut [i64],
    low: usize,
    cnt: usize,
    dir: bool,
    size: usize,
    note_duration: f32,
    audio_delay: u64,
) {
    if ctx.stopped() || cnt <= 1 {
        return;
    }
    let k = cnt / 2;
    for i in low..low + k {
        if ctx.stopped() {
            return;
        }
        comp_and_swap(ctx, arr, i, i + k, dir, size, note_duration, audio_delay);
    }
    bitonic_merge(ctx, arr, low, k, dir, size, note_duration, audio_delay);
    bitonic_merge(ctx, arr, low + k, k, dir, size, note_duration, audio_delay);
}

// Explicit sonification/timing knobs; a struct would add noise at every call site.
#[allow(clippy::too_many_arguments)]
fn bitonic_sort(
    ctx: &mut SortCtx,
    arr: &mut [i64],
    low: usize,
    cnt: usize,
    dir: bool,
    size: usize,
    note_duration: f32,
    audio_delay: u64,
) {
    if ctx.stopped() || cnt <= 1 {
        return;
    }
    let k = cnt / 2;
    bitonic_sort(ctx, arr, low, k, true, size, note_duration, audio_delay);
    bitonic_sort(ctx, arr, low + k, k, false, size, note_duration, audio_delay);
    bitonic_merge(ctx, arr, low, cnt, dir, size, note_duration, audio_delay);
}

// Ported from TypeScript: src/utils/audio/algorithms/bitonic.ts
#[allow(non_snake_case)]
pub fn generateBitonicSort(ctx: &mut SortCtx, size: usize, loop_: bool) {
    while !ctx.stopped() {
        let mut padded_size = 1usize;
        while padded_size < size {
            padded_size *= 2;
        }

        let unique = ctx.random_array(size);
        let mut array: Vec<i64> = (0..padded_size)
            .map(|i| if i < unique.len() { unique[i] } else { 0 })
            .collect();
        let note_duration = ctx.adaptive_duration(0.0085, size);
        let audio_delay = ctx.adaptive_delay(40.0, size);

        bitonic_sort(
            ctx,
            &mut array,
            0,
            padded_size,
            true,
            size,
            note_duration,
            audio_delay,
        );

        ctx.play_sorted(&array[..size.min(array.len())]);

        if !loop_ || ctx.stopped() {
            return;
        }
        ctx.delay(ctx.adaptive_delay(200.0, size));
    }
}
