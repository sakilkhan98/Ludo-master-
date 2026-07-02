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
