use crate::audio::Wave;
use crate::engine::SortCtx;

const MAX_ATTEMPTS: usize = 1000;

fn is_sorted(arr: &[i64], n: usize) -> bool {
    for i in 0..n.saturating_sub(1) {
        if arr[i] > arr[i + 1] {
            return false;
        }
    }
    true
}

fn shuffle(ctx: &SortCtx, arr: &mut [i64], n: usize, note_duration: f32, size: usize) {
    let mut i = n;
    while i > 1 {
        if ctx.stopped() {
            return;
        }
        i -= 1;
        // random_array(i + 1) is a uniform permutation of 1..=i+1; its last value is a uniform j in 0..=i.
        let j = ctx.random_array(i + 1)[i] as usize - 1;
        arr.swap(i, j);
        ctx.play(ctx.freq(arr[i] as f64, size as f64), note_duration, Wave::Sine);
        ctx.visual(arr, &[i, j]);
        ctx.delay(ctx.adaptive_delay(40.0, size));
    }
}

fn bogobogo_sort(
    ctx: &SortCtx,
    arr: &mut [i64],
    n: usize,
    attempts: &mut usize,
    note_duration: f32,
    size: usize,
) {
    if n <= 1 || ctx.stopped() || *attempts >= MAX_ATTEMPTS {
        return;
    }
    while !is_sorted(arr, n) && !ctx.stopped() && *attempts < MAX_ATTEMPTS {
        bogobogo_sort(ctx, arr, n - 1, attempts, note_duration, size);
        if ctx.stopped() {
            return;
        }
        shuffle(ctx, arr, n, note_duration, size);
        *attempts += 1;
    }
}

// Ported from TypeScript: src/utils/audio/algorithms/bogobogo.ts
#[allow(non_snake_case)]
pub fn generateBogobogoSort(ctx: &mut SortCtx, size: usize, loop_: bool) {
    while !ctx.stopped() {
        let mut array = ctx.random_array(size);
        let note_duration = ctx.adaptive_duration(0.008, size);
        let mut attempts = 0usize;

        let n = array.len();
        bogobogo_sort(ctx, &mut array, n, &mut attempts, note_duration, size);

        if attempts >= MAX_ATTEMPTS {
            array.sort_unstable();
        }

        ctx.play_sorted(&array);
        if !loop_ || ctx.stopped() {
            return;
        }
        ctx.delay(ctx.adaptive_delay(200.0, size));
    }
}
