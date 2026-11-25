use crate::audio::Wave;
use crate::engine::SortCtx;

const RUN: usize = 32;

fn insertion_sort(
    ctx: &mut SortCtx,
    arr: &mut [i64],
    left: usize,
    right: usize,
    size: usize,
    note_duration: f32,
) {
    if left >= right {
        return;
    }
    for i in (left + 1)..=right {
        if ctx.stopped() {
            return;
        }
        let temp = arr[i];
        let mut j = i;
        while j > left && arr[j - 1] > temp && !ctx.stopped() {
            arr[j] = arr[j - 1];
            ctx.play(
                ctx.freq(arr[j] as f64, size as f64),
                note_duration,
                Wave::Sine,
            );
            ctx.visual(arr, &[j - 1, j]);
            ctx.delay(ctx.adaptive_delay(40.0, size));
            j -= 1;
        }
        arr[j] = temp;
    }
}

fn merge(
    ctx: &mut SortCtx,
    arr: &mut [i64],
    l: usize,
    m: usize,
    r: usize,
    size: usize,
    note_duration: f32,
) {
    let left_half = arr[l..=m].to_vec();
    let right_half = arr[(m + 1)..=r].to_vec();
    let len1 = left_half.len();
    let len2 = right_half.len();
    let (mut i, mut j, mut k) = (0usize, 0usize, l);

    while i < len1 && j < len2 && !ctx.stopped() {
        if left_half[i] <= right_half[j] {
            arr[k] = left_half[i];
            i += 1;
        } else {
            arr[k] = right_half[j];
            j += 1;
        }
        ctx.play(
            ctx.freq(arr[k] as f64, size as f64),
            note_duration,
            Wave::Sine,
        );
        ctx.visual(arr, &[k]);
        ctx.delay(ctx.adaptive_delay(40.0, size));
        k += 1;
    }
    while i < len1 && !ctx.stopped() {
        arr[k] = left_half[i];
        i += 1;
        k += 1;
    }
    while j < len2 && !ctx.stopped() {
        arr[k] = right_half[j];
        j += 1;
        k += 1;
    }
}

// Ported from TypeScript: src/utils/audio/algorithms/tim.ts
#[allow(non_snake_case)]
pub fn generateTimSort(ctx: &mut SortCtx, size: usize, loop_: bool) {
    while !ctx.stopped() {
        let mut array = ctx.random_array(size);
        let note_duration = ctx.adaptive_duration(0.0085, size);
        let n = array.len();

        let mut left = 0usize;
        while left < n && !ctx.stopped() {
            insertion_sort(
                ctx,
                &mut array,
                left,
                (left + RUN - 1).min(n.saturating_sub(1)),
                size,
                note_duration,
            );
            left += RUN;
        }

        let mut run_size = RUN;
        while run_size < n && !ctx.stopped() {
            let mut l = 0usize;
            while l < n && !ctx.stopped() {
                let mid = l + run_size - 1;
                let right = (l + run_size * 2 - 1).min(n - 1);
                if mid < right {
                    merge(ctx, &mut array, l, mid, right, size, note_duration);
                }
                l += run_size * 2;
            }
            run_size *= 2;
        }

        ctx.play_sorted(&array);
        if !loop_ || ctx.stopped() {
            return;
        }
        ctx.delay(ctx.adaptive_delay(200.0, size));
    }
}
