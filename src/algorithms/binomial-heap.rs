use crate::audio::Wave;
use crate::engine::SortCtx;

fn heapify(
    ctx: &mut SortCtx,
    arr: &mut [i64],
    n: usize,
    i: usize,
    size: usize,
    note_duration: f32,
    audio_delay: u64,
) {
    if ctx.stopped() {
        return;
    }
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
        heapify(ctx, arr, n, largest, size, note_duration, audio_delay);
    }
}

// Ported from TypeScript: src/utils/audio/algorithms/binomial-heap.ts
// The TS generator delegates directly to generateHeapSort, inlined here.
#[allow(non_snake_case)]
pub fn generateBinomialHeapSort(ctx: &mut SortCtx, size: usize, loop_: bool) {
    while !ctx.stopped() {
        let mut array = ctx.random_array(size);
        let note_duration = ctx.adaptive_duration(0.007, size);
        let audio_delay = ctx.adaptive_delay(200.0, size);

        let len = array.len();
        for i in (0..len / 2).rev() {
            if ctx.stopped() {
                return;
            }
            heapify(ctx, &mut array, len, i, size, note_duration, audio_delay);
        }

        for i in (1..len).rev() {
            if ctx.stopped() {
                return;
            }
            array.swap(0, i);
            ctx.play(
                ctx.freq(array[0] as f64, size as f64),
                note_duration * 1.2,
                Wave::Sine,
            );
            ctx.visual(&array, &[0, i]);
            ctx.delay(audio_delay);
            heapify(ctx, &mut array, i, 0, size, note_duration, audio_delay);
        }

        ctx.play_sorted(&array);

        if !loop_ || ctx.stopped() {
            return;
        }
        ctx.delay(ctx.adaptive_delay(200.0, size));
    }
}
