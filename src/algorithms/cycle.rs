use crate::audio::Wave;
use crate::engine::SortCtx;

// Ported from TypeScript: src/utils/audio/algorithms/cycle.ts
#[allow(non_snake_case)]
pub fn generateCycleSort(ctx: &mut SortCtx, size: usize, loop_: bool) {
    while !ctx.stopped() {
        let mut array = ctx.random_array(size);
        let note_duration = ctx.adaptive_duration(0.008, size);
        let audio_delay = ctx.adaptive_delay(60.0, size);
        let n = array.len();

        if n > 1 {
            for cycle_start in 0..(n - 1) {
                if ctx.stopped() {
                    return;
                }
                let mut item = array[cycle_start];
                let mut pos = cycle_start;

                for i in (cycle_start + 1)..n {
                    if array[i] < item {
                        pos += 1;
                    }
                }
                if pos == cycle_start {
                    continue;
                }
                while pos < n && array[pos] == item {
                    pos += 1;
                }
                if pos >= n {
                    break;
                }

                let old = array[pos];
                array[pos] = item;
                item = old;
                ctx.play(ctx.freq(array[pos] as f64, size as f64), note_duration, Wave::Sine);
                ctx.visual(&array, &[cycle_start, pos]);
                ctx.delay(audio_delay);

                while pos != cycle_start && !ctx.stopped() {
                    pos = cycle_start;
                    for i in (cycle_start + 1)..n {
                        if array[i] < item {
                            pos += 1;
                        }
                    }
                    while pos < n && array[pos] == item {
                        pos += 1;
                    }
                    if pos >= n {
                        break;
                    }

                    let old = array[pos];
                    array[pos] = item;
                    item = old;
                    ctx.play(ctx.freq(array[pos] as f64, size as f64), note_duration, Wave::Sine);
                    ctx.visual(&array, &[pos]);
                    ctx.delay(audio_delay);
                }
            }
        }

        ctx.play_sorted(&array);
        if !loop_ || ctx.stopped() {
            return;
        }
        ctx.delay(ctx.adaptive_delay(200.0, size));
    }
}
