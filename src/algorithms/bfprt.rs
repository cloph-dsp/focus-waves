use crate::audio::Wave;
use crate::engine::SortCtx;

// BFPRT / median-of-medians quicksort (Blum, Floyd, Pratt, Rivest, Tarjan, 1973).
// Three sonified voices: Triangle = group insertion sort, Sine = recursive pivot
// selection, Saw = partitioning of the main array.

#[allow(non_snake_case)]
pub fn generateBfprtSort(ctx: &mut SortCtx, size: usize, loop_: bool) {
    while !ctx.stopped() {
        let mut array = ctx.random_array(size);
        let note_duration = ctx.adaptive_duration(0.003, size);
        let audio_delay = ctx.adaptive_delay(25.0, size);
        let last = array.len().saturating_sub(1);

        bfprt_sort(ctx, &mut array, 0, last, size, note_duration, audio_delay);
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

/// Insertion-sort arr[lo..=hi]: small quintets, the first (Triangle) voice.
fn insertion_sort_group(
    ctx: &mut SortCtx,
    arr: &mut [i64],
    lo: usize,
    hi: usize,
    size: usize,
    note_duration: f32,
    audio_delay: u64,
) {
    if hi <= lo || ctx.stopped() {
        return;
    }
    for i in (lo + 1)..=hi {
        if ctx.stopped() {
            return;
        }
        let key = arr[i];
        let mut j = i;
        while j > lo && arr[j - 1] > key && !ctx.stopped() {
            arr[j] = arr[j - 1];
            ctx.play(
                ctx.freq(arr[j] as f64, size as f64),
                note_duration,
                Wave::Triangle,
            );
            ctx.visual(arr, &[j - 1, j]);
            ctx.delay(audio_delay);
            j -= 1;
        }
        if ctx.stopped() {
            return;
        }
        arr[j] = key;
        ctx.play(
            ctx.freq(key as f64, size as f64),
            note_duration,
            Wave::Triangle,
        );
        ctx.visual(arr, &[j]);
        ctx.delay(audio_delay);
    }
}

/// Sort each group of five in place and return its median value.
fn collect_medians(
    ctx: &mut SortCtx,
    arr: &mut [i64],
    lo: usize,
    hi: usize,
    size: usize,
    note_duration: f32,
    audio_delay: u64,
) -> Option<Vec<i64>> {
    let mut medians = Vec::new();
    let mut start = lo;
    while start <= hi {
        if ctx.stopped() {
            return None;
        }
        let end = (start + 4).min(hi);
        insertion_sort_group(ctx, arr, start, end, size, note_duration, audio_delay);
        if ctx.stopped() {
            return None;
        }
        medians.push(arr[start + (end - start) / 2]);
        if end == hi {
            break;
        }
        start = end + 1;
    }
    Some(medians)
}

/// Lomuto partition around pivot, which is known to be present in arr[lo..=hi].
/// `wave` picks the voice: Saw for the sort, Sine for the recursive selection.
// Explicit sonification/timing knobs; a struct would add noise at every call site.
#[allow(clippy::too_many_arguments)]
fn partition(
    ctx: &mut SortCtx,
    arr: &mut [i64],
    lo: usize,
    hi: usize,
    pivot: i64,
    wave: Wave,
    size: usize,
    note_duration: f32,
    audio_delay: u64,
) -> Option<usize> {
    // Locate the pivot and park it at hi.
    let mut p = lo;
    while p < hi {
        if ctx.stopped() {
            return None;
        }
        ctx.play(ctx.freq(arr[p] as f64, size as f64), note_duration, wave);
        ctx.visual(arr, &[p]);
        if arr[p] == pivot {
            arr.swap(p, hi);
            break;
        }
        p += 1;
        ctx.delay(audio_delay);
    }
    if ctx.stopped() {
        return None;
    }
    ctx.play_after(
        note_duration / 2.0,
        ctx.freq(arr[hi] as f64, size as f64),
        note_duration,
        wave,
    );
    ctx.visual(arr, &[p, hi]);
    ctx.delay(audio_delay);

    let mut store = lo;
    for j in lo..hi {
        if ctx.stopped() {
            return None;
        }
        ctx.play(ctx.freq(arr[j] as f64, size as f64), note_duration, wave);
        ctx.visual(arr, &[store, j]);
        if arr[j] < pivot {
            arr.swap(store, j);
            ctx.play_after(
                note_duration / 2.0,
                ctx.freq(arr[store] as f64, size as f64),
                note_duration,
                wave,
            );
            ctx.visual(arr, &[store, j]);
            store += 1;
        }
        ctx.delay(audio_delay);
    }
    if ctx.stopped() {
        return None;
    }
    arr.swap(store, hi);
    ctx.play(
        ctx.freq(arr[store] as f64, size as f64),
        note_duration * 1.5,
        wave,
    );
    ctx.visual(arr, &[store, hi]);
    ctx.delay(audio_delay);
    Some(store)
}

/// BFPRT selection: value of the k-th smallest in arr[lo..=hi].
/// Its inner pivot search calls the same selection recursively (Sine voice).
// Explicit sonification/timing knobs; a struct would add noise at every call site.
#[allow(clippy::too_many_arguments)]
fn bfprt_select(
    ctx: &mut SortCtx,
    arr: &mut [i64],
    mut lo: usize,
    mut hi: usize,
    k: usize,
    size: usize,
    note_duration: f32,
    audio_delay: u64,
) -> Option<i64> {
    loop {
        if ctx.stopped() {
            return None;
        }
        if hi <= lo {
            return Some(arr[k]);
        }
        let n = hi - lo + 1;
        if n <= 5 {
            insertion_sort_group(ctx, arr, lo, hi, size, note_duration, audio_delay);
            if ctx.stopped() {
                return None;
            }
            return Some(arr[k]);
        }
        let mut medians = collect_medians(ctx, arr, lo, hi, size, note_duration, audio_delay)?;
        let m = medians.len();
        let pivot = bfprt_select(
            ctx,
            &mut medians,
            0,
            m - 1,
            m / 2,
            size,
            note_duration,
            audio_delay,
        )?;
        let pi = partition(
            ctx,
            arr,
            lo,
            hi,
            pivot,
            Wave::Sine,
            size,
            note_duration,
            audio_delay,
        )?;
        if k == pi {
            return Some(arr[pi]);
        } else if k < pi {
            // Pivot parked at hi means it is the maximum here; drop it, or hi stalls.
            hi = if pi == hi { pi - 1 } else { pi };
        } else {
            lo = pi + 1;
        }
    }
}

/// Median-of-medians pivot for arr[lo..=hi].
fn choose_pivot(
    ctx: &mut SortCtx,
    arr: &mut [i64],
    lo: usize,
    hi: usize,
    size: usize,
    note_duration: f32,
    audio_delay: u64,
) -> Option<i64> {
    if ctx.stopped() {
        return None;
    }
    let n = hi - lo + 1;
    if n <= 5 {
        insertion_sort_group(ctx, arr, lo, hi, size, note_duration, audio_delay);
        if ctx.stopped() {
            return None;
        }
        return Some(arr[lo + n / 2]);
    }
    let mut medians = collect_medians(ctx, arr, lo, hi, size, note_duration, audio_delay)?;
    let m = medians.len();
    let pivot = bfprt_select(
        ctx,
        &mut medians,
        0,
        m - 1,
        m / 2,
        size,
        note_duration,
        audio_delay,
    )?;
    // Accent the selected pivot in the Sine register.
    ctx.play(
        ctx.freq(pivot as f64, size as f64),
        note_duration * 2.0,
        Wave::Sine,
    );
    ctx.delay(audio_delay);
    Some(pivot)
}

fn bfprt_sort(
    ctx: &mut SortCtx,
    arr: &mut [i64],
    lo: usize,
    hi: usize,
    size: usize,
    note_duration: f32,
    audio_delay: u64,
) {
    if hi <= lo || ctx.stopped() {
        return;
    }
    let n = hi - lo + 1;
    if n <= 5 {
        insertion_sort_group(ctx, arr, lo, hi, size, note_duration, audio_delay);
        return;
    }
    let Some(pivot) = choose_pivot(ctx, arr, lo, hi, size, note_duration, audio_delay) else {
        return;
    };
    let Some(pi) = partition(
        ctx,
        arr,
        lo,
        hi,
        pivot,
        Wave::Saw,
        size,
        note_duration,
        audio_delay,
    ) else {
        return;
    };
    bfprt_sort(ctx, arr, lo, pi.saturating_sub(1), size, note_duration, audio_delay);
    if ctx.stopped() {
        return;
    }
    bfprt_sort(ctx, arr, pi + 1, hi, size, note_duration, audio_delay);
}
