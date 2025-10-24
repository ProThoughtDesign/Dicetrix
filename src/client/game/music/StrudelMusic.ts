// Enhanced Strudel Music Patterns for Dicetrix
// Complete musical compositions for each game mode with transitions and variations

import { Pattern, stack, note, s, sine, noise } from '@strudel/core';

// TypeScript augmentation for Strudel Pattern methods
declare module '@strudel/core' {
  interface Pattern {
    s(sound: string): Pattern;
    lpf(frequency: number | Pattern): Pattern;
    hpf(frequency: number | Pattern): Pattern;
    room(amount: number): Pattern;
    delay(time: number): Pattern;
    gain(amount: number | Pattern): Pattern;
    slow(factor: number): Pattern;
    fast(factor: number): Pattern;
    distort(amount: number): Pattern;
    crush(bits: number): Pattern;
  }
}

export class StrudelMusic {
  
  // Enhanced menu theme with welcoming, ambient atmosphere
  static createMenuTheme(): Pattern {
    try {
      // Main melodic theme - warm and inviting with extended composition
      const melody = note("c4 e4 g4 c5 e5 g4 e4 c4 d4 f4 a4 d5 f5 a4 f4 d4")
        .s("sawtooth")
        .lpf(sine.range(800, 1200).slow(16))
        .room(0.4)
        .delay(0.25)
        .gain(0.6)
        .slow(8);

      // Rich harmonic foundation with chord progressions
      const harmony = note("c3 ~ g3 ~ f3 ~ e3 ~ a2 ~ f3 ~ g3 ~ c3 ~")
        .s("square")
        .lpf(400)
        .gain(0.4)
        .slow(16);

      // Ambient pad layer with extended harmonies
      const pad = note("c3 e3 g3 b3 ~ a2 c3 e3 ~ f3 a3 c4 ~ g2 b2 d3 f3")
        .s("sine")
        .lpf(300)
        .room(0.6)
        .gain(0.3)
        .slow(32);

      // Enhanced percussion with more variety
      const percussion = stack(
        s("bd ~ ~ ~ bd ~ sd ~").gain(0.5).slow(4),
        s("~ hh ~ hh ~ hh ~ hh").gain(0.2).slow(2),
        s("~ ~ ~ perc ~ ~ crash ~").gain(0.3).slow(8)
      );

      // Melodic variations that evolve over time
      const variations = note("e5 ~ g5 ~ c6 ~ b5 ~ a5 ~ g5 ~ f5 ~ e5 ~")
        .s("sine")
        .gain(0.3)
        .room(0.8)
        .delay(0.5)
        .slow(16);

      return stack(melody, harmony, pad, percussion, variations)
        .slow(1);
        
    } catch (error) {
      console.log(`StrudelMusic: Error creating menu theme - ${error}`);
      // Fallback to simple pattern
      return note("c4 e4 g4 c5").s("sine").slow(2);
    }
  }

  // Easy mode - relaxed, encouraging gameplay music with full composition
  static createEasyMode(): Pattern {
    try {
      // Extended gentle melody with variations
      const melody = note("c4 d4 e4 f4 g4 a4 g4 f4 e4 d4 c4 g3 a3 b3 c4 d4 e4 f4 e4 d4 c4 b3 a3 g3")
        .s("sine")
        .lpf(sine.range(600, 1000).slow(24))
        .room(0.4)
        .delay(0.2)
        .gain(0.7)
        .slow(12);

      // Flowing bass line with more movement
      const bass = note("c2 ~ ~ g2 ~ f2 ~ ~ c2 ~ g1 ~ f2 ~ ~ a2 ~ g2 ~ ~ c2 ~ f1 ~")
        .s("sine")
        .lpf(200)
        .gain(0.5)
        .slow(24);

      // Layered arpeggios for richness
      const arpeggios = stack(
        note("c4 e4 g4 c5 e5 g5 e5 c5 g4 e4").s("sine").gain(0.4).lpf(800).delay(0.125).slow(6),
        note("~ ~ c5 ~ e5 ~ g5 ~ c6 ~").s("sine").gain(0.3).lpf(1200).delay(0.25).slow(6)
      );

      // Gentle percussion with subtle complexity
      const drums = stack(
        s("bd ~ ~ ~ bd ~ ~ ~ bd ~ sd ~").gain(0.4).slow(4),
        s("~ ~ hh ~ ~ hh ~ ~").gain(0.2).slow(2),
        s("~ ~ ~ ~ ~ ~ ~ perc").gain(0.3).slow(8)
      );

      // Breathing dynamics for organic feel
      const dynamics = sine.range(0.8, 1.2).slow(32);

      return stack(melody, bass, arpeggios, drums)
        .gain(dynamics)
        .slow(1);
        
    } catch (error) {
      console.log(`StrudelMusic: Error creating easy mode - ${error}`);
      return note("c4 e4 g4 b4").s("sine").slow(4);
    }
  }

