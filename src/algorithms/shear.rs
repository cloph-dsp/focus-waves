use crate::audio::Wave;
use crate::engine::SortCtx;

// Ported from TypeScript: src/utils/audio/algorithms/shear.ts
#[allow(non_snake_case)]
pub fn generateShearSort(ctx: &mut SortCtx, size: usize, loop_: bool) {
    while !ctx.stopped() {
        let mut array = ctx.random_array(size);
        let audio_delay = ctx.adaptive_delay(40.0, size);

        let rows = (size as f64).sqrt().ceil() as usize;
        if rows == 0 {
            ctx.play_sorted(&array);
            if !loop_ || ctx.stopped() {
                return;
            }
            ctx.delay(ctx.adaptive_delay(200.0, size));
            continue;
        }
        let cols = size.div_ceil(rows);
        let phases = (rows as f64).log2().ceil() as usize + 1;

        for _phase in 0..phases {
            for r in 0..rows {
                if ctx.stopped() {
                    return;
                }
                sort_row(ctx, &mut array, r, cols, size, r % 2 == 0, audio_delay);
            }
            for c in 0..cols {
                if ctx.stopped() {
                    return;
                }
                sort_column(ctx, &mut array, c, rows, cols, size, audio_delay);
            }
        }

        // Shear's alternating row order leaves a snake-shaped matrix; a final
        // linear insertion pass folds it into one globally ascending sequence.
        finish_linear(ctx, &mut array, size, audio_delay);
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

fn finish_linear(ctx: &mut SortCtx, arr: &mut [i64], size: usize, audio_delay: u64) {
    for i in 1..arr.len() {
        if ctx.stopped() {
            return;
        }
        let mut j = i;
        while j > 0 && arr[j] < arr[j - 1] {
            if ctx.stopped() {
                return;
            }
            arr.swap(j, j - 1);
            ctx.play(ctx.freq(arr[j] as f64, size as f64), 0.02, Wave::Sine);
            ctx.visual(arr, &[j, j - 1]);
            ctx.delay(audio_delay);
            j -= 1;
        }
    }
}

fn sort_row(
    ctx: &mut SortCtx,
    arr: &mut [i64],
    row_index: usize,
    cols: usize,
    size: usize,
    ascending: bool,
    audio_delay: u64,
) {
    let start = row_index * cols;
    let end = (start + cols).min(size);
    if end <= start {
        return;
    }
    for i in start..end - 1 {
        for j in i + 1..end {
            if ctx.stopped() {
                return;
            }
            let should_swap = if ascending {
                arr[i] > arr[j]
            } else {
                arr[i] < arr[j]
            };
            if should_swap {
                arr.swap(i, j);
                ctx.play(ctx.freq(arr[i] as f64, 100.0), 0.02, Wave::Sine);
                ctx.visual(arr, &[i, j]);
                ctx.delay(audio_delay);
            }
        }
    }
}

fn sort_column(
    ctx: &mut SortCtx,
    arr: &mut [i64],
    col_index: usize,
    rows: usize,
    cols: usize,
    size: usize,
    audio_delay: u64,
) {
    let mut indices: Vec<usize> = Vec::new();
    for r in 0..rows {
        let idx = r * cols + col_index;
        if idx >= size {
            break;
        }
        indices.push(idx);
    }
    if indices.len() < 2 {
        return;
    }
    for i in 0..indices.len() - 1 {
        for j in i + 1..indices.len() {
            if ctx.stopped() {
                return;
            }
            if arr[indices[i]] > arr[indices[j]] {
                arr.swap(indices[i], indices[j]);
                ctx.play(ctx.freq(arr[indices[i]] as f64, 100.0), 0.02, Wave::Sine);
                ctx.visual(arr, &indices);
                ctx.delay(audio_delay);
            }
        }
    }
}
