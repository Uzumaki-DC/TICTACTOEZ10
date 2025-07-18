import { useCallback } from 'react';

type SoundType = 'click' | 'move' | 'win' | 'lose' | 'draw' | 'connect' | 'disconnect';

export function useSound() {
  const playSound = useCallback((soundType: SoundType) => {
    // Create audio context for web audio API
    if ('webkitAudioContext' in window || 'AudioContext' in window) {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      const audioContext = new AudioContext();
      
      // Generate different tones for different sound types
      const frequency = getSoundFrequency(soundType);
      const duration = getSoundDuration(soundType);
      
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = frequency;
      oscillator.type = getSoundWaveType(soundType);
      
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + duration);
    }
  }, []);

  return { playSound };
}

function getSoundFrequency(soundType: SoundType): number {
  switch (soundType) {
    case 'click': return 800;
    case 'move': return 400;
    case 'win': return 600;
    case 'lose': return 200;
    case 'draw': return 300;
    case 'connect': return 500;
    case 'disconnect': return 250;
    default: return 400;
  }
}

function getSoundDuration(soundType: SoundType): number {
  switch (soundType) {
    case 'click': return 0.1;
    case 'move': return 0.2;
    case 'win': return 0.5;
    case 'lose': return 0.3;
    case 'draw': return 0.4;
    case 'connect': return 0.3;
    case 'disconnect': return 0.2;
    default: return 0.2;
  }
}

function getSoundWaveType(soundType: SoundType): OscillatorType {
  switch (soundType) {
    case 'click': return 'square';
    case 'move': return 'sine';
    case 'win': return 'sawtooth';
    case 'lose': return 'triangle';
    case 'draw': return 'sine';
    case 'connect': return 'sine';
    case 'disconnect': return 'triangle';
    default: return 'sine';
  }
}
