use crate::audio::Wave;
use crate::engine::SortCtx;

// Ported from TypeScript: src/utils/audio/algorithms/bottom-up-heap.ts
#[allow(non_snake_case)]
pub fn generateBottomUpHeapSort(ctx: &mut SortCtx, size: usize, loop_: bool) {
    while !ctx.stopped() {
        let mut array = ctx.random_array(size);
        let note_duration = ctx.adaptive_duration(0.0075, size);
        let audio_delay = ctx.adaptive_delay(200.0, size);
        let n = array.len();

        // Build heap from bottom.
        for idx in (0..n).rev() {
            if ctx.stopped() {
                return;
            }
            let mut current = idx;
            while current > 0 && !ctx.stopped() {
                let parent = (current - 1) / 2;
                if array[current] > array[parent] {
                    array.swap(current, parent);
                    ctx.play(
                        ctx.freq(array[current] as f64, size as f64),
                        note_duration,
                        Wave::Sine,
                    );
                    ctx.visual(&array, &[current, parent]);
                    ctx.delay(audio_delay);
                    current = parent;
                } else {
                    break;
                }
            }
        }

        // Extract and heapify.
        for i in (1..n).rev() {
            if ctx.stopped() {
                return;
            }
            array.swap(0, i);
            ctx.play(
                ctx.freq(array[0] as f64, size as f64),
                note_duration,
                Wave::Triangle,
            );
            ctx.visual(&array, &[0, i]);
            ctx.delay(audio_delay);

            let mut current = 0usize;
            loop {
                if ctx.stopped() {
                    return;
                }
                let left = 2 * current + 1;
                let right = 2 * current + 2;
                let mut largest = current;
                if left < i && array[left] > array[largest] {
                    largest = left;
                }
                if right < i && array[right] > array[largest] {
                    largest = right;
                }
                if largest == current {
                    break;
                }
                array.swap(current, largest);
                ctx.play(
                    ctx.freq(array[current] as f64, size as f64),
                    note_duration,
                    Wave::Sine,
                );
                ctx.visual(&array, &[current, largest]);
                ctx.delay(audio_delay);
                current = largest;
            }
        }

        ctx.play_sorted(&array);
        if !loop_ || ctx.stopped() {
            return;
        }
        ctx.delay(ctx.adaptive_delay(200.0, size));
    }
}
