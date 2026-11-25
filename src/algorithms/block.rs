use crate::audio::Wave;
use crate::engine::SortCtx;

// Block Sort: split the array into sqrt(n) blocks, insertion-sort each block in
// place, then merge adjacent sorted runs in widening passes until one run
// remains. In-block insertions sound as Sine tones, block merges as Triangle.

/// Insertion-sort one block `[start, end)`, sonifying every shift (Sine).
fn sort_block(
    ctx: &mut SortCtx,
    arr: &mut [i64],
    start: usize,
    end: usize,
    size: usize,
    note_duration: f32,
    audio_delay: u64,
) {
    let mut i = start + 1;
    while i < end {
        if ctx.stopped() {
            return;
        }
        let key = arr[i];
        let mut j = i;
        while j > start && arr[j - 1] > key {
            if ctx.stopped() {
                return;
            }
            arr[j] = arr[j - 1];
            ctx.play(ctx.freq(arr[j] as f64, size as f64), note_duration, Wave::Sine);
            ctx.visual(arr, &[j - 1, j]);
            ctx.delay(audio_delay);
            j -= 1;
        }
        arr[j] = key;
        ctx.play(ctx.freq(key as f64, size as f64), note_duration, Wave::Sine);
        ctx.visual(arr, &[j]);
        ctx.delay(audio_delay);
        i += 1;
    }
}

/// Merge two adjacent sorted runs `[left, mid)` and `[mid, right)` via a buffer,
/// sonifying every write-back (Triangle).
#[allow(clippy::too_many_arguments)]
fn merge_runs(
    ctx: &mut SortCtx,
    arr: &mut [i64],
    left: usize,
    mid: usize,
    right: usize,
    size: usize,
    note_duration: f32,
    audio_delay: u64,
) {
    let buf = arr[left..right].to_vec();
    let (ln, rn) = (mid - left, right - mid);
    let (mut i, mut j, mut k) = (0usize, 0usize, left);
    while i < ln && j < rn && !ctx.stopped() {
        if buf[i] <= buf[j] {
            arr[k] = buf[i];
            i += 1;
        } else {
            arr[k] = buf[j];
            j += 1;
        }
        ctx.play(ctx.freq(arr[k] as f64, size as f64), note_duration, Wave::Triangle);
        ctx.visual(arr, &[k]);
        ctx.delay(audio_delay);
        k += 1;
    }
    while i < ln && !ctx.stopped() {
        arr[k] = buf[i];
        ctx.play(ctx.freq(arr[k] as f64, size as f64), note_duration, Wave::Triangle);
        ctx.visual(arr, &[k]);
        ctx.delay(audio_delay);
        i += 1;
        k += 1;
    }
    while j < rn && !ctx.stopped() {
        arr[k] = buf[j];
        ctx.play(ctx.freq(arr[k] as f64, size as f64), note_duration, Wave::Triangle);
        ctx.visual(arr, &[k]);
        ctx.delay(audio_delay);
        j += 1;
        k += 1;
    }
}

// Ported from TypeScript: src/utils/audio/algorithms/block.ts
#[allow(non_snake_case)]
pub fn generateBlockSort(ctx: &mut SortCtx, size: usize, loop_: bool) {
    while !ctx.stopped() {
        let mut array = ctx.random_array(size);
        let note_duration = ctx.adaptive_duration(0.0075, size);
        let audio_delay = ctx.adaptive_delay(45.0, size);
        let n = array.len();

        if n > 1 {
            // integer ceil(sqrt(n)) — the block width.
            let mut block_size = 1usize;
            while block_size * block_size < n {
                block_size += 1;
            }

            // Phase 1: insertion-sort each block.
            let mut start = 0;
            while start < n && !ctx.stopped() {
                let end = (start + block_size).min(n);
                sort_block(ctx, &mut array, start, end, size, note_duration, audio_delay);
                start = end;
            }

            // Phase 2: repeatedly merge adjacent runs in widening passes.
            let mut width = block_size;
            while width < n && !ctx.stopped() {
                let mut left = 0;
                while left + width < n {
                    if ctx.stopped() {
                        break;
                    }
                    let mid = left + width;
                    let right = (left + 2 * width).min(n);
                    merge_runs(
                        ctx, &mut array, left, mid, right, size, note_duration, audio_delay,
                    );
                    left = right;
                }
                width *= 2;
            }
        }

        ctx.play_sorted(&array);

        if !loop_ || ctx.stopped() {
            return;
        }
        ctx.delay(ctx.adaptive_delay(200.0, size));
    }
}
