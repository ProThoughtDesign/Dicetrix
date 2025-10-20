import { context, reddit } from '@devvit/web/server';

export const createPost = async () => {
  const { subredditName } = context;
  if (!subredditName) {
    throw new Error('subredditName is required');
  }

  return await reddit.submitCustomPost({
    splash: {
      // Splash screen customization
      appDisplayName: 'Dicetrix',
      backgroundUri: 'default-splash.png',
      buttonLabel: 'Play Dicetrix',
      description: 'A gravity-matching puzzle game combining Tetris-style mechanics with dice-based matching',
      heading: 'Welcome to Dicetrix!',
      appIconUri: 'default-icon.png',
    },
    postData: {
      gameState: 'initial',
      score: 0,
    },
    subredditName: subredditName,
    title: 'Dicetrix - Dice Matching Puzzle Game',
  });
};
