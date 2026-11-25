use crate::audio::Wave;
use crate::engine::SortCtx;

// Ported from TypeScript: src/utils/audio/algorithms/stalin.ts
#[allow(non_snake_case)]
pub fn generateStalinSort(ctx: &mut SortCtx, size: usize, loop_: bool) {
    while !ctx.stopped() {
        let all = ctx.random_array(size);
        let note_duration = ctx.adaptive_duration(0.0075, size);
        let mut result: Vec<i64> = Vec::new();

        if let Some(&first) = all.first() {
            result.push(first);
            ctx.play(ctx.freq(first as f64, size as f64), note_duration, Wave::Sine);
        }
        for &value in all.iter().skip(1) {
            if ctx.stopped() {
                return;
            }
            if value >= result[result.len() - 1] {
                result.push(value);
                ctx.play(ctx.freq(value as f64, size as f64), note_duration, Wave::Sine);
                ctx.visual(&result, &[result.len() - 1]);
                ctx.delay(ctx.adaptive_delay(200.0, size));
            } else {
                ctx.play(
                    ctx.freq(value as f64, size as f64) * 0.5,
                    note_duration * 0.5,
                    Wave::Sine,
                );
                ctx.delay(ctx.adaptive_delay(45.0, size));
            }
        }

        let array = result;
        ctx.play_sorted(&array);
        if !loop_ || ctx.stopped() {
            return;
        }
        ctx.delay(ctx.adaptive_delay(200.0, size));
    }
}
