import { GameSettings } from '../types';

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

// Global settings reference
let currentSettings: GameSettings = {
  soundEnabled: true,
  musicEnabled: true,
  vibrationEnabled: true,
  language: 'en',
  theme: 'dark'
};

export function updateAudioSettings(settings: GameSettings) {
  currentSettings = settings;
}

// Play premium dice roll sound: high-quality tumbling cup rattle and crisp wooden board land
export function playDiceRollSound() {
  if (!currentSettings.soundEnabled) return;
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    
    // 1. Tumbling/Rattling Phase: series of quick, bouncy, woodblock-like knocks
    const numClicks = 6;
    for (let i = 0; i < numClicks; i++) {
      const clickTime = now + i * 0.06;
      
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'triangle';
      // Vary the pitch slightly to simulate dice rotating inside a cup
      const pitch = 300 + (i % 2 === 0 ? 120 : -80) + Math.random() * 50;
      osc.frequency.setValueAtTime(pitch, clickTime);
      osc.frequency.exponentialRampToValueAtTime(100, clickTime + 0.04);
      
      // Decay envelope for a clear, crisp tap
      gain.gain.setValueAtTime(0.18, clickTime);
      gain.gain.exponentialRampToValueAtTime(0.001, clickTime + 0.04);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(clickTime);
      osc.stop(clickTime + 0.05);
    }

    // 2. Heavy Double Landing Hit: satisfying hollow board impact
    const landTime = now + numClicks * 0.06 + 0.02;
    
    // Low-frequency bass thud (gives real physical presence)
    const thudOsc = ctx.createOscillator();
    const thudGain = ctx.createGain();
    thudOsc.type = 'sine';
    thudOsc.frequency.setValueAtTime(140, landTime);
    thudOsc.frequency.exponentialRampToValueAtTime(50, landTime + 0.2);
    
    thudGain.gain.setValueAtTime(0.4, landTime);
    thudGain.gain.exponentialRampToValueAtTime(0.001, landTime + 0.2);
    
    thudOsc.connect(thudGain);
    thudGain.connect(ctx.destination);
    thudOsc.start(landTime);
    thudOsc.stop(landTime + 0.22);

    // Medium-frequency wood block snap (crisp snap of dice on timber)
    const snapOsc = ctx.createOscillator();
    const snapGain = ctx.createGain();
    snapOsc.type = 'triangle';
    snapOsc.frequency.setValueAtTime(450, landTime);
    snapOsc.frequency.exponentialRampToValueAtTime(120, landTime + 0.1);
    
    snapGain.gain.setValueAtTime(0.25, landTime);
    snapGain.gain.exponentialRampToValueAtTime(0.001, landTime + 0.1);
    
    snapOsc.connect(snapGain);
    snapGain.connect(ctx.destination);
    snapOsc.start(landTime);
    snapOsc.stop(landTime + 0.12);

    // Quick subtle slap echo for premium room depth
    const echoOsc = ctx.createOscillator();
    const echoGain = ctx.createGain();
    echoOsc.type = 'sine';
    echoOsc.frequency.setValueAtTime(320, landTime + 0.05);
    echoOsc.frequency.exponentialRampToValueAtTime(80, landTime + 0.12);
    
    echoGain.gain.setValueAtTime(0.1, landTime + 0.05);
    echoGain.gain.exponentialRampToValueAtTime(0.001, landTime + 0.12);
    
    echoOsc.connect(echoGain);
    echoGain.connect(ctx.destination);
    echoOsc.start(landTime + 0.05);
    echoOsc.stop(landTime + 0.15);

  } catch (err) {
    console.warn('Audio error:', err);
  }
}

// Play premium token movement sound: ultra-clean classic woodblock "pop-pop" or "tok-tok"
export function playMoveSound() {
  if (!currentSettings.soundEnabled) return;
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    
    // First high-pitched clean block hit
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(380, now);
    osc1.frequency.exponentialRampToValueAtTime(1200, now + 0.06);
    
    gain1.gain.setValueAtTime(0.28, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
    
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.07);

    // Second deeper resonance hit slightly delayed for a beautiful "tok-tok" sequence
    const secondTime = now + 0.05;
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(280, secondTime);
    osc2.frequency.exponentialRampToValueAtTime(900, secondTime + 0.06);
    
    gain2.gain.setValueAtTime(0.24, secondTime);
    gain2.gain.exponentialRampToValueAtTime(0.001, secondTime + 0.06);
    
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(secondTime);
    osc2.stop(secondTime + 0.07);

    // Base punch for physical depth
    const punchOsc = ctx.createOscillator();
    const punchGain = ctx.createGain();
    punchOsc.type = 'triangle';
    punchOsc.frequency.setValueAtTime(180, now);
    punchOsc.frequency.exponentialRampToValueAtTime(60, now + 0.1);
    
    punchGain.gain.setValueAtTime(0.18, now);
    punchGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    
    punchOsc.connect(punchGain);
    punchGain.connect(ctx.destination);
    punchOsc.start(now);
    punchOsc.stop(now + 0.11);

  } catch (err) {
    console.warn('Audio error:', err);
  }
}

