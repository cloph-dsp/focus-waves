# Porting contract (algorithm agents)

Reference TS: `C:\Users\pedro\AppData\Local\Temp\opencode\focus-waves-ref\src\utils\audio\algorithms\<name>.ts`
Rust target: `src/algorithms/<name>.rs` (same base name). The stub function name is fixed; keep it.

Each target file owns exactly one algorithm. Only edit your assigned files. Do not touch
`mod.rs`, `engine.rs`, `audio.rs`, `catalog.rs`, `app.rs`, `main.rs` or `Cargo.toml`.

## API

At the top of each file:

```rust
use crate::audio::Wave;
use crate::engine::SortCtx;
```

`SortCtx` methods (mirror of `engine.ts`):

| Rust | TypeScript |
|---|---|
| `ctx.stopped() -> bool` | `activeLoop.stop` |
| `ctx.size`, `ctx.loop_` | `size`, `loop` |
| `ctx.random_array(size) -> Vec<i64>` | `generateUniqueRandomArray(size)` |
| `ctx.play(freq, dur, wave)` | `playTone(freq, dur, now, wave)` |
| `ctx.play_after(offset, freq, dur, wave)` | `playTone(freq, dur, now + offset, wave)` |
| `ctx.freq(value as f64, size as f64) -> f32` | `valueToFrequency(value, size)` |
| `ctx.delay(ms: u64)` | `await delay(ms)` |
| `ctx.visual(&array, &[i, j])` | `visualCallback([...array], [i, j])` |
| `ctx.adaptive_delay(base: f64, size: usize) -> u64` | `getAdaptiveDelay(base, size)` |
| `ctx.adaptive_duration(base: f64, size: usize) -> f32` | `getAdaptiveNoteDuration(base, size)` |
| `ctx.play_sorted(&array)` | `playSortedArray(array, size, callback)` |

`Wave` variants: `Wave::Sine`, `Wave::Triangle`, `Wave::Saw`, `Wave::Square`.

Use `f64` `ctx.freq(value as f64, size as f64)`. `ctx.delay()` takes integer milliseconds,
so cast/round floats: `ctx.delay(ms as u64)`. `ctx.visual()` takes `&[i64]` and `&[usize]`.
Values are `i64`, indices are `usize`.

## Required shape

Port the TS logic faithfully: same algorithm, same wave choices, same delay values, same
highlights. Preserve the infinite loop (`while !ctx.stopped()`), reshuffle each pass, and
exit early on `ctx.stopped()` inside inner loops. Finish each pass with `ctx.play_sorted(&array)`
and, when `loop_` is true, a pause `ctx.delay(ctx.adaptive_delay(200.0, size))`.

Example (`bubble.ts`):

```rust
use crate::audio::Wave;
use crate::engine::SortCtx;

pub fn generateBubbleSort(ctx: &mut SortCtx, size: usize, loop_: bool) {
    while !ctx.stopped() {
        let mut array = ctx.random_array(size);
        let note_duration = ctx.adaptive_duration(0.003, size);
        let audio_delay = ctx.adaptive_delay(30.0, size);
        for i in 0..array.len() {
            if ctx.stopped() { return; }
            for j in 0..array.len().saturating_sub(i + 1) {
                if ctx.stopped() { return; }
                if array[j] > array[j + 1] {
                    array.swap(j, j + 1);
                    ctx.play(ctx.freq(array[j] as f64, size as f64), note_duration, Wave::Triangle);
                    ctx.play_after(note_duration / 2.0, ctx.freq(array[j + 1] as f64, size as f64), note_duration, Wave::Triangle);
                    ctx.visual(&array, &[j, j + 1]);
                    ctx.delay(audio_delay);
                }
            }
        }
        ctx.play_sorted(&array);
        if !loop_ || ctx.stopped() { return; }
        ctx.delay(ctx.adaptive_delay(200.0, size));
    }
}
```

For algorithms whose TS imports helpers from `factories.ts` (`createSimpleSortGenerator`,
etc.), inline the equivalent behavior using the API above. If a TS algorithm uses
data structures with no direct Rust equivalent (e.g. tree nodes), implement a faithful
array-based version that still sonifies comparisons/swaps with the same wave choices.
Never leave a `TODO` or an empty body.

## Validation

Keep code idiomatic Rust, no external crates. `i64` values, `usize` indices. Avoid
unnecessary clones in hot loops. `cargo check` will be run centrally after all agents finish.
