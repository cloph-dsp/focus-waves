use crate::audio::Wave;
use crate::engine::SortCtx;

// Ported from TypeScript: src/utils/audio/algorithms/pigeonhole.ts
#[allow(non_snake_case)]
pub fn generatePigeonholeSort(ctx: &mut SortCtx, size: usize, loop_: bool) {
    while !ctx.stopped() {
        let mut array = ctx.random_array(size);
        let note_duration = ctx.adaptive_duration(0.0085, size);

        let min = array.iter().copied().min().unwrap_or(0);
        let max = array.iter().copied().max().unwrap_or(0);
        let range = (max - min + 1) as usize;
        let mut holes: Vec<Vec<i64>> = vec![Vec::new(); range];

        for i in 0..array.len() {
            if ctx.stopped() {
                return;
            }
            holes[(array[i] - min) as usize].push(array[i]);
            ctx.play(
                ctx.freq(array[i] as f64, size as f64),
                note_duration,
                Wave::Sine,
            );
            ctx.visual(&array, &[i]);
            ctx.delay(ctx.adaptive_delay(45.0, size));
        }

        let mut index = 0usize;
        for hole in holes.iter() {
            if ctx.stopped() {
                return;
            }
            for &value in hole {
                if ctx.stopped() {
                    return;
                }
                array[index] = value;
                ctx.play(
                    ctx.freq(value as f64, size as f64),
                    note_duration,
                    Wave::Sine,
                );
                ctx.visual(&array, &[index]);
                ctx.delay(ctx.adaptive_delay(45.0, size));
                index += 1;
            }
        }

        ctx.play_sorted(&array);
        if !loop_ || ctx.stopped() {
            return;
        }
        ctx.delay(ctx.adaptive_delay(200.0, size));
    }
}
