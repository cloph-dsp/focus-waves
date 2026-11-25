use crate::audio::Wave;
use crate::engine::SortCtx;

/// Binary-search tone: the probed element (Sine) against the run-split pivot.
// Explicit sonification/timing knobs; a struct would add noise at every call site.
#[allow(clippy::too_many_arguments)]
fn probe(
    ctx: &SortCtx,
    arr: &[i64],
    idx: usize,
    pivot: usize,
    key: i64,
    size: usize,
    note_duration: f32,
    delay: u64,
) {
    ctx.play(ctx.freq(arr[idx] as f64, size as f64), note_duration, Wave::Sine);
    ctx.play_after(
        note_duration / 2.0,
        ctx.freq(key as f64, size as f64),
        note_duration,
        Wave::Sine,
    );
    ctx.visual(arr, &[idx, pivot]);
    ctx.delay(delay);
}

/// First index in [lo, hi) with value >= key when `upper` is false,
/// or with value > key when `upper` is true. Which side of a tie is chosen
/// keeps equal keys in the left run ahead of equal keys in the right run.
// Explicit sonification/timing knobs; a struct would add noise at every call site.
#[allow(clippy::too_many_arguments)]
fn search_bound(
    ctx: &mut SortCtx,
    arr: &[i64],
    lo: usize,
    hi: usize,
    key: i64,
    pivot: usize,
    size: usize,
    note_duration: f32,
    delay: u64,
    upper: bool,
) -> usize {
    let (mut i, mut j) = (lo, hi);
    while i < j {
        if ctx.stopped() {
            return i;
        }
        let m = i + (j - i) / 2;
        probe(ctx, arr, m, pivot, key, size, note_duration, delay);
        let go_right = if upper { key >= arr[m] } else { arr[m] < key };
        if go_right {
            i = m + 1;
        } else {
            j = m;
        }
    }
    i
}

/// Movement tone: the two elements exchanged by a reversal (Triangle).
fn move_tone(
    ctx: &SortCtx,
    arr: &[i64],
    i: usize,
    j: usize,
    size: usize,
    note_duration: f32,
    delay: u64,
) {
    ctx.play(ctx.freq(arr[i] as f64, size as f64), note_duration, Wave::Triangle);
    ctx.play_after(
        note_duration / 2.0,
        ctx.freq(arr[j] as f64, size as f64),
        note_duration,
        Wave::Triangle,
    );
    ctx.visual(arr, &[i, j]);
    ctx.delay(delay);
}

fn reverse(
    ctx: &mut SortCtx,
    arr: &mut [i64],
    lo: usize,
    hi: usize,
    size: usize,
    note_duration: f32,
    delay: u64,
) {
    let (mut i, mut j) = (lo, hi);
    while j > i + 1 {
        if ctx.stopped() {
            return;
        }
        j -= 1;
        arr.swap(i, j);
        move_tone(ctx, arr, i, j, size, note_duration, delay);
        i += 1;
    }
}

/// Three reversals give an in-place left rotation of [lo, mid) + [mid, hi).
/// Each reversal sweeps a pitch run in the opposite direction to the last.
// Explicit sonification/timing knobs; a struct would add noise at every call site.
#[allow(clippy::too_many_arguments)]
fn rotate(
    ctx: &mut SortCtx,
    arr: &mut [i64],
    lo: usize,
    mid: usize,
    hi: usize,
    size: usize,
    note_duration: f32,
    delay: u64,
) {
    reverse(ctx, arr, lo, mid, size, note_duration, delay);
    if ctx.stopped() {
        return;
    }
    reverse(ctx, arr, mid, hi, size, note_duration, delay);
    if ctx.stopped() {
        return;
    }
    reverse(ctx, arr, lo, hi, size, note_duration, delay);
}

/// SymMerge: stably merge adjacent sorted runs [lo, mid) and [mid, hi)
/// using only swaps, by ratio-splitting the larger run and rotating blocks.
// Explicit sonification/timing knobs; a struct would add noise at every call site.
#[allow(clippy::too_many_arguments)]
fn symmerge(
    ctx: &mut SortCtx,
    arr: &mut [i64],
    lo: usize,
    mid: usize,
    hi: usize,
    size: usize,
    note_duration: f32,
    compare_delay: u64,
    move_delay: u64,
) {
    if ctx.stopped() {
        return;
    }
    let (n1, n2) = (mid - lo, hi - mid);
    if n1 == 0 || n2 == 0 {
        return;
    }
    if n1 == 1 && n2 == 1 {
        if arr[mid] < arr[lo] {
            arr.swap(lo, mid);
            move_tone(ctx, arr, lo, mid, size, note_duration, move_delay);
        }
        return;
    }

    if n1 > n2 {
        // Larger left run: split at its midpoint. The upper half belongs
        // after every strictly smaller element of the right run.
        let q = lo + n1 / 2;
        let r = search_bound(
            ctx, arr, mid, hi, arr[q], q, size, note_duration, compare_delay, false,
        );
        if ctx.stopped() {
            return;
        }
        rotate(ctx, arr, q, mid, r, size, note_duration, move_delay);
        if ctx.stopped() {
            return;
        }
        let nm = q + (r - mid);
        symmerge(ctx, arr, lo, q, nm, size, note_duration, compare_delay, move_delay);
        if ctx.stopped() {
            return;
        }
        symmerge(ctx, arr, nm, r, hi, size, note_duration, compare_delay, move_delay);
    } else {
        // Larger right run: mirror image. Its lower half belongs after
        // every element of the left run that is <= the pivot.
        let q = mid + n2 / 2;
        let r = search_bound(
            ctx, arr, lo, mid, arr[q], q, size, note_duration, compare_delay, true,
        );
        if ctx.stopped() {
            return;
        }
        rotate(ctx, arr, r, mid, q, size, note_duration, move_delay);
        if ctx.stopped() {
            return;
        }
        let nm = r + (q - mid);
        symmerge(ctx, arr, lo, r, nm, size, note_duration, compare_delay, move_delay);
        if ctx.stopped() {
            return;
        }
        symmerge(ctx, arr, nm, q, hi, size, note_duration, compare_delay, move_delay);
    }
}

// Port of Kim & Kutzner, "Ratio Based Stable In-Place Merging", TAMC 2008.
#[allow(non_snake_case)]
pub fn generateSymmergeSort(ctx: &mut SortCtx, size: usize, loop_: bool) {
    while !ctx.stopped() {
        let mut array = ctx.random_array(size);
        let note_duration = ctx.adaptive_duration(0.01, size);
        let compare_delay = ctx.adaptive_delay(70.0, size);
        let move_delay = ctx.adaptive_delay(18.0, size);

        // Bottom-up passes: adjacent sorted runs of width, 2*width, ...
        let n = array.len();
        let mut width = 1usize;
        while width < n {
            if ctx.stopped() {
                return;
            }
            let mut lo = 0usize;
            while lo + width < n {
                if ctx.stopped() {
                    return;
                }
                let mid = lo + width;
                let hi = (lo + 2 * width).min(n);
                symmerge(
                    ctx,
                    &mut array,
                    lo,
                    mid,
                    hi,
                    size,
                    note_duration,
                    compare_delay,
                    move_delay,
                );
                lo += 2 * width;
            }
            width *= 2;
        }

        ctx.play_sorted(&array);
        if !loop_ || ctx.stopped() {
            return;
        }
        ctx.delay(ctx.adaptive_delay(200.0, size));
    }
}
