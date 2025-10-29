import { VisualCallback } from "./types";

let audioContext: AudioContext | null = null;
export let activeLoop: { stop: boolean } = { stop: false };
let activeOscillators: { oscillator: OscillatorNode; gainNode: GainNode; panner?: StereoPannerNode }[] = [];
let compressor: DynamicsCompressorNode | null = null;
let runGain: GainNode | null = null;
let cleanupTimeout: ReturnType<typeof setTimeout> | null = null;

const SCHEDULER_LOOKAHEAD_S = 0.09;
const SCHEDULER_INTERVAL_MS = 15;
const MIN_START_OFFSET_S = 0.024;

type ScheduledTone = {
  frequency: number;
  duration: number;
  startTime: number;
  waveType: OscillatorType;
  pan?: number;
};

let scheduledTones: ScheduledTone[] = [];
let schedulerHandle: ReturnType<typeof setTimeout> | null = null;

const ROOM_IMPULSE_CACHE = new WeakMap<AudioContext, AudioBuffer>();
let toneGainScalar = 1;

const getTargetMixGain = () => Math.min(0.88, 0.62 + toneGainScalar * 0.32);

const getCompressorSettings = () => {
  const intensity = 1 - toneGainScalar;
  return {
    threshold: -28 + intensity * 9,
    knee: 28 + intensity * 6,
    ratio: 1.25 + intensity * 0.45,
    attack: 0.01 + intensity * 0.01,
    release: 0.38 + intensity * 0.08,
  };
};

const applyCompressorProfile = (node: DynamicsCompressorNode) => {
  const { threshold, knee, ratio, attack, release } = getCompressorSettings();
  node.threshold.value = threshold;
  node.knee.value = knee;
  node.ratio.value = ratio;
  node.attack.value = attack;
  node.release.value = release;
};

const NODE_STORE = globalThis as Record<string, unknown>;

let audioStressLevel = 0;
let lastStressSampleTime = 0;
const AUDIO_STRESS_DECAY_PER_SECOND = 0.55;

export const getAudioContext = () => {
  if (!audioContext) {
    audioContext = new AudioContext();
  }
  return audioContext;
};

const getRoomImpulse = (ctx: AudioContext): AudioBuffer => {
  const cached = ROOM_IMPULSE_CACHE.get(ctx);
  if (cached) {
    return cached;
  }

  const duration = 0.12;
  const length = Math.floor(ctx.sampleRate * duration);
  const impulse = ctx.createBuffer(2, length, ctx.sampleRate);

  for (let channel = 0; channel < impulse.numberOfChannels; channel++) {
    const data = impulse.getChannelData(channel);
    for (let i = 0; i < length; i++) {
      const decay = Math.pow(1 - i / length, 1.8);
      data[i] = (Math.random() * 2 - 1) * decay * 0.12;
    }
  }

  ROOM_IMPULSE_CACHE.set(ctx, impulse);
  return impulse;
};

const ensureGlobalNode = <T extends AudioNode>(key: string, ctx: AudioContext, factory: () => T): T => {
  const existing = NODE_STORE[key] as T | undefined;
  if (existing && existing.context === ctx) {
    return existing;
  }

  if (existing) {
    try {
      existing.disconnect();
    } catch {
      // node may already be disconnected or closing; ignore
    }
  }

  const node = factory();
  NODE_STORE[key] = node;
  return node;
};

const ensureGlobalGain = (key: string, ctx: AudioContext, gainValue: number): GainNode => {
  const gain = ensureGlobalNode(key, ctx, () => ctx.createGain());
  gain.gain.value = gainValue;
  return gain;
};