// Play premium capture / cut sound: cartoon swoop combined with high energy synth blast
export function playCutSound() {
  if (!currentSettings.soundEnabled) return;
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    
    // High-pitched laser swoop downwards
    const swoopOsc = ctx.createOscillator();
    const swoopGain = ctx.createGain();
    swoopOsc.type = 'sawtooth';
    swoopOsc.frequency.setValueAtTime(900, now);
    swoopOsc.frequency.linearRampToValueAtTime(60, now + 0.45);
    
    swoopGain.gain.setValueAtTime(0.22, now);
    swoopGain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
    
    swoopOsc.connect(swoopGain);
    swoopGain.connect(ctx.destination);
    swoopOsc.start(now);
    swoopOsc.stop(now + 0.46);

    // Bouncy bubble pop upward to resolve the sound playfully
    const popOsc = ctx.createOscillator();
    const popGain = ctx.createGain();
    popOsc.type = 'sine';
    popOsc.frequency.setValueAtTime(150, now + 0.2);
    popOsc.frequency.exponentialRampToValueAtTime(1200, now + 0.4);
    
    popGain.gain.setValueAtTime(0.18, now + 0.2);
    popGain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
    
    popOsc.connect(popGain);
    popGain.connect(ctx.destination);
    popOsc.start(now + 0.2);
    popOsc.stop(now + 0.41);

    // Deep sub bass explosion thud
    const bassOsc = ctx.createOscillator();
    const bassGain = ctx.createGain();
    bassOsc.type = 'sine';
    bassOsc.frequency.setValueAtTime(200, now);
    bassOsc.frequency.exponentialRampToValueAtTime(40, now + 0.3);
    
    bassGain.gain.setValueAtTime(0.35, now);
    bassGain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    
    bassOsc.connect(bassGain);
    bassGain.connect(ctx.destination);
    bassOsc.start(now);
    bassOsc.stop(now + 0.32);

    triggerVibration([120, 60, 180, 60, 240]);
  } catch (err) {
    console.warn('Audio error:', err);
  }
}

// Play premium reaching Home sound: ultra-sparkling crystalline major pentatonic chime run
export function playHomeSound() {
  if (!currentSettings.soundEnabled) return;
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    
    // Bright, magical major pentatonic notes (C5, D5, E5, G5, A5, C6)
    const notes = [523.25, 587.33, 659.25, 783.99, 880.00, 1046.50];
    
    notes.forEach((freq, idx) => {
      const noteTime = now + idx * 0.07;
      
      // Beautiful crystal sine chime
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, noteTime);
      
      gain.gain.setValueAtTime(0.24, noteTime);
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.4);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(noteTime);
      osc.stop(noteTime + 0.42);

      // Add a sparkling triangle overtone to give a "bells" quality
      const spark = ctx.createOscillator();
      const sparkGain = ctx.createGain();
      spark.type = 'triangle';
      spark.frequency.setValueAtTime(freq * 2, noteTime);
      
      sparkGain.gain.setValueAtTime(0.06, noteTime);
      sparkGain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.25);
      
      spark.connect(sparkGain);
      sparkGain.connect(ctx.destination);
      spark.start(noteTime);
      spark.stop(noteTime + 0.27);
    });
    
    triggerVibration([100, 100, 100]);
  } catch (err) {
    console.warn('Audio error:', err);
  }
}

