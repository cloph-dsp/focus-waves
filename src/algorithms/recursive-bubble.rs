use crate::audio::Wave;
use crate::engine::SortCtx;

// Ported from TypeScript: src/utils/audio/algorithms/recursive-bubble.ts
#[allow(non_snake_case)]
pub fn generateRecursiveBubbleSort(ctx: &mut SortCtx, size: usize, loop_: bool) {
    while !ctx.stopped() {
        let mut array = ctx.random_array(size);
        let note_duration = ctx.adaptive_duration(0.008, size);
        let audio_delay = ctx.adaptive_delay(45.0, size);

        let n = array.len();
        recursive_bubble(ctx, &mut array, n, size, note_duration, audio_delay);

        ctx.play_sorted(&array);
        if !loop_ || ctx.stopped() {
            return;
        }
        ctx.delay(ctx.adaptive_delay(200.0, size));
    }
}

fn recursive_bubble(
    ctx: &mut SortCtx,
    arr: &mut [i64],
    n: usize,
    size: usize,
    note_duration: f32,
    audio_delay: u64,
) {
    if n <= 1 || ctx.stopped() {
        return;
    }
    for i in 0..n - 1 {
        if ctx.stopped() {
            return;
        }
        if arr[i] > arr[i + 1] {
            arr.swap(i, i + 1);
            ctx.play(
                ctx.freq(arr[i] as f64, size as f64),
                note_duration,
                Wave::Sine,
            );
            ctx.visual(arr, &[i, i + 1]);
            ctx.delay(audio_delay);
        }
    }
    recursive_bubble(ctx, arr, n - 1, size, note_duration, audio_delay);
}