const ensureOutputChain = () => {
  const ctx = getAudioContext();

  if (ctx.state === "suspended") {
    void ctx.resume().catch(() => {
      // unable to resume without user gesture
    });
  }

  if (compressor && compressor.context !== ctx) {
    try {
      compressor.disconnect();
    } catch {
      // no-op
    }
    compressor = null;
  }

  if (runGain && runGain.context !== ctx) {
    try {
      runGain.disconnect();
    } catch {
      // no-op
    }
    runGain = null;
  }

  if (activeOscillators.some(({ oscillator }) => oscillator.context !== ctx)) {
    activeOscillators.forEach(({ oscillator, gainNode, panner }) => {
      try {
        gainNode.disconnect();
      } catch {
        // ignore disconnect issues on context swap
      }
      try {
        if (panner) {
          try {
            panner.disconnect();
          } catch {
            // already disconnected
          }
        }
        oscillator.stop();
      } catch {
        // oscillator already stopped or context closed
      }
    });
    activeOscillators = [];
  }

  const highpass = ensureGlobalNode("__hpf", ctx, () => {
    const hpf = ctx.createBiquadFilter();
    hpf.type = "highpass";
    hpf.frequency.value = 30;
    hpf.Q.value = 0.707;
    return hpf;
  }) as BiquadFilterNode;
  highpass.type = "highpass";
  highpass.frequency.value = 30;
  highpass.Q.value = 0.707;

  if (!compressor) {
    compressor = ctx.createDynamicsCompressor();
  }
  applyCompressorProfile(compressor);

  const convolver = ensureGlobalNode("__roomVerb", ctx, () => {
    const node = ctx.createConvolver();
    node.normalize = false;
    node.buffer = getRoomImpulse(ctx);
    return node;
  }) as ConvolverNode;
  if (!convolver.buffer || convolver.buffer.sampleRate !== ctx.sampleRate) {
    convolver.buffer = getRoomImpulse(ctx);
  }

  const wetGain = ensureGlobalGain("__roomVerbWet", ctx, 0.14);
  const dryGain = ensureGlobalGain("__roomVerbDry", ctx, 0.92);

  if (compressor?.numberOfOutputs) {
    try {
      compressor.disconnect();
    } catch {
      // no-op
    }
    compressor.connect(dryGain);
    compressor.connect(wetGain);
  }

  try {
    wetGain.disconnect();
  } catch {
    // no-op
  }
  wetGain.connect(convolver);

  try {
    convolver.disconnect();
  } catch {
    // no-op
  }
  convolver.connect(highpass);

  try {
    dryGain.disconnect();
  } catch {
    // no-op
  }
  dryGain.connect(highpass);

  const makeupGain = ensureGlobalGain("__makeupGain", ctx, 2.8);

  if (!runGain) {
    runGain = ctx.createGain();
    runGain.gain.value = 0.85;
    runGain.connect(compressor);
  }

  if (highpass.numberOfOutputs && highpass.context) {
    try {
      highpass.disconnect();
    } catch {
      // no-op
    }
    highpass.connect(makeupGain);
  }

  try {
    makeupGain.disconnect();
  } catch {
    // no-op
  }
  makeupGain.connect(ctx.destination);

  return { ctx, output: runGain };
};

const stopSchedulerIfIdle = () => {
  if (!scheduledTones.length && schedulerHandle !== null) {
    clearTimeout(schedulerHandle);
    schedulerHandle = null;
  }
};

const clearScheduledTones = () => {
  if (schedulerHandle !== null) {
    clearTimeout(schedulerHandle);
    schedulerHandle = null;
  }
  scheduledTones = [];
};

const updateAudioStress = (ctx: AudioContext, startLead: number) => {
  const now = ctx.currentTime;
  if (lastStressSampleTime) {
    const elapsed = now - lastStressSampleTime;
    if (elapsed > 0) {
      audioStressLevel = Math.max(0, audioStressLevel - elapsed * AUDIO_STRESS_DECAY_PER_SECOND);
    }
  }

  lastStressSampleTime = now;

  if (startLead < MIN_START_OFFSET_S * 0.65) {
    const deficit = MIN_START_OFFSET_S * 0.65 - startLead;
    audioStressLevel = Math.min(1, audioStressLevel + deficit * 28);
  }

  if (scheduledTones.length > 48) {
    audioStressLevel = Math.min(1, audioStressLevel + 0.2);
  } else if (scheduledTones.length > 24) {
    audioStressLevel = Math.min(1, audioStressLevel + 0.08);
  }
};

