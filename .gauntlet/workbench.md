# Gauntlet workbench

## Loop A — GUI rebuild

- **Goal**: substantially rebuild the egui interface (not a polish pass) while keeping all 72 algorithms, search/category/size, Play/Stop/Shuffle, and the live visualizer working.
- **Bar**: REAPER 7 default dark theme, screenshot `evidence/reaper7_reference.jpg` (from reaper.fm homepage, 1000×450). Named, fetchable, comparable at the same viewport: judge which of two screenshots (labels stripped) looks more like a professional audio workstation — information density, transport clarity, panel hierarchy, restrained accent colour, legible small text.
- **Constraints**: eframe 0.37 / egui only, no new dependencies, working tree must keep `cargo check`, tests and release build green; app must still run and be playable.
- **Non-goals**: adding algorithms, changing audio synthesis, changing project scope.
- **Evidence**: `evidence/gui_before_fullscreen.png` (current app, maximized 1920×1080 full-screen capture), `evidence/gui_before.png` (window crop 1116×859), `evidence/gui_after_wave*.png`, reference above. Full-screen baseline is the primary A/B evidence; the app was restarted at pid 24392 for the capture (previous window collapsed after maximize).
- **Workstreams**: (1) shell/layout + palette, (2) visualizer rendering, (3) transport + interaction feedback.
- **Critic**: fresh-context `oracle`, sees only goal, bar, constraints, and the two images — never the builder's rationale. Verdict must be PASS/FAIL with inspected evidence, largest gap, next target.
- **Envelope**: at most 3 builder→critic waves; stop earlier on PASS or two waves with no material improvement.
- **Status**: PASS at wave 1 by independent fresh-context oracle (`ses_dec2417d0ffeo9VVr5a7BRGsou`), blind A/B: A = wave 1 rebuild (`wave1_A.png`), B = baseline (`wave1_B.png`). A judged clearly closer to REAPER 7 (three-panel workstation, dense browser/inspector/status, restrained teal accent) than B (sparse single-column dashboard). Remaining gap: no lower-third transport + channel-strip zone. Loop A stops on PASS.

## Loop B — Rust-native advantage

- **Goal**: evaluate and improve whether the implementation exploits Rust's particular strengths for this app (zero-cost abstraction, ownership/thread safety, no hidden allocation in the audio scheduling path, fast cancellation, compile-time verification).
- **Bar**: two measurable targets judged against the current implementation — `cargo clippy -- -D warnings` clean, and cancellation of any of the 72 algorithms at sizes 64/256 completes in <50 ms p99; plus code-level review by a fresh critic against the standard-library/rodio idioms actually available.
- **Constraints**: no new dependencies, no unsafe, no weakening of tests or correctness; `cargo test` must stay green.
- **Evidence**: clippy output, cancellation benchmark output, `cargo test` summary, relevant source files.
- **Workstreams**: (1) audio hot path + allocation audit, (2) thread/stop lifecycle + dispatch, (3) tests/benchmark harness.
- **Critic**: fresh-context `oracle`, separate from the builder, inspecting primary evidence only.
- **Envelope**: at most 3 waves; stop on PASS or two waves with no material improvement.
- **Status**: **PASS** at wave 1 by independent fresh-context oracle `ses_dec1acb9fffeLSfVB0alWjTcbI`, which re-ran clippy (exit 0, 0 warnings, down from 41) and inspected all evidence: 72 `start` lines per size, p99 10.65 ms (64) / 11.21 ms (256), `assert!(p99 < 50.0)` present, no new deps, zero `unsafe`, 3/3 tests + release build green. Largest remaining gap: sorts are cancelled after only 60 ms and final sortedness is not asserted; a full-run test per algorithm would be slow for bogo/stooge/slow. Loop B stops on PASS.

## Verdict history

| Loop | Wave | Builder | Critic | Verdict | Gap |
|---|---|---|---|---|---|
| A | 1 | designer `ses_dec33d9ceffemE6S7xvo4zJLPs` | oracle `ses_dec2417d0ffeo9VVr5a7BRGsou` (blind A/B) | **PASS** | No lower-third transport + channel-strip zone |
| B | 1 | lead + fixer `ses_dec22f71bffe7jgVgay0qPa3Qm` | oracle `ses_dec1acb9fffeLSfVB0alWjTcbI` | **PASS** | Full-run sortedness not asserted (60 ms cancellation-only exercise) |
