use rodio::source::{SawtoothWave, SineWave, Source, SquareWave, TriangleWave};
use rodio::{DeviceSinkBuilder, MixerDeviceSink, Player};
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
}

impl Audio {
    pub fn new() -> Result<Self, String> {
        let handle = DeviceSinkBuilder::open_default_sink()
            .map_err(|e| format!("could not open audio device: {e}"))?;
        let player = Arc::new(Player::connect_new(&handle.mixer()));
        player.set_volume(0.85);
        Ok(Self {
            _handle: handle,
            player,
        })
    }

    pub fn player(&self) -> Arc<Player> {
        Arc::clone(&self.player)
    }

    pub fn set_volume(&self, value: f32) {
        self.player.set_volume(value);
    }

    pub fn clear(&self) {
        self.player.clear();
    }

    /// Append one short tone. `offset` delays the start, `gain` is linear amplitude.
    pub fn play(&self, freq: f32, duration: f32, wave: Wave, offset: f32, gain: f32) {
        let duration = duration.clamp(0.002, 2.0);
        let attack = (duration * 0.2).clamp(0.0014, 0.007);
        let release = (duration * 0.65).clamp(0.012, 0.05);
        let source: Box<dyn Source<Item = f32> + Send> = match wave {
            Wave::Sine => Box::new(SineWave::new(freq)),
            Wave::Triangle => Box::new(TriangleWave::new(freq)),
            Wave::Saw => Box::new(SawtoothWave::new(freq)),
            Wave::Square => Box::new(SquareWave::new(freq)),
        };
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
