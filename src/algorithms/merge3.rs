use crate::audio::Wave;
use crate::engine::SortCtx;

// Explicit sonification/timing knobs; a struct would add noise at every call site.
#[allow(clippy::too_many_arguments)]
fn merge3_way(
    ctx: &mut SortCtx,
    arr: &mut [i64],
    left: usize,
    mid1: usize,
    mid2: usize,
    right: usize,
    size: usize,
    note_duration: f32,
    audio_delay: u64,
) {
    let mut temp: Vec<i64> = Vec::new();
    let (mut i, mut j, mut k) = (left, mid1, mid2);

    while i < mid1 && j < mid2 && k < right && !ctx.stopped() {
        let min_val = arr[i].min(arr[j]).min(arr[k]);
        if arr[i] == min_val {
            temp.push(arr[i]);
            i += 1;
        } else if arr[j] == min_val {
            temp.push(arr[j]);
            j += 1;
        } else {
            temp.push(arr[k]);
            k += 1;
        }
        ctx.play(
            ctx.freq(*temp.last().unwrap() as f64, size as f64),
            note_duration,
            Wave::Sine,
        );
        let mut highlights = Vec::with_capacity(3);
        for idx in [i as isize - 1, j as isize - 1, k as isize - 1] {
            if idx >= 0 {
                highlights.push(idx as usize);
            }
        }
        ctx.visual(arr, &highlights);
        ctx.delay(audio_delay);
    }

    while i < mid1 && j < mid2 && !ctx.stopped() {
        if arr[i] <= arr[j] {
            temp.push(arr[i]);
            i += 1;
        } else {
            temp.push(arr[j]);
            j += 1;
        }
    }
    while j < mid2 && k < right && !ctx.stopped() {
        if arr[j] <= arr[k] {
            temp.push(arr[j]);
            j += 1;
        } else {
            temp.push(arr[k]);
            k += 1;
        }
    }
    while i < mid1 && k < right && !ctx.stopped() {
        if arr[i] <= arr[k] {
            temp.push(arr[i]);
            i += 1;
        } else {
            temp.push(arr[k]);
            k += 1;
        }
    }

    while i < mid1 && !ctx.stopped() {
        temp.push(arr[i]);
        i += 1;
    }
    while j < mid2 && !ctx.stopped() {
        temp.push(arr[j]);
        j += 1;
    }
    while k < right && !ctx.stopped() {
        temp.push(arr[k]);
        k += 1;
    }

    let mut idx = 0usize;
    while idx < temp.len() && !ctx.stopped() {
        arr[left + idx] = temp[idx];
        idx += 1;
    }
}

fn sort3_way(
    ctx: &mut SortCtx,
    arr: &mut [i64],
    left: usize,
    right: usize,
    size: usize,
    note_duration: f32,
    audio_delay: u64,
) {
    if right - left < 2 || ctx.stopped() {
        return;
    }
    // A two-element segment cannot be split into three non-empty runs.
    if right - left == 2 {
        if arr[left] > arr[left + 1] {
            arr.swap(left, left + 1);
            ctx.play(
                ctx.freq(arr[left] as f64, size as f64),
                note_duration,
                Wave::Sine,
            );
            ctx.play_after(
                note_duration / 2.0,
                ctx.freq(arr[left + 1] as f64, size as f64),
                note_duration,
                Wave::Sine,
            );
            ctx.visual(arr, &[left, left + 1]);
            ctx.delay(audio_delay);
        }
        return;
    }
    let third = (right - left) / 3;
    let mid1 = left + third;
    let mid2 = left + 2 * third;

    sort3_way(ctx, arr, left, mid1, size, note_duration, audio_delay);
    sort3_way(ctx, arr, mid1, mid2, size, note_duration, audio_delay);
    sort3_way(ctx, arr, mid2, right, size, note_duration, audio_delay);
    merge3_way(
        ctx, arr, left, mid1, mid2, right, size, note_duration, audio_delay,
    );
}

// Ported from TypeScript: src/utils/audio/algorithms/merge3.ts
#[allow(non_snake_case)]
pub fn generateMerge3Sort(ctx: &mut SortCtx, size: usize, loop_: bool) {
    while !ctx.stopped() {
        let mut array = ctx.random_array(size);
        let note_duration = ctx.adaptive_duration(0.0085, size);
        let audio_delay = ctx.adaptive_delay(35.0, size);

        let right = array.len();
        sort3_way(ctx, &mut array, 0, right, size, note_duration, audio_delay);

        ctx.play_sorted(&array);
        if !loop_ || ctx.stopped() {
            return;
        }
        ctx.delay(ctx.adaptive_delay(200.0, size));
    }
}
