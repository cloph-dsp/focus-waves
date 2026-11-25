use crate::audio::Wave;
use crate::engine::SortCtx;

fn three_way_partition(
    ctx: &mut SortCtx,
    arr: &mut [i64],
    low: isize,
    high: isize,
    size: usize,
    note_duration: f32,
    audio_delay: u64,
) {
    if ctx.stopped() || low >= high {
        return;
    }

    let pivot = arr[low as usize];
    let mut lt = low;
    let mut i = low + 1;
    let mut gt = high;

    while i <= gt {
        if ctx.stopped() {
            return;
        }
        if arr[i as usize] < pivot {
            arr.swap(lt as usize, i as usize);
            lt += 1;
            i += 1;
        } else if arr[i as usize] > pivot {
            arr.swap(i as usize, gt as usize);
            gt -= 1;
        } else {
            i += 1;
        }
        ctx.play(
            ctx.freq(arr[(i - 1) as usize] as f64, size as f64),
            note_duration,
            Wave::Sine,
        );
        ctx.visual(arr, &[(i - 1) as usize, lt as usize, gt as usize]);
        ctx.delay(audio_delay);
    }

    three_way_partition(ctx, arr, low, lt - 1, size, note_duration, audio_delay);
    three_way_partition(ctx, arr, gt + 1, high, size, note_duration, audio_delay);
}

// Ported from TypeScript: src/utils/audio/algorithms/3-way-quick.ts
#[allow(non_snake_case)]
pub fn generate3WayQuickSort(ctx: &mut SortCtx, size: usize, loop_: bool) {
    while !ctx.stopped() {
        let mut array = ctx.random_array(size);
        let note_duration = ctx.adaptive_duration(0.02, size);
        let audio_delay = ctx.adaptive_delay(45.0, size);

        three_way_partition(
            ctx,
            &mut array,
            0,
            size as isize - 1,
            size,
            note_duration,
            audio_delay,
        );
        ctx.play_sorted(&array);

        if !loop_ || ctx.stopped() {
            return;
        }
        ctx.delay(ctx.adaptive_delay(200.0, size));
    }
}