const startScheduledTone = (tone: ScheduledTone, ctx: AudioContext, output: GainNode) => {
  if (activeLoop.stop) return;

  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();
  let panner: StereoPannerNode | null = null;

  oscillator.connect(gainNode);

  if (typeof ctx.createStereoPanner === "function") {
    try {
      panner = ctx.createStereoPanner();
      panner.pan.value = tone.pan ?? 0;
      gainNode.connect(panner);
      panner.connect(output);
    } catch {
      gainNode.connect(output);
      panner = null;
    }
  } else {
    gainNode.connect(output);
  }

  oscillator.frequency.value = tone.frequency;
  oscillator.type = tone.waveType;

  const attackTime = Math.min(0.007, Math.max(0.0014, tone.duration * 0.3));
  const releaseHoldOffset = Math.min(0.01, tone.duration * 0.45);
  const minReleaseTime = 0.014;
  const maxReleaseTime = 0.05;
  const releaseTime = Math.min(maxReleaseTime, Math.max(minReleaseTime, tone.duration * 0.82));
  const releaseStart = Math.max(
    tone.startTime + attackTime + 0.0008,
    tone.startTime + tone.duration - releaseHoldOffset,
  );
  const releaseEnd = releaseStart + releaseTime;
  const peakGainBase = tone.waveType === "sine" ? 0.4 : 0.34;
  const peakGain = Math.min(0.5, peakGainBase * toneGainScalar);

  gainNode.gain.cancelScheduledValues(tone.startTime);
  gainNode.gain.setValueAtTime(0, tone.startTime);
  gainNode.gain.linearRampToValueAtTime(peakGain, tone.startTime + attackTime);
  const sustainTime = Math.max(tone.startTime + attackTime, releaseStart - 0.001);
  gainNode.gain.setValueAtTime(peakGain, sustainTime);
  gainNode.gain.setValueAtTime(peakGain * 0.96, releaseStart);
  const midRelease = releaseStart + Math.min(releaseTime * 0.65, 0.018);
  gainNode.gain.exponentialRampToValueAtTime(0.0008, midRelease);
  gainNode.gain.linearRampToValueAtTime(0.0001, releaseEnd);
  gainNode.gain.setTargetAtTime(0, releaseEnd, 0.0045);
  gainNode.gain.setValueAtTime(0, releaseEnd + 0.004);

  oscillator.start(tone.startTime);
  oscillator.stop(releaseEnd + 0.006);

  const startLead = tone.startTime - ctx.currentTime;
  updateAudioStress(ctx, startLead);

  activeOscillators.push({ oscillator, gainNode, panner: panner ?? undefined });

  oscillator.onended = () => {
    const index = activeOscillators.findIndex(ao => ao.oscillator === oscillator);
    if (index > -1) {
      activeOscillators.splice(index, 1);
    }
  };
};

function queueSchedulerTick(): void {
  if (schedulerHandle !== null) return;
  if (!scheduledTones.length) return;
  schedulerHandle = setTimeout(() => {
    schedulerHandle = null;
    processScheduledTones();
  }, SCHEDULER_INTERVAL_MS);
}

function processScheduledTones(): void {
  if (!scheduledTones.length) {
    stopSchedulerIfIdle();
    return;
  }

  if (activeLoop.stop) {
    clearScheduledTones();
    return;
  }

  const { ctx, output } = ensureOutputChain();
  const now = ctx.currentTime;
  const windowLimit = now + SCHEDULER_LOOKAHEAD_S;

  let index = 0;
  while (index < scheduledTones.length && scheduledTones[index].startTime <= windowLimit) {
    const tone = scheduledTones[index];
    scheduledTones.splice(index, 1);
    startScheduledTone(tone, ctx, output);
  }

  if (scheduledTones.length) {
    queueSchedulerTick();
  } else {
    stopSchedulerIfIdle();
  }
}

