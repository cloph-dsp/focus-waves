use crate::audio::Wave;
use crate::engine::SortCtx;

// Ported from TypeScript: src/utils/audio/algorithms/polyphase-merge.ts
// The TS stub delegates to generateMerge3Sort (merge3.ts); the logic is inlined here.
#[allow(non_snake_case)]
pub fn generatePolyphaseMergeSort(ctx: &mut SortCtx, size: usize, loop_: bool) {
    while !ctx.stopped() {
        let mut array = ctx.random_array(size);
        let note_duration = ctx.adaptive_duration(0.0085, size);
        let audio_delay = ctx.adaptive_delay(35.0, size);

        let n = array.len();
        merge3_sort(ctx, &mut array, 0, n, size, note_duration, audio_delay);

        ctx.play_sorted(&array);
        if !loop_ || ctx.stopped() {
            return;
        }
        ctx.delay(ctx.adaptive_delay(200.0, size));
    }
}

fn merge3_sort(
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
    let third = (right - left) / 3;
    if third == 0 {
        // shortcut: TS recurses forever on 2-element segments; sort the pair directly
        if arr[left] > arr[right - 1] {
            arr.swap(left, right - 1);
            ctx.play(
                ctx.freq(arr[left] as f64, size as f64),
                note_duration,
                Wave::Sine,
            );
            ctx.visual(arr, &[left, right - 1]);
            ctx.delay(audio_delay);
        }
        return;
    }
    let mid1 = left + third;
    let mid2 = left + 2 * third;

    merge3_sort(ctx, arr, left, mid1, size, note_duration, audio_delay);
    if ctx.stopped() {
        return;
    }
    merge3_sort(ctx, arr, mid1, mid2, size, note_duration, audio_delay);
    if ctx.stopped() {
        return;
    }
    merge3_sort(ctx, arr, mid2, right, size, note_duration, audio_delay);
    if ctx.stopped() {
        return;
    }
    merge3_way(
        ctx, arr, left, mid1, mid2, right, size, note_duration, audio_delay,
    );
}

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
    let mut i = left;
    let mut j = mid1;
    let mut k = mid2;

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
        // saturating_sub mirrors the TS `i-1` highlights without usize underflow
        ctx.visual(
            arr,
            &[i.saturating_sub(1), j.saturating_sub(1), k.saturating_sub(1)],
        );
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

    for idx in 0..temp.len() {
        if ctx.stopped() {
            return;
        }
        arr[left + idx] = temp[idx];
    }
}
