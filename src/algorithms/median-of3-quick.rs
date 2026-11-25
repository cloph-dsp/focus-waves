use crate::audio::Wave;
use crate::engine::SortCtx;

fn partition(
    ctx: &mut SortCtx,
    arr: &mut [i64],
    low: isize,
    high: isize,
    size: usize,
    note_duration: f32,
    audio_delay: u64,
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
                Wave::Saw,
            );
            ctx.visual(arr, &[i as usize, j as usize]);
            ctx.delay(audio_delay);
        }
        j += 1;
    }

    arr.swap((i + 1) as usize, high as usize);
    ctx.play(
        ctx.freq(arr[(i + 1) as usize] as f64, size as f64),
        note_duration * 1.5,
        Wave::Saw,
    );
    ctx.visual(arr, &[(i + 1) as usize, high as usize]);
    ctx.delay(audio_delay);
    i + 1
}

fn quick_sort(
    ctx: &mut SortCtx,
    arr: &mut [i64],
    low: isize,
    high: isize,
    size: usize,
    note_duration: f32,
    audio_delay: u64,
) {
    if low < high && !ctx.stopped() {
        let pi = partition(ctx, arr, low, high, size, note_duration, audio_delay);
        quick_sort(ctx, arr, low, pi - 1, size, note_duration, audio_delay);
        quick_sort(ctx, arr, pi + 1, high, size, note_duration, audio_delay);
    }
}

// Ported from TypeScript: src/utils/audio/algorithms/median-of3-quick.ts
// (delegates to quick.ts)
#[allow(non_snake_case)]
pub fn generateMedianOf3QuickSort(ctx: &mut SortCtx, size: usize, loop_: bool) {
    while !ctx.stopped() {
        let mut array = ctx.random_array(size);
        let note_duration = ctx.adaptive_duration(0.003, size);
        let audio_delay = ctx.adaptive_delay(25.0, size);

        if !array.is_empty() {
            let high = array.len() as isize - 1;
            quick_sort(
                ctx,
                &mut array,
                0,
                high,
                size,
                note_duration,
                audio_delay,
            );
        }

        ctx.play_sorted(&array);
        if !loop_ || ctx.stopped() {
            return;
        }
        ctx.delay(ctx.adaptive_delay(200.0, size));
    }
}
