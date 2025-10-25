import { context, reddit } from '@devvit/web/server';

export const createPost = async () => {
  const { subredditName } = context;
  if (!subredditName) {
    throw new Error('subredditName is required');
  }

  console.log('🎮 Creating Dicetrix post for subreddit:', subredditName);

  try {
    // Ultra-minimal configuration to avoid any potential rendering issues
    const postConfig = {
      splash: {
        appDisplayName: 'Dicetrix',
        buttonLabel: 'Play',
        description: 'Dice matching puzzle game',
        heading: 'Dicetrix Game',
      },
      postData: {
        gameState: 'initial',
        score: 0,
      },
      subredditName: subredditName,
      title: 'Dicetrix Game',
    };

    console.log('📋 Post configuration:', JSON.stringify(postConfig, null, 2));
    
    const result = await reddit.submitCustomPost(postConfig);
    
    console.log('✅ Post created successfully:', result.id);
    return result;
    
  } catch (error) {
    console.error('❌ Post creation failed:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      subredditName,
    });
    throw new Error(`Failed to create post: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};
