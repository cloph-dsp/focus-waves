# Focus Waves (Rust)

A native desktop sonification of 72 distinct sorting algorithms, ported from
[cloph-dsp/focus-waves](https://github.com/cloph-dsp/focus-waves) to Rust.

Each algorithm repeatedly shuffles an array, sorts it while playing a short tone for every
comparison or swap, plays the finished array as an ascending sweep, then pauses and starts
over. The pitch maps logarithmically from 220 Hz to 1760 Hz, so the sort is both visible and
audible.

## Run

```bash
cargo run --release
```

Requires a working default audio output device. The UI is built with `egui`/`eframe` and
audio with `rodio`.

## Controls

- **Search / category** — filter the algorithm list (100 entries).
- **Sample size** — 16…4096 values (default 64). Larger arrays automatically lower the
  volume and shorten notes.
- **Play / Stop / Shuffle** — start, cancel, or play one full pass of random algorithms in
  sequence. Visualization shows up to 512 bars, bucketed down from larger arrays; active
  indices are highlighted.
- **Ambient** — toggle a quiet pink-noise bed underneath the sort tones (on by default),
  for background listening. Pitches and timings are unchanged.

## Layout

- `src/catalog.rs` — algorithm metadata, mechanically converted from the original TS catalog.
- `src/algorithms/` — one file per algorithm; `mod.rs` dispatches by catalog id.
- `src/engine.rs` — `SortCtx` (the porting API) and the background `Runner`.
- `src/audio.rs` — rodio waveform playback.
- `src/app.rs` — egui interface.

## Porting notes

`CONTRACT.md` documents the mapping between the original TypeScript engine helpers and
`SortCtx`. Every port keeps the same wave choice, delay constants and highlight indices as
the original, but uses `std::thread::sleep` in cancelable slices instead of `await delay`.
