use crate::audio::Wave;
use crate::engine::SortCtx;

// Ported from TypeScript: src/utils/audio/algorithms/library.ts
#[allow(non_snake_case)]
pub fn generateLibrarySort(ctx: &mut SortCtx, size: usize, loop_: bool) {
    while !ctx.stopped() {
        let mut array = ctx.random_array(size);
        let note_duration = ctx.adaptive_duration(0.0075, size);

        // epsilon = 1 -> the library has room for twice as many slots as values.
        let mut lib: Vec<Option<i64>> = vec![None; array.len() * 2];
        let mut lib_size = 0usize;
        if let Some(&first) = array.first() {
            lib[0] = Some(first);
            lib_size = 1;
        }

        for i in 1..array.len() {
            if ctx.stopped() {
                return;
            }
            let mut pos = 0usize;
            for (j, &value) in lib.iter().take(lib_size).enumerate() {
                if value.is_some_and(|v| v < array[i]) {
                    pos = j + 1;
                }
            }

            let mut j = lib_size;
            while j > pos && !ctx.stopped() {
                lib[j] = lib[j - 1];
                j -= 1;
            }
            lib[pos] = Some(array[i]);
            ctx.play(
                ctx.freq(array[i] as f64, size as f64),
                note_duration,
                Wave::Sine,
            );

            let display: Vec<i64> = lib.iter().filter_map(|&x| x).take(array.len()).collect();
            ctx.visual(&display, &[pos]);
            ctx.delay(ctx.adaptive_delay(200.0, size));
            lib_size += 1;
        }

        let sorted: Vec<i64> = lib.iter().filter_map(|&x| x).collect();
        let n = array.len();
        array[..n].copy_from_slice(&sorted[..n]);

        ctx.play_sorted(&array);
        if !loop_ || ctx.stopped() {
            return;
        }
        ctx.delay(ctx.adaptive_delay(200.0, size));
    }
}
