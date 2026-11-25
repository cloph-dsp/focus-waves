use crate::audio::Wave;
use crate::engine::SortCtx;

fn merge(
    ctx: &mut SortCtx,
    arr: &mut [i64],
    start1: usize,
    end1: usize,
    start2: usize,
    end2: usize,
    size: usize,
    note_duration: f32,
    audio_delay: u64,
) {
    let mut temp: Vec<i64> = Vec::new();
    let mut i = start1;
    let mut j = start2;

    while i < end1 && j < end2 {
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
    while i < end1 {
        temp.push(arr[i]);
        i += 1;
    }
    while j < end2 {
        temp.push(arr[j]);
        j += 1;
    }

    for (k, value) in temp.iter().enumerate() {
        if ctx.stopped() {
            return;
        }
        arr[start1 + k] = *value;
        ctx.play(ctx.freq(*value as f64, size as f64), note_duration, Wave::Sine);
        ctx.visual(arr, &[start1 + k]);
        ctx.delay(audio_delay);
    }
}

// Ported from TypeScript: src/utils/audio/algorithms/adaptive-merge.ts
#[allow(non_snake_case)]
pub fn generateAdaptiveMergeSort(ctx: &mut SortCtx, size: usize, loop_: bool) {
    while !ctx.stopped() {
        let mut array = ctx.random_array(size);
        let note_duration = ctx.adaptive_duration(0.02, size);
        let audio_delay = ctx.adaptive_delay(40.0, size);

        // Detect naturally ordered runs.
        let mut runs: Vec<(usize, usize)> = Vec::new();
        let mut start = 0;
        while start < array.len() {
            let mut end = start + 1;
            while end < array.len() && array[end] >= array[end - 1] {
                end += 1;
            }
            runs.push((start, end));
            start = end;
        }

        while runs.len() > 1 {
            if ctx.stopped() {
                return;
            }
            let mut new_runs: Vec<(usize, usize)> = Vec::new();
            let mut i = 0;
            while i < runs.len() {
                if i + 1 < runs.len() {
                    merge(
                        ctx,
                        &mut array,
                        runs[i].0,
                        runs[i].1,
                        runs[i + 1].0,
                        runs[i + 1].1,
                        size,
                        note_duration,
                        audio_delay,
                    );
                    new_runs.push((runs[i].0, runs[i + 1].1));
                } else {
                    new_runs.push(runs[i]);
                }
                i += 2;
            }
            runs = new_runs;
        }

        ctx.play_sorted(&array);

        if !loop_ || ctx.stopped() {
            return;
        }
        ctx.delay(ctx.adaptive_delay(200.0, size));
    }
}
