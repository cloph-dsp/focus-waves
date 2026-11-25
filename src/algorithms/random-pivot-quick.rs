use crate::audio::Wave;
use crate::engine::SortCtx;

// Ported from TypeScript: src/utils/audio/algorithms/random-pivot-quick.ts
// The TS stub delegates to generateQuickSort (quick.ts); the logic is inlined here.
#[allow(non_snake_case)]
pub fn generateRandomPivotQuickSort(ctx: &mut SortCtx, size: usize, loop_: bool) {
    while !ctx.stopped() {
        let mut array = ctx.random_array(size);
        let note_duration = ctx.adaptive_duration(0.003, size);
        let audio_delay = ctx.adaptive_delay(25.0, size);

        let high = array.len().saturating_sub(1);
        quick_sort(ctx, &mut array, 0, high, size, note_duration, audio_delay);

        ctx.play_sorted(&array);
        if !loop_ || ctx.stopped() {
            return;
        }
        ctx.delay(ctx.adaptive_delay(200.0, size));
    }
}

fn quick_sort(
    ctx: &mut SortCtx,
    arr: &mut [i64],
    low: usize,
    high: usize,
    size: usize,
    note_duration: f32,
    audio_delay: u64,
) {
    if low >= high || ctx.stopped() {
        return;
    }
    let pi = partition(ctx, arr, low, high, size, note_duration, audio_delay);
    if ctx.stopped() {
        return;
    }
    if pi > 0 {
        quick_sort(ctx, arr, low, pi - 1, size, note_duration, audio_delay);
    }
    if ctx.stopped() {
        return;
    }
    quick_sort(ctx, arr, pi + 1, high, size, note_duration, audio_delay);
}

fn partition(
    ctx: &mut SortCtx,
    arr: &mut [i64],
    low: usize,
    high: usize,
    size: usize,
    note_duration: f32,
    audio_delay: u64,
) -> usize {
    let pivot = arr[high];
    let mut i: isize = low as isize - 1;

    for j in low..high {
        if ctx.stopped() {
            break;
        }
        if arr[j] < pivot {
            i += 1;
            let iu = i as usize;
            arr.swap(iu, j);
            ctx.play(
                ctx.freq(arr[iu] as f64, size as f64),
                note_duration,
                Wave::Saw,
            );
            ctx.visual(arr, &[iu, j]);
            ctx.delay(audio_delay);
        }
    }

    let pi = (i + 1) as usize;
    arr.swap(pi, high);
    ctx.play(
        ctx.freq(arr[pi] as f64, size as f64),
        note_duration * 1.5,
        Wave::Saw,
    );
    ctx.visual(arr, &[pi, high]);
    ctx.delay(audio_delay);
    pi
}
