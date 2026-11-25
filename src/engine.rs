use crate::algorithms;
use crate::audio::{Audio, Wave};
use rand::RngExt;
use std::cell::Cell;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{mpsc, Arc};
use std::thread::{self, JoinHandle};
use std::time::{Duration, Instant};

/// One visual frame sent from the sorting thread to the UI thread.
pub struct VisualEvent {
    pub values: Vec<i64>,
    pub highlights: Vec<usize>,
}

/// API given to every ported sorting algorithm. It mirrors `engine.ts`:
/// `play` ↔ `playTone`, `delay` ↔ `delay`, `visual` ↔ `visualCallback`, etc.
pub struct SortCtx {
    pub size: usize,
    stop: Arc<AtomicBool>,
    audio: Arc<Audio>,
    visual_tx: mpsc::Sender<VisualEvent>,
    gain_scalar: f32,
    last_visual: Cell<Instant>,
}

impl SortCtx {
    pub fn new(
        size: usize,
        stop: Arc<AtomicBool>,
        audio: Arc<Audio>,
        visual_tx: mpsc::Sender<VisualEvent>,
    ) -> Self {
        let mut ctx = Self {
            size,
            stop,
            audio,
            visual_tx,
            gain_scalar: 1.0,
            last_visual: Cell::new(Instant::now() - Duration::from_millis(16)),
        };
        ctx.configure(size);
        ctx
    }

    /// `configureAudioScene({ sampleSize })` — lowers volume/peak for big arrays.
    pub fn configure(&mut self, size: usize) {
        self.gain_scalar = if size > 4096 {
            0.45
        } else if size > 2048 {
            0.5
        } else if size > 1024 {
            0.6
        } else if size > 512 {
            0.75
        } else if size > 256 {
            0.85
        } else {
            1.0
        };
        self.audio
            .set_volume((0.62 + self.gain_scalar * 0.32).min(0.88));
    }

    /// `activeLoop.stop` — every loop in a ported algorithm should check this.
    pub fn stopped(&self) -> bool {
        self.stop.load(Ordering::Relaxed)
    }

    /// `playTone(frequency, duration, now, wave)`.
    pub fn play(&self, frequency: f32, duration: f32, wave: Wave) {
        if self.stopped() {
            return;
        }
        let peak = if wave == Wave::Sine { 0.40 } else { 0.34 };
        self.audio
            .play(frequency, duration, wave, 0.0, (peak * self.gain_scalar).min(0.5));
    }

    /// `playTone(frequency, duration, now + offset, wave)`.
    pub fn play_after(&self, offset: f32, frequency: f32, duration: f32, wave: Wave) {
        if self.stopped() {
            return;
        }
        let peak = if wave == Wave::Sine { 0.40 } else { 0.34 };
        self.audio.play(
            frequency,
            duration,
            wave,
            offset,
            (peak * self.gain_scalar).min(0.5),
        );
    }

    /// `valueToFrequency(value, maxValue)` — logarithmic 220 Hz … 1760 Hz.
    pub fn freq(&self, value: f64, max: f64) -> f32 {
        let max = max.max(1.0);
        let normalized = (value / max).clamp(0.0, 1.0);
        (220.0 * 2.0_f64.powf(8.0 * normalized)) as f32
    }

    /// `delay(ms)` — cancellable sleep in small slices.
    pub fn delay(&self, ms: u64) {
        let mut remaining = ms;
        while remaining > 0 && !self.stopped() {
            let slice = remaining.min(10);
            thread::sleep(Duration::from_millis(slice));
            remaining -= slice;
        }
    }

    /// `nonBlockingCallback([...array], [indices])`.
    /// shortcut: capped at 60 frames/s, so intermediate events are dropped;
    /// upgrade to a reusable buffer pool if per-frame cloning shows up in a profile.
    pub fn visual(&self, array: &[i64], highlights: &[usize]) {
        let now = Instant::now();
        if now.duration_since(self.last_visual.get()) < Duration::from_millis(16) {
            return;
        }
        self.last_visual.set(now);
        let _ = self.visual_tx.send(VisualEvent {
            values: array.to_vec(),
            highlights: highlights.to_vec(),
        });
    }

    /// `generateUniqueRandomArray(size)` — a shuffled 1..=size.
    pub fn random_array(&self, size: usize) -> Vec<i64> {
        let mut array: Vec<i64> = (1..=size as i64).collect();
        let mut rng = rand::rng();
        for i in (1..array.len()).rev() {
            let j = rng.random_range(0..=i);
            array.swap(i, j);
        }
        array
    }