  // Medium mode - moderately energetic music with full arrangement
  static createMediumMode(): Pattern {
    try {
      // Extended complex melody with development
      const melody = note("c4 d4 e4 ~ g4 f4 e4 d4 ~ c4 e4 g4 a4 ~ f4 g4 ~ e4 d4 c4 ~ g4 a4 b4 c5")
        .s("sawtooth")
        .lpf(sine.range(500, 1400).slow(16))
        .room(0.3)
        .gain(0.8)
        .slow(8);

      // Driving bass with rhythmic patterns
      const bass = note("c2 c2 g2 g2 f2 f2 g2 c2 a1 a1 f2 f2 g1 g1 c2 c2")
        .s("square")
        .lpf(250)
        .gain(0.6)
        .slow(16);

      // Rich harmonic layers
      const chords = stack(
        note("c3 e3 g3 b3 ~ a2 c3 e3 ~ f3 a3 c4 ~ g2 b2 d3 f3").s("square").lpf(400).gain(0.4).slow(16),
        note("~ ~ c4 ~ e4 ~ g4 ~ ~ ~ a3 ~ c4 ~ e4 ~").s("sine").lpf(800).gain(0.3).slow(16)
      );

      // Dynamic percussion section
      const drums = stack(
        s("bd ~ sd ~ bd sd ~ sd bd ~ ~ sd").gain(0.7).slow(4),
        s("hh hh hh hh hh ~ hh hh").gain(0.3).slow(2),
        s("~ ~ ~ perc ~ perc ~ ~ ~ crash ~ ~").gain(0.4).slow(4)
      );

      // Polyrhythmic lead elements
      const polyrhythm = note("e5 g5 c6 ~ b5 ~ a5 g5")
        .s("sine")
        .gain(0.4)
        .lpf(1200)
        .delay(0.25)
        .slow(6);

      // Melodic flourishes and fills
      const flourishes = note("c6 ~ d6 ~ e6 ~ f6 ~ g6 ~ a6 ~ g6 f6 e6 d6")
        .s("sine")
        .gain(0.3)
        .room(0.5)
        .slow(16);

      return stack(melody, bass, chords, drums, polyrhythm, flourishes)
        .slow(1);
        
    } catch (error) {
      console.log(`StrudelMusic: Error creating medium mode - ${error}`);
      return note("c4 d4 e4 f4 g4 a4 b4 c5").s("sawtooth").slow(2);
    }
  }

