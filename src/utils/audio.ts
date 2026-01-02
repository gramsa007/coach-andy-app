// src/utils/audio.ts

export const playBeep = (freq = 440, type: OscillatorType = 'sine', duration = 0.1, vol = 0.1) => {
    try {
        // Cross-Browser Support
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContext) return;
        
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        
        gain.gain.setValueAtTime(vol, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        osc.stop(ctx.currentTime + duration);

        // Haptic Feedback (Vibration) falls unterstützt
        if (navigator.vibrate) {
            navigator.vibrate(200);
        }
    } catch (e) {
        console.error("Audio Playback Error", e);
    }
};