const computePanForFrequency = (frequency: number): number => {
  const minFreq = 220;
  const maxFreq = 1760;
  const logMin = Math.log2(minFreq);
  const logMax = Math.log2(maxFreq);
  const normalized = (Math.log2(Math.max(minFreq, Math.min(maxFreq, frequency))) - logMin) / (logMax - logMin);
  const spread = 0.38;
  const pan = (normalized - 0.5) * 2 * spread;
  return Math.max(-spread, Math.min(spread, pan));
};

const scheduleTonePlayback = (tone: ScheduledTone) => {
  const scheduledTone: ScheduledTone = {
    ...tone,
    pan: tone.pan ?? computePanForFrequency(tone.frequency),
  };

  scheduledTones.push(scheduledTone);
  scheduledTones.sort((a, b) => a.startTime - b.startTime);
  queueSchedulerTick();
};

export const createNonBlockingVisualCallback = (
  originalCallback: VisualCallback | undefined
): VisualCallback | undefined => {
  if (!originalCallback) return undefined;

  return (array: number[], highlightIndices?: number[]) => {
    queueMicrotask(() => {
      try {
        originalCallback(array, highlightIndices);
      } catch {
        // ignore visual errors to protect audio loop
      }
    });
  };
};

export const playTone = (
  frequency: number,
  duration: number,
  startTime: number,
  waveType: OscillatorType = "sine"
) => {
  if (activeLoop.stop) return;

  const { ctx } = ensureOutputChain();
  const now = ctx.currentTime;
  const targetStart = Math.max(startTime, now + MIN_START_OFFSET_S);

  scheduleTonePlayback({
    frequency,
    duration,
    startTime: targetStart,
    waveType,
  });

  processScheduledTones();
};

export const generateUniqueRandomArray = (size: number): number[] => {
  const array = Array.from({ length: size }, (_, i) => i + 1);

  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }

  return array;
};

export const valueToFrequency = (value: number, maxValue: number) => {
  const normalizedValue = value / maxValue;
  const minFreq = 220;
  const maxFreq = 1760;
  const logMin = Math.log2(minFreq);
  const logMax = Math.log2(maxFreq);
  return Math.pow(2, logMin + normalizedValue * (logMax - logMin));
};

export const delay = (ms: number) =>
  new Promise<void>(resolve => {
    setTimeout(resolve, ms);
  });

export const getAdaptiveDelay = (baseDelay: number, sampleSize: number): number => {
  if (sampleSize <= 32) return Math.max(baseDelay * 0.5, 25);
  if (sampleSize <= 64) return Math.max(baseDelay * 0.45, 20);
  if (sampleSize <= 128) return Math.max(baseDelay * 0.35, 16);
  if (sampleSize <= 256) return Math.max(baseDelay * 0.25, 12);
  return Math.max(baseDelay * 0.2, 10);
};

export const getAdaptiveNoteDuration = (baseDuration: number, sampleSize: number): number => {
  if (sampleSize <= 32) return 0.018;
  if (sampleSize <= 64) return 0.015;
  if (sampleSize <= 128) return 0.012;
  if (sampleSize <= 256) return 0.01;
  if (sampleSize <= 512) return 0.0095;
  if (sampleSize <= 1024) return 0.009;
  return 0.0085;
};

export const playSortedArray = async (
  array: number[],
  size: number,
  nonBlockingCallback?: VisualCallback
) => {
  const ctx = getAudioContext();
  const noteDuration = getAdaptiveNoteDuration(0.004, size);
  const audioDelay = getAdaptiveDelay(25, size);

  for (let i = 0; i < array.length && !activeLoop.stop; i++) {
    playTone(valueToFrequency(array[i], size), noteDuration, ctx.currentTime);

    if (nonBlockingCallback) {
      nonBlockingCallback([...array], [i]);
    }

    await delay(audioDelay);
  }

  await delay(getAdaptiveDelay(150, size));
};

