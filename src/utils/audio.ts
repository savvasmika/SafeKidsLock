/**
 * Sound synthesizers using Web Audio API for tactile kid-friendly tablet feedback
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  public enabled: boolean = true;

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  // Crisp keypad tap click
  playKeyClick() {
    if (!this.enabled) return;
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(320, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(140, ctx.currentTime + 0.04);
      
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start();
      osc.stop(ctx.currentTime + 0.05);
    } catch {
      // AudioContext could be blocked by browser policy until gesture
    }
  }

  // Celebratory unlock chime (Major triad)
  playUnlockChime() {
    if (!this.enabled) return;
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      
      notes.forEach((freq, index) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const noteStart = now + index * 0.08;
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, noteStart);
        
        gain.gain.setValueAtTime(0.15, noteStart);
        gain.gain.exponentialRampToValueAtTime(0.001, noteStart + 0.35);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start(noteStart);
        osc.stop(noteStart + 0.36);
      });
    } catch {
      // ignore
    }
  }

  // Wrong PIN buzzer
  playErrorTone() {
    if (!this.enabled) return;
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.setValueAtTime(130, now + 0.1);
      
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.22);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(now);
      osc.stop(now + 0.23);
    } catch {
      // ignore
    }
  }

  // Deterrent buzzer for tamper attempts / task switcher block
  playErrorBuzz() {
    this.playErrorTone();
  }

  // Warning chime when timer reaches last minute / 30s
  playWarningChime() {
    if (!this.enabled) return;
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      
      [880, 783.99].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const start = now + idx * 0.15;
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, start);
        
        gain.gain.setValueAtTime(0.1, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.25);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start(start);
        osc.stop(start + 0.26);
      });
    } catch {
      // ignore
    }
  }

  // Latch lock sound when device locks
  playLockSound() {
    if (!this.enabled) return;
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.exponentialRampToValueAtTime(110, now + 0.18);
      
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(now);
      osc.stop(now + 0.2);
    } catch {
      // ignore
    }
  }

  // Heavy mechanical lockdown alarm when session finishes and tablet relocks
  playHardLockoutSound() {
    if (!this.enabled) return;
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      // Two-stage heavy mechanical clunk and alarm chime
      [
        { freq: 440, type: 'sawtooth' as OscillatorType, start: 0, dur: 0.18, gain: 0.25 },
        { freq: 220, type: 'triangle' as OscillatorType, start: 0.08, dur: 0.25, gain: 0.3 },
        { freq: 110, type: 'sine' as OscillatorType, start: 0.15, dur: 0.35, gain: 0.4 },
        { freq: 55, type: 'square' as OscillatorType, start: 0.22, dur: 0.45, gain: 0.35 },
      ].forEach((tone) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = tone.type;
        osc.frequency.setValueAtTime(tone.freq, now + tone.start);
        osc.frequency.exponentialRampToValueAtTime(Math.max(20, tone.freq * 0.4), now + tone.start + tone.dur);
        gain.gain.setValueAtTime(tone.gain, now + tone.start);
        gain.gain.exponentialRampToValueAtTime(0.001, now + tone.start + tone.dur);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + tone.start);
        osc.stop(now + tone.start + tone.dur);
      });
    } catch {
      // ignore
    }
  }

  // Play simple piano note for Kid Tunes app
  playNote(freq: number) {
    if (!this.enabled) return;
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now);
      
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(now);
      osc.stop(now + 0.65);
    } catch {
      // ignore
    }
  }
}

export const sound = new SoundEngine();
