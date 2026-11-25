use crate::audio::Wave;
use crate::engine::SortCtx;

// Ported from TypeScript: src/utils/audio/algorithms/pairing-heap.ts
// The TS variant delegates to generateHeapSort; the heap-sort body is inlined here
// so this file does not depend on another porting lane.
#[allow(non_snake_case)]
pub fn generatePairingHeapSort(ctx: &mut SortCtx, size: usize, loop_: bool) {
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
            ctx.play(
                ctx.freq(arr[i] as f64, size as f64),
                note_duration,
                Wave::Sine,
            );
            ctx.visual(arr, &[i, largest]);
            ctx.delay(audio_delay);
            heapify(ctx, arr, n, largest, note_duration, audio_delay, size);
        }
    }

    while !ctx.stopped() {
        let mut array = ctx.random_array(size);
        let note_duration = ctx.adaptive_duration(0.007, size);
        let audio_delay = ctx.adaptive_delay(200.0, size);

        let mut i = array.len() / 2;
        while i > 0 && !ctx.stopped() {
            i -= 1;
            let n = array.len();
            heapify(ctx, &mut array, n, i, note_duration, audio_delay, size);
        }

        let mut i = array.len();
        while i > 1 && !ctx.stopped() {
            i -= 1;
            array.swap(0, i);
            ctx.play(
                ctx.freq(array[0] as f64, size as f64),
                note_duration * 1.2,
                Wave::Sine,
            );
            ctx.visual(&array, &[0, i]);
            ctx.delay(audio_delay);
            heapify(ctx, &mut array, i, 0, note_duration, audio_delay, size);
        }

        ctx.play_sorted(&array);
        if !loop_ || ctx.stopped() {
            return;
        }
        ctx.delay(ctx.adaptive_delay(200.0, size));
    }
}
