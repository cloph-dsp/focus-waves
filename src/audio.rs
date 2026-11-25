use rodio::source::noise;
use rodio::source::{SawtoothWave, SineWave, Source, SquareWave, TriangleWave};
use rodio::{DeviceSinkBuilder, MixerDeviceSink, Player, SampleRate};
use std::sync::Arc;
use std::time::Duration;

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum Wave {
    Sine,
    Triangle,
    Saw,
    Square,
}

/// Owns the live audio output. The sink handle must stay alive for playback.
pub struct Audio {
    _handle: MixerDeviceSink,
    player: Arc<Player>,
    // Separate player so `clear()` on the tones never stops the ambient bed.
    ambient: Arc<Player>,
}

impl Audio {
    pub fn new() -> Result<Self, String> {
        let handle = DeviceSinkBuilder::open_default_sink()
            .map_err(|e| format!("could not open audio device: {e}"))?;
        let player = Arc::new(Player::connect_new(handle.mixer()));
        player.set_volume(0.85);

        let ambient = Arc::new(Player::connect_new(handle.mixer()));
        let rate = SampleRate::new(48_000).expect("sample rate must be non-zero");
        ambient.append(noise::Pink::new(rate).amplify(0.012));
        ambient.set_volume(0.55);
        ambient.play();

        Ok(Self {
            _handle: handle,
            player,
            ambient,
        })
    }

    pub fn set_volume(&self, value: f32) {
        self.player.set_volume(value);
    }

    /// Quiet pink-noise bed, independent of the tone player.
    pub fn set_ambient(&self, enabled: bool) {
        self.ambient
            .set_volume(if enabled { 0.55 } else { 0.0 });
    }

    pub fn clear(&self) {
        self.player.clear();
    }

    /// Append one short tone. `offset` delays the start, `gain` is linear amplitude.
    pub fn play(&self, freq: f32, duration: f32, wave: Wave, offset: f32, gain: f32) {
        let duration = duration.clamp(0.002, 2.0);
        let attack = (duration * 0.2).clamp(0.0014, 0.007);
        let release = (duration * 0.65).clamp(0.012, 0.05);
        match wave {
            Wave::Sine => self.append_tone(SineWave::new(freq), duration, attack, release, gain, offset),
            Wave::Triangle => self.append_tone(TriangleWave::new(freq), duration, attack, release, gain, offset),
            Wave::Saw => self.append_tone(SawtoothWave::new(freq), duration, attack, release, gain, offset),
            Wave::Square => self.append_tone(SquareWave::new(freq), duration, attack, release, gain, offset),
        }
    }

    /// Append a concrete source: rodio boxes it once internally, so we avoid
    /// allocating a second trait object in the tone hot path.
    fn append_tone<S>(
        &self,
        source: S,
        duration: f32,
        attack: f32,
        release: f32,
        gain: f32,
        offset: f32,
    ) where
        S: Source<Item = f32> + Send + 'static,
    {
        let source = source
            .take_duration(Duration::from_secs_f32(duration))
            .fade_in(Duration::from_secs_f32(attack))
            .fade_out(Duration::from_secs_f32(release))
            .amplify(gain)
            .delay(Duration::from_secs_f32(offset.max(0.0)));
        self.player.append(source);
        // `Player::clear()` pauses the player; appending alone never resumes it.
        self.player.play();
    }
}
