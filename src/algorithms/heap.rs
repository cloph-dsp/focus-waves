use crate::audio::Wave;
use crate::engine::SortCtx;

// Ported from TypeScript: src/utils/audio/algorithms/heap.ts
fn heapify(
    ctx: &mut SortCtx,
    arr: &mut [i64],
    n: usize,
    i: usize,
    note_duration: f32,
    audio_delay: u64,
    size: usize,
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
        ctx.play(ctx.freq(arr[i] as f64, size as f64), note_duration, Wave::Sine);
        ctx.visual(arr, &[i, largest]);
        ctx.delay(audio_delay);
        heapify(ctx, arr, n, largest, note_duration, audio_delay, size);
    }
}

#[allow(non_snake_case)]
pub fn generateHeapSort(ctx: &mut SortCtx, size: usize, loop_: bool) {
    while !ctx.stopped() {
        let mut array = ctx.random_array(size);
        let note_duration = ctx.adaptive_duration(0.007, size);
        let audio_delay = ctx.adaptive_delay(200.0, size);
        let n = array.len();

        if n > 0 {
            let mut i = n / 2;
            while i > 0 {
                i -= 1;
                if ctx.stopped() {
                    return;
                }
                heapify(ctx, &mut array, n, i, note_duration, audio_delay, size);
            }

            for idx in (1..n).rev() {
                if ctx.stopped() {
                    return;
                }
                array.swap(0, idx);
                ctx.play(ctx.freq(array[0] as f64, size as f64), note_duration * 1.2, Wave::Sine);
                ctx.visual(&array, &[0, idx]);
                ctx.delay(audio_delay);
                heapify(ctx, &mut array, idx, 0, note_duration, audio_delay, size);
            }
        }

        ctx.play_sorted(&array);
        if !loop_ || ctx.stopped() {
            return;
        }
        ctx.delay(ctx.adaptive_delay(200.0, size));
    }
}
