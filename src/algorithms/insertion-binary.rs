use crate::audio::Wave;
use crate::engine::SortCtx;

// Ported from TypeScript: src/utils/audio/algorithms/insertion-binary.ts
// (delegates to binary-insertion.ts)
#[allow(non_snake_case)]
pub fn generateInsertionBinarySort(ctx: &mut SortCtx, size: usize, loop_: bool) {
    while !ctx.stopped() {
        let mut array = ctx.random_array(size);
        let note_duration = ctx.adaptive_duration(0.0075, size);

        for i in 1..array.len() {
            if ctx.stopped() {
                return;
            }
            let key = array[i];

            // binarySearch(array, key, 0, i - 1)
            let mut low: isize = 0;
            let mut high: isize = i as isize - 1;
            while low <= high {
                let mid = (low + high) / 2;
                if key < array[mid as usize] {
                    high = mid - 1;
                } else {
                    low = mid + 1;
                }
            }
            let pos = low as usize;

            ctx.play(
                ctx.freq(key as f64, size as f64),
                note_duration * 1.3,
                Wave::Sine,
            );

            let mut j = i as isize - 1;
            while j >= pos as isize && !ctx.stopped() {
                array[(j + 1) as usize] = array[j as usize];
                ctx.play(
                    ctx.freq(array[(j + 1) as usize] as f64, size as f64),
                    note_duration,
                    Wave::Sine,
                );
                ctx.visual(&array, &[j as usize, (j + 1) as usize]);
                ctx.delay(ctx.adaptive_delay(200.0, size));
                j -= 1;
            }
            array[pos] = key;
            ctx.visual(&array, &[pos]);
            ctx.delay(ctx.adaptive_delay(200.0, size));
        }

        ctx.play_sorted(&array);
        if !loop_ || ctx.stopped() {
            return;
        }
        ctx.delay(ctx.adaptive_delay(200.0, size));
    }
}
