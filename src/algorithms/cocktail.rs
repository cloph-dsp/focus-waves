use crate::audio::Wave;
use crate::engine::SortCtx;

// Ported from TypeScript: src/utils/audio/algorithms/cocktail.ts
#[allow(non_snake_case)]
pub fn generateCocktailSort(ctx: &mut SortCtx, size: usize, loop_: bool) {
    while !ctx.stopped() {
        let mut array = ctx.random_array(size);
        let note_duration = ctx.adaptive_duration(0.008, size);
        let mut swapped = true;
        let mut start = 0usize;
        let mut end = array.len().saturating_sub(1);

        while swapped && !ctx.stopped() {
            swapped = false;

            // Forward pass.
            let mut i = start;
            while i < end {
                if ctx.stopped() {
                    return;
                }
                if array[i] > array[i + 1] {
                    array.swap(i, i + 1);
                    ctx.play(ctx.freq(array[i] as f64, size as f64), note_duration, Wave::Sine);
                    swapped = true;
                    ctx.visual(&array, &[i, i + 1]);
                    ctx.delay(ctx.adaptive_delay(55.0, size));
                }
                i += 1;
            }
            end = end.saturating_sub(1);

            if !swapped || ctx.stopped() {
                break;
            }
            swapped = false;

            // Backward pass.
            if end > start {
                let mut i = end - 1;
                loop {
                    if ctx.stopped() {
                        return;
                    }
                    if array[i] > array[i + 1] {
                        array.swap(i, i + 1);
                        ctx.play(
                            ctx.freq(array[i + 1] as f64, size as f64),
                            note_duration,
                            Wave::Sine,
                        );
                        swapped = true;
                        ctx.visual(&array, &[i, i + 1]);
                        ctx.delay(ctx.adaptive_delay(55.0, size));
                    }
                    if i == start {
                        break;
                    }
                    i -= 1;
                }
            }
            start += 1;
        }

        ctx.play_sorted(&array);
        if !loop_ || ctx.stopped() {
            return;
        }
        ctx.delay(ctx.adaptive_delay(200.0, size));
    }
}