export const stopAllSorting = () => {
  activeLoop.stop = true;
  clearScheduledTones();

  if (cleanupTimeout !== null) {
    clearTimeout(cleanupTimeout);
    cleanupTimeout = null;
  }

  try {
    const { ctx } = ensureOutputChain();
    if (runGain) {
      const now = ctx.currentTime;
      runGain.gain.cancelScheduledValues(now);
      runGain.gain.setValueAtTime(runGain.gain.value, now);
      runGain.gain.linearRampToValueAtTime(0, now + 0.02);
      const gainToDisconnect = runGain;
      runGain = null;
      cleanupTimeout = setTimeout(() => {
        try {
          gainToDisconnect.disconnect();
        } catch {
          // already disconnected
        }
        cleanupTimeout = null;
      }, 30);
    }
  } catch {
    // ignore audio cleanup errors
  }

  activeOscillators.forEach(({ oscillator, gainNode, panner }) => {
    try {
      const ctx = getAudioContext();
      const now = ctx.currentTime;
      gainNode.gain.cancelScheduledValues(now);
      gainNode.gain.setValueAtTime(gainNode.gain.value, now);
      gainNode.gain.linearRampToValueAtTime(0, now + 0.01);
      if (panner) {
        try {
          panner.disconnect();
        } catch {
          // already disconnected or unsupported node
        }
      }
      oscillator.stop(now + 0.01);
    } catch {
      // oscillator already stopped
    }
  });
  activeOscillators = [];
};

export const resetLoop = (): { stop: boolean } => {
  clearScheduledTones();
  const { ctx } = ensureOutputChain();
  const previousRunGain = runGain;
  runGain = ctx.createGain();
  const now = ctx.currentTime;
  const targetGain = getTargetMixGain();
  runGain.gain.setValueAtTime(targetGain * 0.92, now);
  runGain.gain.linearRampToValueAtTime(targetGain, now + 0.02);
  if (compressor) runGain.connect(compressor);

  if (previousRunGain) {
    previousRunGain.gain.cancelScheduledValues(now);
    previousRunGain.gain.setValueAtTime(previousRunGain.gain.value, now);
    previousRunGain.gain.linearRampToValueAtTime(0, now + 0.02);
    setTimeout(() => {
      try {
        previousRunGain.disconnect();
      } catch {
        // already disconnected
      }
    }, 30);
  }

  activeLoop = { stop: false };
  return activeLoop;
};

export const ensureAudioContextRunning = async (): Promise<AudioContext> => {
  const ctx = getAudioContext();
  if (ctx.state === "suspended") {
    try {
      await ctx.resume();
    } catch {
      // resume can fail if not triggered by a user gesture
    }
  }
  return ctx;
};

export const configureAudioScene = ({ sampleSize }: { sampleSize?: number } = {}) => {
  if (!sampleSize) {
    toneGainScalar = 1;
    return;
  }

  if (sampleSize > 4096) {
    toneGainScalar = 0.45;
  } else if (sampleSize > 2048) {
    toneGainScalar = 0.5;
  } else if (sampleSize > 1024) {
    toneGainScalar = 0.6;
  } else if (sampleSize > 512) {
    toneGainScalar = 0.75;
  } else if (sampleSize > 256) {
    toneGainScalar = 0.85;
  } else {
    toneGainScalar = 1;
  }

  try {
    const { ctx } = ensureOutputChain();
    if (runGain) {
      const now = ctx.currentTime;
      const targetGain = getTargetMixGain();
      runGain.gain.cancelScheduledValues(now);
      runGain.gain.setValueAtTime(runGain.gain.value, now);
      runGain.gain.linearRampToValueAtTime(targetGain, now + 0.08);
    }
    if (compressor) {
      applyCompressorProfile(compressor);
    }
  } catch {
    // ignore errors during mix configuration
  }
};

export const shouldThrottleVisuals = () => audioStressLevel > 0.45;
export const getAudioStressLevel = () => audioStressLevel;