// Play premium game victory sound: celebratory multi-harmonic retro fanfare
export function playVictorySound() {
  if (!currentSettings.soundEnabled) return;
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    
    // Upbeat celebratory 8-bit / 16-bit melody run
    const melody = [
      { notes: [261.63, 329.63, 392.00], duration: 0.15 }, // C Maj
      { notes: [329.63, 392.00, 523.25], duration: 0.15 }, // C Maj (Inversion)
      { notes: [349.23, 440.00, 523.25], duration: 0.15 }, // F Maj
      { notes: [392.00, 493.88, 587.33], duration: 0.15 }, // G Maj
      { notes: [523.25, 659.25, 783.99], duration: 0.50 }  // High C Maj (Final chord!)
    ];

    let accumTime = now;
    melody.forEach((chord) => {
      chord.notes.forEach((freq) => {
        // Bright bell lead
        const bellOsc = ctx.createOscillator();
        const bellGain = ctx.createGain();
        bellOsc.type = 'sine';
        bellOsc.frequency.setValueAtTime(freq, accumTime);
        
        bellGain.gain.setValueAtTime(0.2, accumTime);
        bellGain.gain.exponentialRampToValueAtTime(0.001, accumTime + chord.duration + 0.1);
        
        bellOsc.connect(bellGain);
        bellGain.connect(ctx.destination);
        bellOsc.start(accumTime);
        bellOsc.stop(accumTime + chord.duration + 0.15);

        // Warm brass backing (triangle)
        const brassOsc = ctx.createOscillator();
        const brassGain = ctx.createGain();
        brassOsc.type = 'triangle';
        brassOsc.frequency.setValueAtTime(freq / 2, accumTime);
        
        brassGain.gain.setValueAtTime(0.12, accumTime);
        brassGain.gain.exponentialRampToValueAtTime(0.001, accumTime + chord.duration + 0.08);
        
        brassOsc.connect(brassGain);
        brassGain.connect(ctx.destination);
        brassOsc.start(accumTime);
        brassOsc.stop(accumTime + chord.duration + 0.12);
      });
      accumTime += chord.duration + 0.02;
    });
    
    triggerVibration([100, 50, 100, 50, 100, 50, 300]);
  } catch (err) {
    console.warn('Audio error:', err);
  }
}

