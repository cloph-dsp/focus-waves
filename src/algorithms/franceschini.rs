use crate::audio::Wave;
use crate::engine::SortCtx;

// Ported from TypeScript: src/utils/audio/algorithms/franceschini.ts
fn merge_in_place(
    ctx: &mut SortCtx,
    array: &mut [i64],
    left: usize,
    mid: usize,
    right: usize,
    note_duration: f32,
    size: usize,
) {
    let mut mid = mid;
    let mut start = left;
    let mut start2 = mid + 1;

    while start <= mid && start2 <= right && !ctx.stopped() {
        if array[start] <= array[start2] {
            start += 1;
        } else {
            let value = array[start2];
            let mut index = start2;
            while index != start && !ctx.stopped() {
                array[index] = array[index - 1];
                ctx.play(ctx.freq(array[index] as f64, size as f64), note_duration, Wave::Sine);
                ctx.visual(array, &[index, index - 1]);
                ctx.delay(ctx.adaptive_delay(45.0, size));
                index -= 1;
            }
            array[start] = value;
            start += 1;
            mid += 1;
            start2 += 1;
        }
    }
}

fn merge_sort(
    ctx: &mut SortCtx,
    array: &mut [i64],
    left: usize,
    right: usize,
    note_duration: f32,
    size: usize,
) {
    if ctx.stopped() {
        return;
    }
    if left < right {
        let mid = left + (right - left) / 2;
        merge_sort(ctx, array, left, mid, note_duration, size);
        merge_sort(ctx, array, mid + 1, right, note_duration, size);
        merge_in_place(ctx, array, left, mid, right, note_duration, size);
    }
}

#[allow(non_snake_case)]
pub fn generateFranceschiniSort(ctx: &mut SortCtx, size: usize, loop_: bool) {
    while !ctx.stopped() {
        let mut array = ctx.random_array(size);
        let note_duration = ctx.adaptive_duration(0.0075, size);
        if size > 0 {
            merge_sort(ctx, &mut array, 0, size - 1, note_duration, size);
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