  // Hard mode - intense, driving music with full energy
  static createHardMode(): Pattern {
    try {
      // Extended intense melody with aggressive patterns
      const melody = note("c4 ~ eb4 f4 ~ g4 bb4 c5 ~ eb5 f5 g5 ~ bb5 c6 ~ ab5 g5 f5 eb5 ~ c5 bb4 g4")
        .s("sawtooth")
        .lpf(sine.range(600, 1800).fast(8))
        .distort(0.4)
        .gain(0.9)
        .slow(6);

      // Heavy, syncopated bass
      const bass = note("c1 c2 ~ c1 f1 f2 ~ f1 g1 g2 ~ g1 bb0 bb1 ~ bb0 c1 c2 ~ c1")
        .s("square")
        .lpf(180)
        .distort(0.3)
        .gain(0.8)
        .slow(12);

      // Aggressive harmonic layers
      const chords = stack(
        note("c3 eb3 g3 ~ f3 ab3 c4 ~ g3 bb3 d4 ~ c3 eb3 g3 ~").s("square").lpf(500).distort(0.2).gain(0.6).slow(16),
        note("~ ~ bb3 ~ ~ c4 ~ ~ ~ eb4 ~ ~ ~ f4 ~ ~").s("sawtooth").lpf(800).distort(0.3).gain(0.5).slow(16)
      );

      // Driving, complex percussion
      const drums = stack(
        s("bd bd ~ bd bd ~ sd bd bd ~ sd ~ bd bd sd bd").gain(0.9).slow(4),
        s("hh ~ hh hh ~ hh hh ~ hh hh ~ hh hh ~ hh hh").gain(0.4).slow(2),
        s("~ crash ~ ~ ~ crash ~ ~ ~ ~ crash ~ ~ ~ ~ crash").gain(0.6).slow(8)
      );

      // Rapid tension arpeggios
      const arpeggios = stack(
        note("c5 eb5 g5 bb5").s("sine").gain(0.5).lpf(1500).fast(4).slow(4),
        note("~ ~ c6 ~ eb6 ~ g6 ~").s("sine").gain(0.4).lpf(2000).fast(2).slow(4)
      );

      // Intense build-ups and breakdowns
      const dynamics = sine.range(0.7, 1.4).slow(16);

      return stack(melody, bass, chords, drums, arpeggios)
        .gain(dynamics)
        .slow(0.75);
        
    } catch (error) {
      console.log(`StrudelMusic: Error creating hard mode - ${error}`);
      return note("c4 eb4 f4 g4 bb4 c5").s("sawtooth").slow(1.5);
    }
  }

  // Expert mode - complex, challenging music with maximum intensity
  static createExpertMode(): Pattern {
    try {
      // Highly complex polyrhythmic melody
      const melody = note("c4 d4 eb4 ~ f4 g4 ~ ab4 bb4 ~ c5 d5 ~ eb5 f5 ~ g5 ab5 bb5 ~ c6 bb5 ab5 g5 f5 eb5 d5")
        .s("sawtooth")
        .lpf(sine.range(700, 2200).fast(12))
        .distort(0.5)
        .crush(6)
        .gain(1.0)
        .slow(5);

      // Intricate bass patterns with chromatic movement
      const bass = note("c1 ~ c2 f1 ~ bb1 eb2 ~ ab1 db2 ~ gb1 b0 ~ e1 a1 ~ d2 g1 ~ c2")
        .s("square")
        .lpf(220)
        .distort(0.2)
        .gain(0.9)
        .slow(12);

      // Multiple harmonic layers with dissonance
      const harmony = stack(
        note("c3 eb3 gb3 bb3 ~ f3 ab3 cb4 eb4 ~ g3 bb3 db4 f4 ~ c3 eb3 gb3 bb3").s("square").lpf(600).distort(0.3).gain(0.7).slow(16),
        note("~ ~ bb4 ~ ~ c5 ~ ~ ~ eb5 ~ ~ ~ f5 ~ ~").s("sawtooth").lpf(1000).distort(0.4).gain(0.6).slow(16)
      );

      // Extremely complex percussion patterns
      const drums = stack(
        s("bd ~ bd sd ~ bd sd bd ~ sd bd ~ bd ~ sd bd").gain(1.0).slow(3),
        s("hh hh ~ hh hh ~ hh hh ~ hh ~ hh hh ~ hh hh").gain(0.5).slow(1.5),
        s("~ ~ crash ~ ~ perc ~ crash ~ ~ ~ perc ~ ~ crash ~").gain(0.7).slow(6)
      );

      // Multiple arpeggio layers
      const runs = stack(
        note("c5 d5 eb5 f5 g5 ab5 bb5 c6").s("sine").gain(0.6).lpf(1800).fast(8).slow(3),
        note("~ ~ c6 d6 eb6 f6 g6 ab6").s("sine").gain(0.5).lpf(2200).fast(6).slow(3)
      );

      // Controlled chaos elements
      const chaos = stack(
        note("c6 ~ d6 ~ eb6 ~ f6 ~ g6 ~ ab6 ~ bb6 ~ c7 ~").s("sine").gain(0.4).room(0.5).slow(32),
        noise().lpf(sine.range(1000, 3000).fast(4)).gain(0.2).slow(8)
      );

      return stack(melody, bass, harmony, drums, runs, chaos)
        .slow(0.5);
        
    } catch (error) {
      console.log(`StrudelMusic: Error creating expert mode - ${error}`);
      return note("c4 d4 eb4 f4 g4 ab4 bb4 c5").s("sawtooth").slow(3);
    }
  }