// Play premium heavy electronic music: dynamic synth chords, sub-bass thuds, and an epic arpeggiator drop
export function playHeavyUpdateMusic() {
  if (!currentSettings.soundEnabled) return;
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    const playNote = (freq: number, startTime: number, duration: number, type: OscillatorType = 'sine', volume = 0.15) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, startTime);
      
      // Attack-Decay envelope
      gain.gain.setValueAtTime(0.01, startTime);
      gain.gain.linearRampToValueAtTime(volume, startTime + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + duration + 0.05);
    };

    // Chord progressions in C minor
    const bassProgression = [130.81, 155.56, 196.00, 207.65]; // C3, Eb3, G3, Ab3
    const leadProgression = [
      [261.63, 311.13, 392.00, 523.25], // C minor arp
      [311.13, 392.00, 466.16, 622.25], // Eb major arp
      [392.00, 466.16, 587.33, 783.99], // G minor arp
      [415.30, 523.25, 622.25, 830.61]  // Ab major arp
    ];

    const tempo = 130; // High energy 130 BPM
    const beatDuration = 60 / tempo; // ~0.46s
    const stepDuration = beatDuration / 4; // ~0.115s per 16th note

    // Generate heavy sequence of 32 steps (approx 3.7 seconds total)
    for (let step = 0; step < 32; step++) {
      const stepTime = now + (step * stepDuration);
      const chordIdx = Math.floor(step / 8) % 4;
      const beatInChord = step % 8;

      // 1. Heavy bass drum thud (steps 0, 4, 8, etc.)
      if (beatInChord === 0 || beatInChord === 4) {
        const kickOsc = ctx.createOscillator();
        const kickGain = ctx.createGain();
        kickOsc.type = 'sine';
        kickOsc.frequency.setValueAtTime(160, stepTime);
        kickOsc.frequency.exponentialRampToValueAtTime(42, stepTime + 0.16);
        
        kickGain.gain.setValueAtTime(0.55, stepTime);
        kickGain.gain.exponentialRampToValueAtTime(0.001, stepTime + 0.25);
        
        kickOsc.connect(kickGain);
        kickGain.connect(ctx.destination);
        kickOsc.start(stepTime);
        kickOsc.stop(stepTime + 0.28);

        // Click accent
        const clickOsc = ctx.createOscillator();
        const clickGain = ctx.createGain();
        clickOsc.type = 'triangle';
        clickOsc.frequency.setValueAtTime(700, stepTime);
        clickOsc.frequency.exponentialRampToValueAtTime(120, stepTime + 0.04);
        clickGain.gain.setValueAtTime(0.18, stepTime);
        clickGain.gain.exponentialRampToValueAtTime(0.001, stepTime + 0.04);
        clickOsc.connect(clickGain);
        clickGain.connect(ctx.destination);
        clickOsc.start(stepTime);
        clickOsc.stop(stepTime + 0.05);
      }

      // 2. Heavy rolling offbeat bass synth (steps 1, 3, 5, 7)
      if (beatInChord % 2 === 1) {
        const bassFreq = bassProgression[chordIdx] / 2; // C2, Eb2, etc. (deep growl)
        playNote(bassFreq, stepTime, stepDuration * 0.9, 'sawtooth', 0.22);
      }

      // 3. Upbeat fast lead arpeggiator notes
      const arpeggioNotes = leadProgression[chordIdx];
      const noteToPlay = arpeggioNotes[beatInChord % arpeggioNotes.length];
      playNote(noteToPlay, stepTime, stepDuration * 0.8, 'sawtooth', 0.12);
      playNote(noteToPlay * 2, stepTime, stepDuration * 0.55, 'sine', 0.06);

      // 4. Snare drum clap on beats 2 and 6
      if (beatInChord === 2 || beatInChord === 6) {
        const snareOsc = ctx.createOscillator();
        const snareGain = ctx.createGain();
        snareOsc.type = 'triangle';
        snareOsc.frequency.setValueAtTime(240, stepTime);
        snareOsc.frequency.exponentialRampToValueAtTime(90, stepTime + 0.14);
        
        snareGain.gain.setValueAtTime(0.25, stepTime);
        snareGain.gain.exponentialRampToValueAtTime(0.001, stepTime + 0.18);
        
        snareOsc.connect(snareGain);
        snareGain.connect(ctx.destination);
        snareOsc.start(stepTime);
        snareOsc.stop(stepTime + 0.2);

        // Noise element
        const noiseOsc = ctx.createOscillator();
        const noiseGain = ctx.createGain();
        noiseOsc.type = 'sawtooth';
        noiseOsc.frequency.setValueAtTime(1000 + Math.random() * 300, stepTime);
        noiseOsc.frequency.exponentialRampToValueAtTime(60, stepTime + 0.1);
        
        noiseGain.gain.setValueAtTime(0.15, stepTime);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, stepTime + 0.1);
        
        noiseOsc.connect(noiseGain);
        noiseGain.connect(ctx.destination);
        noiseOsc.start(stepTime);
        noiseOsc.stop(stepTime + 0.12);
      }
    }

    // Epic drop/ending final explosion blast
    const endTime = now + (32 * stepDuration);
    playNote(65.41, endTime, 1.4, 'sine', 0.6); // Deep thumping Sub-C
    const finalChord = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99]; // Epic C Maj Chord
    finalChord.forEach((freq) => {
      playNote(freq, endTime, 1.6, 'sawtooth', 0.18);
      playNote(freq * 1.5, endTime, 1.2, 'triangle', 0.08); // Perfect fifth high accent
      playNote(freq * 2, endTime, 1.4, 'sine', 0.07);
    });

    // Elegant descending sweep
    const sweepOsc = ctx.createOscillator();
    const sweepGain = ctx.createGain();
    sweepOsc.type = 'sawtooth';
    sweepOsc.frequency.setValueAtTime(1600, endTime);
    sweepOsc.frequency.exponentialRampToValueAtTime(80, endTime + 1.4);
    
    sweepGain.gain.setValueAtTime(0.24, endTime);
    sweepGain.gain.exponentialRampToValueAtTime(0.001, endTime + 1.4);
    
    sweepOsc.connect(sweepGain);
    sweepGain.connect(ctx.destination);
    sweepOsc.start(endTime);
    sweepOsc.stop(endTime + 1.45);

    // Dynamic haptic vibration pattern
    triggerVibration([100, 50, 100, 50, 150, 80, 200, 100, 500]);

  } catch (err) {
    console.warn('Audio error in playHeavyUpdateMusic:', err);
  }
}

// Vibration Support
export function triggerVibration(pattern: number | number[]) {
  if (!currentSettings.vibrationEnabled) return;
  if ('vibrate' in navigator) {
    try {
      navigator.vibrate(pattern);
    } catch (e) {
      // Ignore security errors in sandboxed iframes
    }
  }
}
