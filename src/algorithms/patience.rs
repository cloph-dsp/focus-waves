use crate::audio::Wave;
use crate::engine::SortCtx;

// Ported from TypeScript: src/utils/audio/algorithms/patience.ts
#[allow(non_snake_case)]
pub fn generatePatienceSort(ctx: &mut SortCtx, size: usize, loop_: bool) {
    while !ctx.stopped() {
        let mut array = ctx.random_array(size);
        let note_duration = ctx.adaptive_duration(0.0085, size);
        let mut piles: Vec<Vec<i64>> = Vec::new();

        for i in 0..array.len() {
            if ctx.stopped() {
                return;
            }
            let mut placed = false;
            for pile in piles.iter_mut() {
                if ctx.stopped() {
                    return;
                }
                let top = *pile.last().unwrap();
                if top >= array[i] {
                    pile.push(array[i]);
                    ctx.play(
                        ctx.freq(array[i] as f64, size as f64),
                        note_duration,
                        Wave::Sine,
                    );
                    placed = true;
                    ctx.visual(&array, &[i]);
                    ctx.delay(ctx.adaptive_delay(45.0, size));
                    break;
                }
            }
            if !placed {
                piles.push(vec![array[i]]);
                ctx.play(
                    ctx.freq(array[i] as f64, size as f64),
                    note_duration * 1.2,
                    Wave::Sine,
                );
                ctx.visual(&array, &[i]);
                ctx.delay(ctx.adaptive_delay(45.0, size));
            }
        }

        let mut index = 0usize;
        while piles.iter().any(|p| !p.is_empty()) && !ctx.stopped() {
            let mut min_pile: Option<usize> = None;
            let mut min_value = i64::MAX;
            for (i, pile) in piles.iter().enumerate() {
                if let Some(&v) = pile.last() {
                    if v < min_value {
                        min_value = v;
                        min_pile = Some(i);
                    }
                }
            }
            let Some(min_pile) = min_pile else {
                break;
            };
            let value = piles[min_pile].pop().unwrap();
            array[index] = value;
            index += 1;
            ctx.play(
                ctx.freq(value as f64, size as f64),
                note_duration,
                Wave::Sine,
            );
            ctx.visual(&array, &[index - 1]);
            ctx.delay(ctx.adaptive_delay(45.0, size));
        }

        ctx.play_sorted(&array);
        if !loop_ || ctx.stopped() {
            return;
        }
        ctx.delay(ctx.adaptive_delay(200.0, size));
    }
}