    /// `getAdaptiveDelay(baseDelay, sampleSize)`.
    pub fn adaptive_delay(&self, base: f64, size: usize) -> u64 {
        let value = if size <= 32 {
            (base * 0.5).max(25.0)
        } else if size <= 64 {
            (base * 0.45).max(20.0)
        } else if size <= 128 {
            (base * 0.35).max(16.0)
        } else if size <= 256 {
            (base * 0.25).max(12.0)
        } else {
            (base * 0.2).max(10.0)
        };
        value.round() as u64
    }

    /// `getAdaptiveNoteDuration(baseDuration, sampleSize)`.
    pub fn adaptive_duration(&self, _base: f64, size: usize) -> f32 {
        match size {
            0..=32 => 0.018,
            33..=64 => 0.015,
            65..=128 => 0.012,
            129..=256 => 0.010,
            257..=512 => 0.0095,
            513..=1024 => 0.009,
            _ => 0.0085,
        }
    }

    /// `playSortedArray(array, size, callback)`.
    pub fn play_sorted(&self, array: &[i64]) {
        let note_duration = self.adaptive_duration(0.004, self.size);
        let audio_delay = self.adaptive_delay(25.0, self.size);
        for (i, value) in array.iter().enumerate() {
            if self.stopped() {
                return;
            }
            self.play(self.freq(*value as f64, self.size as f64), note_duration, Wave::Sine);
            self.visual(array, &[i]);
            self.delay(audio_delay);
        }
        self.delay(self.adaptive_delay(150.0, self.size));
    }
}

/// Runs one algorithm on a background thread and forwards visual frames.
pub struct Runner {
    audio: Arc<Audio>,
    stop: Arc<AtomicBool>,
    tx: mpsc::Sender<VisualEvent>,
    handle: Option<JoinHandle<()>>,
}

impl Runner {
    pub fn new(audio: Arc<Audio>, tx: mpsc::Sender<VisualEvent>) -> Self {
        Self {
            audio,
            stop: Arc::new(AtomicBool::new(false)),
            tx,
            handle: None,
        }
    }

    pub fn is_playing(&mut self) -> bool {
        if self
            .handle
            .as_ref()
            .is_some_and(|handle| handle.is_finished())
            && let Some(handle) = self.handle.take()
        {
            let _ = handle.join();
        }
        self.handle.is_some()
    }

    pub fn start(&mut self, id: &str, size: usize) -> bool {
        self.start_with(id, size, true)
    }

    /// One full pass (sort + final sweep), then the thread exits.
    pub fn start_once(&mut self, id: &str, size: usize) -> bool {
        self.start_with(id, size, false)
    }

    fn start_with(&mut self, id: &str, size: usize, loop_: bool) -> bool {
        self.stop();
        if !crate::catalog::SORTING_ALGORITHMS.iter().any(|a| a.id == id) {
            return false;
        }
        let stop = Arc::clone(&self.stop);
        let audio = Arc::clone(&self.audio);
        let tx = self.tx.clone();
        let id = id.to_string();
        self.handle = Some(thread::spawn(move || {
            let mut ctx = SortCtx::new(size, stop, audio, tx);
            algorithms::run(&id, &mut ctx, size, loop_);
        }));
        true
    }

    pub fn stop(&mut self) {
        self.stop.store(true, Ordering::Relaxed);
        if let Some(handle) = self.handle.take() {
            let _ = handle.join();
        }
        self.audio.clear();
        self.stop.store(false, Ordering::Relaxed);
    }
}

#[cfg(test)]
mod cancellation_bench {
    use super::*;
    use std::time::Instant;

    #[test]
    #[ignore = "requires an audio device; measures join latency for every algorithm"]
    fn cancellation_latency() {
        let audio = Arc::new(Audio::new().expect("audio device required"));
        audio.set_volume(0.0);
        let (tx, _rx) = mpsc::channel();
        let mut runner = Runner::new(audio, tx);

        for &size in &[64usize, 256] {
            let mut times = Vec::new();
            for algorithm in crate::catalog::SORTING_ALGORITHMS {
                println!("start {} size={size}", algorithm.id);
                use std::io::Write;
                std::io::stdout().flush().ok();
                assert!(runner.start(algorithm.id, size), "{}", algorithm.id);
                thread::sleep(Duration::from_millis(60));
                let started = Instant::now();
                runner.stop();
                times.push(started.elapsed().as_secs_f64() * 1000.0);
            }
            times.sort_by(f64::total_cmp);
            let p99 = times[times.len() * 99 / 100];
            println!(
                "size={size} p99={p99:.2}ms max={:.2}ms",
                times.last().unwrap()
            );
            assert!(p99 < 50.0, "cancellation p99 too slow at size {size}");
        }
    }
}
