use crate::audio::Wave;
use crate::engine::SortCtx;

fn wiki_sort_helper(ctx: &mut SortCtx, arr: &mut [i64], start: usize, end: usize, size: usize) {
    if end <= start + 1 {
        return;
    }
    let mid = start + (end - start) / 2;
    wiki_sort_helper(ctx, arr, start, mid, size);
    if ctx.stopped() {
        return;
    }
    wiki_sort_helper(ctx, arr, mid, end, size);
    if ctx.stopped() {
        return;
    }

    let mut temp: Vec<i64> = Vec::with_capacity(end - start);
    let (mut i, mut j) = (start, mid);
    while i < mid && j < end {
        if ctx.stopped() {
            return;
        }
        if arr[i] <= arr[j] {
            temp.push(arr[i]);
            i += 1;
        } else {
            temp.push(arr[j]);
            j += 1;
        }
    }
    while i < mid {
        temp.push(arr[i]);
        i += 1;
    }
    while j < end {
        temp.push(arr[j]);
        j += 1;
    }

    for (k, &value) in temp.iter().enumerate() {
        if ctx.stopped() {
            return;
        }
        let idx = start + k;
        arr[idx] = value;
        ctx.play(ctx.freq(value as f64, 100.0), 0.02, Wave::Sine);
        ctx.visual(arr, &[idx]);
        ctx.delay(ctx.adaptive_delay(40.0, size));
    }
}

// Ported from TypeScript: src/utils/audio/algorithms/wiki.ts
#[allow(non_snake_case)]
pub fn generateWikiSort(ctx: &mut SortCtx, size: usize, loop_: bool) {
    while !ctx.stopped() {
        let mut array = ctx.random_array(size);
        let n = array.len();
        wiki_sort_helper(ctx, &mut array, 0, n, size);

        ctx.play_sorted(&array);
        if !loop_ || ctx.stopped() {
            return;
        }
        ctx.delay(ctx.adaptive_delay(200.0, size));
    }
}
