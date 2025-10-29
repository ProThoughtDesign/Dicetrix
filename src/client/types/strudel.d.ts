// Type declarations for Strudel packages
declare module '@strudel/core' {
  export interface Pattern {
    play(): any;
    stop(): void;
    pause(): void;
    resume(): void;
    gain(value: number): Pattern;
    slow(value: number): Pattern;
    fast(value: number): Pattern;
    lpf(value: any): Pattern;
    room(value: number): Pattern;
    add(other: Pattern): Pattern;
  }

  export function stack(...patterns: Pattern[]): Pattern;
  export function note(notes: string): Pattern;
  export function s(sound: string): Pattern;
  export const sine: any;
  export const noise: any;
  export const saw: any;
  export const square: any;
}

declare module '@strudel/webaudio' {
  export function initAudioOnFirstClick(): Promise<void>;
  export function getAudioContext(): AudioContext;
}

declare module '@strudel/mini' {
  // Mini notation helpers
}

declare module '@strudel/tonal' {
  // Tonal helpers
}