  // Zen mode - calm, meditative music with extended ambient composition
  static createZenMode(): Pattern {
    try {
      // Extended peaceful melody with natural flow
      const melody = note("c4 ~ e4 ~ g4 ~ b4 ~ d5 ~ g4 ~ e4 ~ c4 ~ ~ ~ a3 ~ c4 ~ e4 ~ g4 ~ b4 ~ d5 ~ ~ ~")
        .s("sine")
        .lpf(600)
        .room(0.8)
        .delay(0.5)
        .gain(0.5)
        .slow(24);

      // Deep, resonant bass with subtle movement
      const bass = note("c1 ~ ~ ~ ~ ~ g1 ~ ~ ~ ~ ~ f1 ~ ~ ~ ~ ~ a1 ~ ~ ~ ~ ~")
        .s("sine")
        .lpf(100)
        .room(0.6)
        .gain(0.3)
        .slow(48);

      // Layered ambient pads
      const pad = stack(
        note("c3 e3 g3 b3 d4 ~ a2 c3 e3 g3 ~ f3 a3 c4 e4 ~ g2 b2 d3 f3 g3").s("sine").lpf(300).room(0.9).gain(0.2).slow(64),
        note("~ ~ ~ c4 ~ ~ ~ e4 ~ ~ ~ g4 ~ ~ ~ b4").s("sine").lpf(400).room(0.8).gain(0.15).slow(32)
      );

      // Natural ambient textures
      const nature = stack(
        noise().lpf(200).hpf(50).room(0.7).gain(0.1).slow(64),
        noise().lpf(100).hpf(20).room(0.9).gain(0.05).slow(128)
      );

      // Multiple bell layers for depth
      const bells = stack(
        note("c5 ~ ~ e5 ~ ~ g5 ~ ~ c6 ~ ~ ~ ~ ~ ~").s("sine").gain(0.3).room(0.9).delay(0.75).slow(32),
        note("~ ~ ~ ~ e6 ~ ~ ~ ~ g6 ~ ~ ~ ~ ~ ~").s("sine").gain(0.2).room(0.95).delay(1.0).slow(32)
      );

      // Gentle water-like arpeggios
      const water = note("c5 ~ e5 ~ g5 ~ ~ ~ e5 ~ g5 ~ c6 ~ ~ ~")
        .s("sine")
        .gain(0.25)
        .lpf(800)
        .room(0.9)
        .delay(0.8)
        .slow(48);

      // Slow breathing rhythm
      const breath = sine.range(0.7, 1.1).slow(40);

      return stack(melody, bass, pad, nature, bells, water)
        .gain(breath)
        .slow(1);
        
    } catch (error) {
      console.log(`StrudelMusic: Error creating zen mode - ${error}`);
      return note("c4 e4 g4 b4").s("sine").slow(8);
    }
  }

  // Additional compositions for special states

  // Game over music - sympathetic and encouraging
  static createGameOverMusic(): Pattern {
    try {
      const melody = note("c4 bb3 ab3 g3 f3 ~ ~ ~")
        .s("sine")
        .lpf(500)
        .room(0.6)
        .gain(0.6)
        .slow(8);

      const harmony = note("c3 eb3 g3 ~ ab2 c3 eb3 ~ f3 ab3 c4 ~ g2 b2 d3 ~")
        .s("square")
        .lpf(300)
        .room(0.8)
        .gain(0.4)
        .slow(16);

      return stack(melody, harmony).slow(1);
    } catch (error) {
      console.log(`StrudelMusic: Error creating game over music - ${error}`);
      return note("c4 bb3 g3 f3").s("sine").slow(4);
    }
  }

