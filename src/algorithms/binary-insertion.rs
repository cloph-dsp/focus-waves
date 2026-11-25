use crate::audio::Wave;
use crate::engine::SortCtx;

fn binary_search(arr: &[i64], item: i64, mut low: isize, mut high: isize) -> usize {
    while low <= high {
        let mid = (low + high) / 2;
        if item < arr[mid as usize] {
            high = mid - 1;
        } else {
            low = mid + 1;
        }
    }
    low as usize
}

// Ported from TypeScript: src/utils/audio/algorithms/binary-insertion.ts
#[allow(non_snake_case)]
pub fn generateBinaryInsertionSort(ctx: &mut SortCtx, size: usize, loop_: bool) {
    while !ctx.stopped() {
        let mut array = ctx.random_array(size);
        let note_duration = ctx.adaptive_duration(0.0075, size);
        let audio_delay = ctx.adaptive_delay(200.0, size);

        for i in 1..array.len() {
            if ctx.stopped() {
                return;
            }
            let key = array[i];
            let pos = binary_search(&array, key, 0, i as isize - 1);

            ctx.play(
                ctx.freq(key as f64, size as f64),
                note_duration * 1.3,
                Wave::Sine,
            );

            for j in (pos..i).rev() {
                if ctx.stopped() {
                    return;
                }
                array[j + 1] = array[j];
                ctx.play(
                    ctx.freq(array[j + 1] as f64, size as f64),
                    note_duration,
                    Wave::Sine,
                );
                ctx.visual(&array, &[j, j + 1]);
                ctx.delay(audio_delay);
            }
            array[pos] = key;

            ctx.visual(&array, &[pos]);
            ctx.delay(audio_delay);
        }

        ctx.play_sorted(&array);

        if !loop_ || ctx.stopped() {
            return;
        }
        ctx.delay(ctx.adaptive_delay(200.0, size));
    }
}
