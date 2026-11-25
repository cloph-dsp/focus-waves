use crate::audio::Wave;
use crate::engine::SortCtx;

// Ported from TypeScript: src/utils/audio/algorithms/radix.ts
#[allow(non_snake_case)]
pub fn generateRadixSort(ctx: &mut SortCtx, size: usize, loop_: bool) {
    while !ctx.stopped() {
        let mut array = ctx.random_array(size);
        let note_duration = ctx.adaptive_duration(0.0085, size);
        let audio_delay = ctx.adaptive_delay(40.0, size);

        let max = *array.iter().max().unwrap_or(&0);
        let mut exp: i64 = 1;
        while max / exp > 0 && !ctx.stopped() {
            counting_sort(ctx, &mut array, exp, size, note_duration, audio_delay);
            exp *= 10;
        }

        ctx.play_sorted(&array);
        if !loop_ || ctx.stopped() {
            return;
        }
        ctx.delay(ctx.adaptive_delay(200.0, size));
    }
}

fn counting_sort(
    ctx: &mut SortCtx,
    arr: &mut [i64],
    exp: i64,
    size: usize,
    note_duration: f32,
    audio_delay: u64,
) {
    let n = arr.len();
    let mut output = vec![0i64; n];
    let mut count = [0usize; 10];

    for &value in arr.iter() {
        let digit = ((value / exp) % 10) as usize;
        count[digit] += 1;
    }
    for i in 1..10 {
        count[i] += count[i - 1];
    }

    for i in (0..n).rev() {
        if ctx.stopped() {
            return;
        }
        let digit = ((arr[i] / exp) % 10) as usize;
        output[count[digit] - 1] = arr[i];
        ctx.play(
            ctx.freq(arr[i] as f64, size as f64),
            note_duration,
            Wave::Sine,
        );
        count[digit] -= 1;

        // TS merges `output` into a copy of `arr` for the visual; array values are
        // always >= 1, so 0 in `output` means "not yet written" (TS `undefined`).
        let mut temp = arr.to_vec();
        for j in 0..n {
            if output[j] != 0 {
                temp[j] = output[j];
            }
        }
        ctx.visual(&temp, &[i]);
        ctx.delay(audio_delay);
    }

    arr[..n].copy_from_slice(&output[..n]);
}
