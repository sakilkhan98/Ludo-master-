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

// Play dice roll sound: dynamic white-noise burst and rapid clicks
export function playDiceRollSound() {
  if (!currentSettings.soundEnabled) return;
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    
    // Simulate tumbling clicks
    for (let i = 0; i < 6; i++) {
      const clickTime = now + i * 0.06;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(120 + i * 40, clickTime);
      osc.frequency.exponentialRampToValueAtTime(30, clickTime + 0.04);
      
      gain.gain.setValueAtTime(0.15, clickTime);
      gain.gain.exponentialRampToValueAtTime(0.01, clickTime + 0.04);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(clickTime);
      osc.stop(clickTime + 0.05);
    }
  } catch (err) {
    console.warn('Audio error:', err);
  }
}

// Play token movement: sharp rising pitch sweep
export function playMoveSound() {
  if (!currentSettings.soundEnabled) return;
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.exponentialRampToValueAtTime(800, now + 0.15);
    
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start(now);
    osc.stop(now + 0.16);
  } catch (err) {
    console.warn('Audio error:', err);
  }
}

// Play capture / cut sound: heavy descending bass sweep
export function playCutSound() {
  if (!currentSettings.soundEnabled) return;
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(350, now);
    osc.frequency.exponentialRampToValueAtTime(60, now + 0.35);
    
    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start(now);
    osc.stop(now + 0.36);
    
    triggerVibration([100, 50, 150]);
  } catch (err) {
    console.warn('Audio error:', err);
  }
}

// Play reaching Home sound: beautiful high arpeggio
export function playHomeSound() {
  if (!currentSettings.soundEnabled) return;
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    const notes = [261.63, 329.63, 392.00, 523.25]; // C4, E4, G4, C5
    
    notes.forEach((freq, idx) => {
      const noteTime = now + idx * 0.1;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, noteTime);
      gain.gain.setValueAtTime(0.15, noteTime);
      gain.gain.exponentialRampToValueAtTime(0.01, noteTime + 0.25);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(noteTime);
      osc.stop(noteTime + 0.3);
    });
    
    triggerVibration([80, 80, 80]);
  } catch (err) {
    console.warn('Audio error:', err);
  }
}

// Play game victory sound: majestic synthesized fanfare
export function playVictorySound() {
  if (!currentSettings.soundEnabled) return;
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    const chords = [
      [261.63, 329.63, 392.00], // C major
      [349.23, 440.00, 523.25], // F major
      [392.00, 493.88, 587.33], // G major
      [523.25, 659.25, 783.99]  // C5 major
    ];
    
    chords.forEach((frequencies, chordIdx) => {
      const chordTime = now + chordIdx * 0.25;
      frequencies.forEach((freq) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, chordTime);
        gain.gain.setValueAtTime(0.12, chordTime);
        gain.gain.exponentialRampToValueAtTime(0.01, chordTime + 0.4);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start(chordTime);
        osc.stop(chordTime + 0.45);
      });
    });
    
    triggerVibration([100, 100, 100, 100, 200]);
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
