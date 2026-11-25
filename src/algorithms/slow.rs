use crate::audio::Wave;
use crate::engine::SortCtx;

fn slow_sort(
    ctx: &mut SortCtx,
    arr: &mut [i64],
    i: usize,
    j: usize,
    size: usize,
    note_duration: f32,
) {
    if i >= j || ctx.stopped() {
        return;
    }
    let m = (i + j) / 2;
    slow_sort(ctx, arr, i, m, size, note_duration);
    slow_sort(ctx, arr, m + 1, j, size, note_duration);

    if arr[m] > arr[j] {
        arr.swap(m, j);
        ctx.play(ctx.freq(arr[j] as f64, size as f64), note_duration, Wave::Sine);
        ctx.visual(arr, &[m, j]);
        ctx.delay(ctx.adaptive_delay(55.0, size));
    }

    slow_sort(ctx, arr, i, j - 1, size, note_duration);
}

// Ported from TypeScript: src/utils/audio/algorithms/slow.ts
#[allow(non_snake_case)]
pub fn generateSlowSort(ctx: &mut SortCtx, size: usize, loop_: bool) {
    while !ctx.stopped() {
        let mut array = ctx.random_array(size);
        let note_duration = ctx.adaptive_duration(0.008, size);

        let end = array.len().saturating_sub(1);
        slow_sort(ctx, &mut array, 0, end, size, note_duration);

        ctx.play_sorted(&array);
        if !loop_ || ctx.stopped() {
            return;
        }
        ctx.delay(ctx.adaptive_delay(200.0, size));
    }
}
