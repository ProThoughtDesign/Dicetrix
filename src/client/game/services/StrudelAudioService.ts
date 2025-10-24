import Logger from '../../utils/Logger';

export interface StrudelAudioService {
  initialize(): Promise<void>;
  isInitialized(): boolean;
  playMusic(key: string, loop?: boolean): void;
  stopMusic(): void;
  pauseMusic(): void;
  resumeMusic(): void;
  playSound(key: string, volume?: number): void;
  setMusicEnabled(enabled: boolean): void;
  setSoundEnabled(enabled: boolean): void;
  getMusicEnabled(): boolean;
  getSoundEnabled(): boolean;
  setMusicVolume(volume: number): void;
  setSoundVolume(volume: number): void;
  destroy(): void;
}

export class StrudelAudioServiceImpl implements StrudelAudioService {
  private static instance: StrudelAudioServiceImpl;
  private initialized = false;
  private currentMusic: OscillatorNode | null = null;
  private musicEnabled = true;
  private soundEnabled = true;
  private musicVolume = 0.8;
  private soundVolume = 0.8;
  private audioContext: AudioContext | null = null;
  private gainNode: GainNode | null = null;

  private constructor() {
    // Constructor is now empty - patterns will be generated on demand
  }

  static getInstance(): StrudelAudioServiceImpl {
    if (!StrudelAudioServiceImpl.instance) {
      StrudelAudioServiceImpl.instance = new StrudelAudioServiceImpl();
    }
    return StrudelAudioServiceImpl.instance;
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  async initialize(): Promise<void> {
    if (this.initialized) {
      Logger.log('StrudelAudioService: Already initialized');
      return;
    }

    try {
      // Check if Web Audio API is available
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) {
        throw new Error('Web Audio API not supported');
      }

      // Initialize Web Audio API
      this.audioContext = new AudioContextClass();
      this.gainNode = this.audioContext.createGain();
      this.gainNode.connect(this.audioContext.destination);
      
      // Set initial volume
      this.gainNode.gain.setValueAtTime(this.musicVolume, this.audioContext.currentTime);
      
      // Resume audio context if suspended (required by some browsers)
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }
      
      this.initialized = true;
      Logger.log('StrudelAudioService: Initialized successfully with Web Audio API');
    } catch (error) {
      Logger.log(`StrudelAudioService: Initialization failed - ${error}`);
      // Don't throw error - allow graceful degradation
      this.initialized = false;
    }
  }

  private createTone(frequency: number, duration: number, type: OscillatorType = 'sine'): void {
    if (!this.audioContext || !this.gainNode) {
      Logger.log('StrudelAudioService: Cannot create tone - audio context or gain node not available');
      return;
    }

    try {
      const oscillator = this.audioContext.createOscillator();
      const envelope = this.audioContext.createGain();
      
      oscillator.connect(envelope);
      envelope.connect(this.gainNode);
      
      oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
      oscillator.type = type;
      
      // Simple envelope
      envelope.gain.setValueAtTime(0, this.audioContext.currentTime);
      envelope.gain.linearRampToValueAtTime(0.3, this.audioContext.currentTime + 0.01);
      envelope.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
      
      oscillator.start(this.audioContext.currentTime);
      oscillator.stop(this.audioContext.currentTime + duration);
      
      Logger.log(`StrudelAudioService: Created tone ${frequency}Hz for ${duration}s`);
    } catch (error) {
      Logger.log(`StrudelAudioService: Error creating tone - ${error}`);
    }
  }

  private createNoise(duration: number): void {
    if (!this.audioContext || !this.gainNode) return;

    const bufferSize = this.audioContext.sampleRate * duration;
    const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
    const output = buffer.getChannelData(0);
    
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
    
    const noise = this.audioContext.createBufferSource();
    const envelope = this.audioContext.createGain();
    
    noise.buffer = buffer;
    noise.connect(envelope);
    envelope.connect(this.gainNode);
    
    envelope.gain.setValueAtTime(0, this.audioContext.currentTime);
    envelope.gain.linearRampToValueAtTime(0.1, this.audioContext.currentTime + 0.01);
    envelope.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
    
    noise.start(this.audioContext.currentTime);
  }

  playMusic(key: string, loop: boolean = true): void {
    if (!this.initialized || !this.musicEnabled || !this.audioContext) {
      return;
    }

    try {
      // Resume audio context if suspended (required by browsers)
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume();
      }

      // Stop current music if playing
      this.stopMusic();

      // Create simple algorithmic music based on key
      this.createMusicPattern(key, loop);

      Logger.log(`StrudelAudioService: Playing music '${key}' with loop=${loop}`);
    } catch (error) {
      Logger.log(`StrudelAudioService: Failed to play music '${key}' - ${error}`);
    }
  }

  private createMusicPattern(key: string, loop: boolean): void {
    if (!this.audioContext || !this.gainNode) {
      Logger.log('StrudelAudioService: Cannot create music pattern - audio context not available');
      return;
    }

    Logger.log(`StrudelAudioService: Creating music pattern '${key}' with loop=${loop}`);

    // Simple music patterns based on key
    const patterns: Record<string, () => void> = {
      'menu-theme': () => this.playMenuTheme(),
      'easy-mode': () => this.playEasyMode(),
      'medium-mode': () => this.playMediumMode(),
      'hard-mode': () => this.playHardMode(),
      'expert-mode': () => this.playExpertMode(),
      'zen-mode': () => this.playZenMode(),
    };

    const pattern = patterns[key];
    if (pattern) {
      // Set current music flag for looping control
      this.currentMusic = { key, loop } as any;
      
      pattern();
      
      // If looping, set up interval to repeat
      if (loop) {
        setTimeout(() => {
          if (this.musicEnabled && this.currentMusic && (this.currentMusic as any).key === key) {
            Logger.log(`StrudelAudioService: Looping music pattern '${key}'`);
            this.createMusicPattern(key, loop);
          }
        }, 4000); // Repeat every 4 seconds
      }
    } else {
      Logger.log(`StrudelAudioService: Unknown music pattern '${key}'`);
    }
  }

  private playMenuTheme(): void {
    // C major arpeggio - welcoming theme
    const notes = [261.63, 329.63, 392.00, 523.25]; // C4, E4, G4, C5
    notes.forEach((freq, i) => {
      setTimeout(() => this.createTone(freq, 0.5, 'sawtooth'), i * 200);
    });
    
    // Add bass note
    setTimeout(() => this.createTone(130.81, 1.0, 'square'), 0); // C3
  }

  private playEasyMode(): void {
    // Gentle ascending pattern
    const notes = [261.63, 293.66, 329.63, 349.23]; // C4, D4, E4, F4
    notes.forEach((freq, i) => {
      setTimeout(() => this.createTone(freq, 0.8, 'sine'), i * 300);
    });
  }

  private playMediumMode(): void {
    // More active pattern
    const notes = [261.63, 329.63, 392.00, 440.00, 523.25]; // C4, E4, G4, A4, C5
    notes.forEach((freq, i) => {
      setTimeout(() => this.createTone(freq, 0.4, 'sawtooth'), i * 150);
    });
  }

  private playHardMode(): void {
    // Intense pattern with lower notes
    const notes = [130.81, 146.83, 164.81, 196.00]; // C3, D3, E3, G3
    notes.forEach((freq, i) => {
      setTimeout(() => this.createTone(freq, 0.6, 'square'), i * 100);
    });
  }

  private playExpertMode(): void {
    // Complex polyrhythmic pattern
    const notes1 = [261.63, 311.13, 369.99, 440.00]; // C4, Eb4, F#4, A4
    const notes2 = [130.81, 155.56, 185.00]; // C3, Eb3, F#3
    
    notes1.forEach((freq, i) => {
      setTimeout(() => this.createTone(freq, 0.3, 'sawtooth'), i * 120);
    });
    
    notes2.forEach((freq, i) => {
      setTimeout(() => this.createTone(freq, 0.8, 'square'), i * 400);
    });
  }

  private playZenMode(): void {
    // Ambient, floating tones
    const notes = [261.63, 329.63, 392.00, 493.88]; // C4, E4, G4, B4
    notes.forEach((freq, i) => {
      setTimeout(() => this.createTone(freq, 2.0, 'sine'), i * 500);
    });
  }

  stopMusic(): void {
    if (this.currentMusic) {
      Logger.log(`StrudelAudioService: Stopping music '${(this.currentMusic as any).key}'`);
    }
    this.currentMusic = null; // Simple flag to stop looping
    Logger.log('StrudelAudioService: Music stopped');
  }

  pauseMusic(): void {
    // For simplicity, just stop the music
    this.stopMusic();
    Logger.log('StrudelAudioService: Music paused');
  }

  resumeMusic(): void {
    // For simplicity, this would need to restart the last played music
    Logger.log('StrudelAudioService: Music resume not implemented in simple version');
  }

  playSound(key: string, volume?: number): void {
    if (!this.initialized || !this.soundEnabled) {
      return;
    }

    try {
      // Resume audio context if suspended (required by browsers)
      if (this.audioContext && this.audioContext.state === 'suspended') {
        this.audioContext.resume();
      }

      // Create simple sound effects based on key
      this.createSoundEffect(key, volume);

      Logger.log(`StrudelAudioService: Playing sound '${key}'`);
    } catch (error) {
      Logger.log(`StrudelAudioService: Failed to play sound '${key}' - ${error}`);
    }
  }

  private createSoundEffect(key: string, volume?: number): void {
    Logger.log(`StrudelAudioService: Creating sound effect '${key}'`);
    
    const effectiveVolume = volume !== undefined ? volume : this.soundVolume;
    
    // Adjust gain node volume
    if (this.gainNode) {
      this.gainNode.gain.setValueAtTime(effectiveVolume, this.audioContext!.currentTime);
    }

    switch (key) {
      case 'menu-select':
        this.createTone(523.25, 0.1, 'sine'); // C5
        break;
      case 'menu-hover':
        this.createTone(392.00, 0.05, 'triangle'); // G4
        break;
      case 'menu-back':
        this.createTone(349.23, 0.15, 'square'); // F4
        break;
      case 'piece-move':
        this.createNoise(0.08);
        break;
      case 'piece-rotate':
        this.createTone(261.63, 0.06, 'square'); // C4
        setTimeout(() => this.createTone(392.00, 0.04, 'triangle'), 30); // G4
        break;
      case 'piece-lock':
        this.createTone(130.81, 0.12, 'square'); // C3
        break;
      case 'match-clear':
        // Ascending chord
        [523.25, 659.25, 783.99].forEach((freq, i) => { // C5, E5, G5
          setTimeout(() => this.createTone(freq, 0.2, 'sine'), i * 50);
        });
        break;
      case 'level-up':
        // Victory fanfare
        [261.63, 329.63, 392.00, 523.25, 659.25, 783.99].forEach((freq, i) => {
          setTimeout(() => this.createTone(freq, 0.3, 'sine'), i * 80);
        });
        break;
      case 'game-over':
        // Descending sad tones
        [523.25, 466.16, 415.30, 349.23].forEach((freq, i) => {
          setTimeout(() => this.createTone(freq, 0.6, 'sine'), i * 200);
        });
        break;
      default:
        // Default beep
        this.createTone(440.00, 0.1, 'sine'); // A4
        Logger.log(`StrudelAudioService: Unknown sound effect '${key}', playing default beep`);
        break;
    }
    
    // Reset gain after sound
    setTimeout(() => {
      if (this.gainNode) {
        this.gainNode.gain.setValueAtTime(this.musicVolume, this.audioContext!.currentTime);
      }
    }, 500);
  }

  setMusicEnabled(enabled: boolean): void {
    this.musicEnabled = enabled;
    
    if (!enabled) {
      this.stopMusic();
    }
    
    Logger.log(`StrudelAudioService: Music enabled set to ${enabled}`);
  }

  setSoundEnabled(enabled: boolean): void {
    this.soundEnabled = enabled;
    Logger.log(`StrudelAudioService: Sound effects enabled set to ${enabled}`);
  }

  getMusicEnabled(): boolean {
    return this.musicEnabled;
  }

  getSoundEnabled(): boolean {
    return this.soundEnabled;
  }

  setMusicVolume(volume: number): void {
    this.musicVolume = Math.max(0, Math.min(1, volume));
    
    // Update gain node volume
    if (this.gainNode) {
      this.gainNode.gain.setValueAtTime(this.musicVolume, this.audioContext!.currentTime);
    }
    
    Logger.log(`StrudelAudioService: Music volume set to ${this.musicVolume}`);
  }

  setSoundVolume(volume: number): void {
    this.soundVolume = Math.max(0, Math.min(1, volume));
    Logger.log(`StrudelAudioService: Sound volume set to ${this.soundVolume}`);
  }

  destroy(): void {
    this.stopMusic();
    this.initialized = false;
    Logger.log('StrudelAudioService: Destroyed');
  }
}

// Export singleton instance
export const strudelAudioService = StrudelAudioServiceImpl.getInstance();
