// Strudel Music Patterns for Dicetrix
// Place your Strudel music code here

import { Pattern, stack, note, s, sine, noise, saw, square } from '@strudel/core';

export class StrudelMusic {
  
  // **PUT YOUR STRUDEL MUSIC CODE HERE**
  // Replace these placeholder patterns with your actual Strudel compositions
  
  static createMenuTheme(): Pattern {
    // Replace this with your Strudel menu music code
    return stack(
      note("c4 e4 g4 c5").s("sawtooth").lpf(800).room(0.3).slow(2),
      note("c2 c2 f2 g2").s("square").lpf(200).slow(4).gain(0.7),
      s("bd ~ sd ~").gain(0.8),
      s("~ hh ~ hh").gain(0.4)
    ).slow(1);
  }

  static createEasyMode(): Pattern {
    // Replace this with your Strudel easy mode music code
    return stack(
      note("c4 e4 g4 b4 c5 b4 g4 e4").s("sine").lpf(1000).slow(4).gain(0.6),
      note("c2 ~ g2 ~").s("triangle").lpf(150).slow(2).gain(0.5)
    ).slow(2);
  }

  static createMediumMode(): Pattern {
    // Replace this with your Strudel medium mode music code
    return stack(
      note("c4 d4 e4 f4 g4 a4 b4 c5").s("sawtooth").lpf(sine.range(400, 1200).slow(8)).slow(2),
      note("c2 c2 f2 f2 g2 g2 c2 c2").s("square").lpf(200).slow(4),
      s("bd sd bd sd").gain(0.9)
    ).slow(1);
  }

  static createHardMode(): Pattern {
    // Replace this with your Strudel hard mode music code
    return stack(
      note("c4 eb4 f4 g4 bb4 c5").s("sawtooth").lpf(sine.range(600, 1600).fast(2)).slow(1.5),
      note("c1 ~ c2 ~ f1 ~ g1 ~").s("square").lpf(180).gain(0.9),
      s("bd bd sd bd").gain(1.0)
    ).slow(0.75);
  }

  static createExpertMode(): Pattern {
    // Replace this with your Strudel expert mode music code
    return stack(
      note("c4 d4 eb4 f4 g4 ab4 bb4 c5").s("sawtooth").slow(3),
      note("c2 f2 bb1 eb2 ab1 db2 gb1 b1").s("square").lpf(220).slow(7),
      s("bd ~ sd ~ bd sd ~ bd").gain(0.9)
    ).slow(1.2);
  }

  static createZenMode(): Pattern {
    // Replace this with your Strudel zen mode music code
    return stack(
      note("c4 e4 g4 b4").s("sine").add(note("e4 g4 b4 d5")).lpf(600).room(0.8).slow(8),
      note("c1 ~ ~ ~ g1 ~ ~ ~").s("sine").lpf(100).slow(8).gain(0.3),
      noise().lpf(200).hpf(50).gain(0.1).slow(16)
    ).slow(4);
  }

  // Add more music patterns as needed
  // You can create as many patterns as you want here
}
