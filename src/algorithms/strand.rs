use crate::audio::Wave;
use crate::engine::SortCtx;

fn merge(left: &[i64], right: &[i64]) -> Vec<i64> {
    let mut result = Vec::with_capacity(left.len() + right.len());
    let (mut i, mut j) = (0, 0);
    while i < left.len() && j < right.len() {
        if left[i] <= right[j] {
            result.push(left[i]);
            i += 1;
        } else {
            result.push(right[j]);
            j += 1;
        }
    }
    result.extend_from_slice(&left[i..]);
    result.extend_from_slice(&right[j..]);
    result
}

// Ported from TypeScript: src/utils/audio/algorithms/strand.ts
#[allow(non_snake_case)]
pub fn generateStrandSort(ctx: &mut SortCtx, size: usize, loop_: bool) {
    while !ctx.stopped() {
        let mut array = ctx.random_array(size);
        let note_duration = ctx.adaptive_duration(0.0075, size);

        let mut input = array.clone();
        let mut result: Vec<i64> = Vec::new();

        while !input.is_empty() && !ctx.stopped() {
            let mut sublist = vec![input[0]];
            let mut remaining: Vec<i64> = Vec::new();

            for i in 1..input.len() {
                if ctx.stopped() {
                    return;
                }
                if input[i] >= sublist[sublist.len() - 1] {
                    sublist.push(input[i]);
                    ctx.play(ctx.freq(input[i] as f64, size as f64), note_duration, Wave::Sine);
                    let mut display = Vec::with_capacity(array.len());
                    display.extend_from_slice(&result);
                    display.extend_from_slice(&sublist);
                    display.extend_from_slice(&remaining);
                    display.truncate(array.len());
                    ctx.visual(&display, &[result.len() + sublist.len() - 1]);
                    ctx.delay(ctx.adaptive_delay(200.0, size));
                } else {
                    remaining.push(input[i]);
                }
            }

            result = merge(&result, &sublist);
            input = remaining;

            let mut display = result.clone();
            display.extend_from_slice(&input);
            display.truncate(array.len());
            ctx.visual(&display, &[]);
            ctx.delay(ctx.adaptive_delay(200.0, size));
        }

        for i in 0..array.len() {
            array[i] = result[i];
        }

        ctx.play_sorted(&array);
        if !loop_ || ctx.stopped() {
            return;
        }
        ctx.delay(ctx.adaptive_delay(200.0, size));
    }
}