  // Victory music - celebratory and uplifting
  static createVictoryMusic(): Pattern {
    try {
      const fanfare = note("c4 e4 g4 c5 e5 g5 c6")
        .s("sawtooth")
        .lpf(1200)
        .gain(0.8)
        .slow(2);

      const celebration = s("bd bd sd bd crash").gain(0.9).slow(1);

      return stack(fanfare, celebration).slow(1);
    } catch (error) {
      console.log(`StrudelMusic: Error creating victory music - ${error}`);
      return note("c4 e4 g4 c5").s("sine").slow(1);
    }
  }

  // Pause music - subdued version of current theme
  static createPauseMusic(): Pattern {
    try {
      return note("c4 ~ e4 ~ g4 ~ c5 ~")
        .s("sine")
        .lpf(400)
        .room(0.9)
        .gain(0.3)
        .slow(8);
    } catch (error) {
      console.log(`StrudelMusic: Error creating pause music - ${error}`);
      return note("c4 e4 g4").s("sine").slow(6);
    }
  }

  // Music transition methods for smooth scene changes
  static createTransition(fromPattern: Pattern, toPattern: Pattern, duration: number = 4): Pattern {
    try {
      // Create a crossfade transition between patterns
      const fadeOut = fromPattern.gain(sine.range(1, 0).slow(duration));
      const fadeIn = toPattern.gain(sine.range(0, 1).slow(duration));
      
      return stack(fadeOut, fadeIn);
    } catch (error) {
      console.log(`StrudelMusic: Error creating transition - ${error}`);
      return toPattern;
    }
  }

  // Variation system for dynamic music adaptation
  static addVariation(basePattern: Pattern, variationType: 'subtle' | 'moderate' | 'dramatic' = 'subtle'): Pattern {
    try {
      switch (variationType) {
        case 'subtle':
          // Add subtle high notes occasionally
          const subtleVariation = note("c6 ~ ~ ~ ~ ~ ~ ~")
            .s("sine")
            .gain(0.2)
            .room(0.8)
            .slow(8);
          return stack(basePattern, subtleVariation);
        
        case 'moderate':
          // Add volume variations
          const moderateGain = sine.range(0.8, 1.2).slow(8);
          return basePattern.gain(moderateGain);
        
        case 'dramatic':
          // Add speed variations and extra notes
          const dramaticVariation = note("c5 e5 g5")
            .s("sine")
            .gain(0.4)
            .fast(2)
            .slow(4);
          return stack(basePattern.fast(sine.range(0.8, 1.2).slow(4)), dramaticVariation);
        
        default:
          return basePattern;
      }
    } catch (error) {
      console.log(`StrudelMusic: Error adding variation - ${error}`);
      return basePattern;
    }
  }

  // Dynamic adaptation based on game state
  static adaptToGameState(basePattern: Pattern, gameState: {
    intensity?: number;
    speed?: number;
    tension?: number;
  }): Pattern {
    try {
      let adaptedPattern = basePattern;

      // Adjust intensity (0-1)
      if (gameState.intensity !== undefined) {
        const intensityGain = 0.5 + (gameState.intensity * 0.5);
        adaptedPattern = adaptedPattern.gain(intensityGain);
      }

      // Adjust speed (0.5-2.0)
      if (gameState.speed !== undefined) {
        const speedMultiplier = 0.5 + (gameState.speed * 1.5);
        adaptedPattern = adaptedPattern.fast(speedMultiplier);
      }

      // Adjust tension with filter modulation
      if (gameState.tension !== undefined) {
        const filterRange = 400 + (gameState.tension * 1200);
        adaptedPattern = adaptedPattern.lpf(sine.range(200, filterRange).slow(4));
      }

      return adaptedPattern;
    } catch (error) {
      console.log(`StrudelMusic: Error adapting to game state - ${error}`);
      return basePattern;
    }
  }
}
