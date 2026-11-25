use crate::audio::Wave;
use crate::engine::SortCtx;

fn insertion_sort(
    ctx: &mut SortCtx,
    arr: &mut [i64],
    left: isize,
    right: isize,
    size: usize,
    note_duration: f32,
) {
    let mut i = left + 1;
    while i <= right && !ctx.stopped() {
        let key = arr[i as usize];
        let mut j = i - 1;
        while j >= left && arr[j as usize] > key && !ctx.stopped() {
            arr[(j + 1) as usize] = arr[j as usize];
            ctx.play(
                ctx.freq(arr[(j + 1) as usize] as f64, size as f64),
                note_duration,
                Wave::Sine,
            );
            ctx.visual(arr, &[j as usize, (j + 1) as usize]);
            ctx.delay(ctx.adaptive_delay(45.0, size));
            j -= 1;
        }
        arr[(j + 1) as usize] = key;
        i += 1;
    }
}

fn heapify(
    ctx: &mut SortCtx,
    arr: &mut [i64],
    n: usize,
    i: usize,
    size: usize,
    note_duration: f32,
) {
    let mut largest = i;
    let left = 2 * i + 1;
    let right = 2 * i + 2;

    if left < n && arr[left] > arr[largest] {
        largest = left;
    }
    if right < n && arr[right] > arr[largest] {
        largest = right;
    }

    if largest != i && !ctx.stopped() {
        arr.swap(i, largest);
        ctx.play(
            ctx.freq(arr[i] as f64, size as f64),
            note_duration,
            Wave::Sine,
        );
        ctx.visual(arr, &[i, largest]);
        ctx.delay(ctx.adaptive_delay(45.0, size));
        heapify(ctx, arr, n, largest, size, note_duration);
    }
}

fn heap_sort(
    ctx: &mut SortCtx,
    arr: &mut [i64],
    left: isize,
    right: isize,
    size: usize,
    note_duration: f32,
) {
    let n = (right - left + 1) as usize;
    if n == 0 {
        return;
    }
    let mut temp = arr[left as usize..right as usize + 1].to_vec();

    let mut i = n / 2;
    while i > 0 && !ctx.stopped() {
        i -= 1;
        heapify(ctx, &mut temp, n, i, size, note_duration);
    }

    let mut i = n - 1;
    while i > 0 && !ctx.stopped() {
        temp.swap(0, i);
        heapify(ctx, &mut temp, i, 0, size, note_duration);
        i -= 1;
    }

    for k in 0..n {
        arr[left as usize + k] = temp[k];
    }
}

fn partition(
    ctx: &mut SortCtx,
    arr: &mut [i64],
    low: isize,
    high: isize,
    size: usize,
    note_duration: f32,
) -> isize {
    let pivot = arr[high as usize];
    let mut i = low - 1;
    let mut j = low;

    while j < high && !ctx.stopped() {
        if arr[j as usize] < pivot {
            i += 1;
            arr.swap(i as usize, j as usize);
            ctx.play(
                ctx.freq(arr[i as usize] as f64, size as f64),
                note_duration,
                Wave::Sine,
            );
            ctx.visual(arr, &[i as usize, j as usize]);
            ctx.delay(ctx.adaptive_delay(45.0, size));
        }
        j += 1;
    }
    arr.swap((i + 1) as usize, high as usize);
    i + 1
}

fn intro_sort_util(
    ctx: &mut SortCtx,
    arr: &mut [i64],
    low: isize,
    high: isize,
    depth: isize,
    size: usize,
    note_duration: f32,
) {
    let len = high - low + 1;
    if len < 16 || ctx.stopped() {
        insertion_sort(ctx, arr, low, high, size, note_duration);
        return;
    }
    if depth == 0 {
        heap_sort(ctx, arr, low, high, size, note_duration);
        return;
    }

    let pivot = partition(ctx, arr, low, high, size, note_duration);
    intro_sort_util(ctx, arr, low, pivot - 1, depth - 1, size, note_duration);
    intro_sort_util(ctx, arr, pivot + 1, high, depth - 1, size, note_duration);
}

// Ported from TypeScript: src/utils/audio/algorithms/intro.ts
#[allow(non_snake_case)]
pub fn generateIntroSort(ctx: &mut SortCtx, size: usize, loop_: bool) {
    while !ctx.stopped() {
        let mut array = ctx.random_array(size);
        let note_duration = ctx.adaptive_duration(0.0085, size);
        let max_depth = (array.len().max(1) as f64).log2().floor() as isize * 2;

        if !array.is_empty() {
            let high = array.len() as isize - 1;
            intro_sort_util(ctx, &mut array, 0, high, max_depth, size, note_duration);
        }

        ctx.play_sorted(&array);
        if !loop_ || ctx.stopped() {
            return;
        }
        ctx.delay(ctx.adaptive_delay(200.0, size));
    }
}
