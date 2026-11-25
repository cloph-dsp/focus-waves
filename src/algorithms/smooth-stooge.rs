use crate::audio::Wave;
use crate::engine::SortCtx;

fn stooge_sort(
    ctx: &mut SortCtx,
    arr: &mut [i64],
    l: usize,
    h: usize,
    size: usize,
    note_duration: f32,
) {
    if l >= h || ctx.stopped() {
        return;
    }
    if arr[l] > arr[h] {
        arr.swap(l, h);
        ctx.play(ctx.freq(arr[l] as f64, size as f64), note_duration, Wave::Sine);
        ctx.visual(arr, &[l, h]);
        ctx.delay(ctx.adaptive_delay(200.0, size));
    }
    if h - l + 1 > 2 {
        let t = (h - l + 1) / 3;
        stooge_sort(ctx, arr, l, h - t, size, note_duration);
        stooge_sort(ctx, arr, l + t, h, size, note_duration);
        stooge_sort(ctx, arr, l, h - t, size, note_duration);
    }
}

// Ported from TypeScript: src/utils/audio/algorithms/smooth-stooge.ts (delegates to stooge.ts)
#[allow(non_snake_case)]
pub fn generateSmoothStoogeSort(ctx: &mut SortCtx, size: usize, loop_: bool) {
    while !ctx.stopped() {
        let mut array = ctx.random_array(size);
        let note_duration = ctx.adaptive_duration(0.0075, size);

        let end = array.len().saturating_sub(1);
        stooge_sort(ctx, &mut array, 0, end, size, note_duration);

        ctx.play_sorted(&array);
        if !loop_ || ctx.stopped() {
            return;
        }
        ctx.delay(ctx.adaptive_delay(200.0, size));
    }
}
