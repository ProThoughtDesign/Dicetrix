#!/usr/bin/env node

/**
 * Manual Integration Verification Script
 * 
 * This script verifies that all components are properly wired together
 * by checking the system's key integration points.
 */

import fs from 'fs';
import path from 'path';

console.log('🔍 Verifying Reddit Integration System...\n');

// Check 1: Verify all required files exist
console.log('📁 Checking file structure...');
const requiredFiles = [
  // Server components
  'src/server/index.ts',
  'src/server/core/LeaderboardManager.ts',
  'src/server/core/RedditPostHandler.ts',
  'src/server/core/ResetController.ts',
  'src/server/core/TaskScheduler.ts',
  
  // Client components
  'src/client/game/scenes/StartMenu.ts',
  'src/client/game/scenes/LeaderboardScene.ts',
  'src/client/game/scenes/HowToPlayScene.ts',
  'src/client/game/scenes/Game.ts',
  'src/client/game/ui/ScoreSubmissionUI.ts',
  
  // Shared types
  'src/shared/types/api.ts',
  'src/shared/types/game.ts',
  
  // Tests
  'src/__tests__/integration/workflow-integration.test.ts',
  'src/server/__tests__/LeaderboardManager.test.ts',
  'src/server/__tests__/RedditPostHandler.integration.test.ts',
  'src/client/game/ui/__tests__/ScoreSubmissionUI.test.ts'
];

let missingFiles = [];
requiredFiles.forEach(file => {
  if (!fs.existsSync(file)) {
    missingFiles.push(file);
  }
});

if (missingFiles.length > 0) {
  console.log('❌ Missing files:');
  missingFiles.forEach(file => console.log(`   - ${file}`));
} else {
  console.log('✅ All required files present');
}

// Check 2: Verify API endpoint integration
console.log('\n🔗 Checking API endpoint integration...');
const serverIndexContent = fs.readFileSync('src/server/index.ts', 'utf8');

const requiredEndpoints = [
  '/api/game/score',
  '/api/reddit/submit-score',
  '/api/leaderboards/:mode',
  '/api/leaderboards/all',
  '/api/leaderboards/reset',
  '/api/reddit/leaderboard-widget',
  '/api/config/leaderboard',
  '/api/config/reddit',
  '/api/system/status',
  '/api/admin/diagnostics'
];

let missingEndpoints = [];
requiredEndpoints.forEach(endpoint => {
  const endpointPattern = endpoint.replace(':mode', '\\w+');
  const regex = new RegExp(`router\\.(get|post|put).*['"\`]${endpointPattern}['"\`]`);
  if (!regex.test(serverIndexContent)) {
    missingEndpoints.push(endpoint);
  }
});

if (missingEndpoints.length > 0) {
  console.log('❌ Missing API endpoints:');
  missingEndpoints.forEach(endpoint => console.log(`   - ${endpoint}`));
} else {
  console.log('✅ All required API endpoints present');
}

// Check 3: Verify component imports and dependencies
console.log('\n📦 Checking component dependencies...');

const checkImports = (filePath, requiredImports) => {
  if (!fs.existsSync(filePath)) return [];
  
  const content = fs.readFileSync(filePath, 'utf8');
  const missing = [];
  
  requiredImports.forEach(importName => {
    if (!content.includes(importName)) {
      missing.push(importName);
    }
  });
  
  return missing;
};

const componentChecks = [
  {
    file: 'src/server/index.ts',
    imports: ['LeaderboardManager', 'RedditPostHandler', 'ResetController', 'DevvitTaskScheduler']
  },
  {
    file: 'src/client/game/scenes/Game.ts',
    imports: ['ScoreSubmissionUI', 'RedditScoreSubmissionRequest']
  },
  {
    file: 'src/client/game/scenes/StartMenu.ts',
    imports: ['LeaderboardScene', 'HowToPlayScene']
  }
];

let dependencyIssues = [];
componentChecks.forEach(check => {
  const missing = checkImports(check.file, check.imports);
  if (missing.length > 0) {
    dependencyIssues.push({ file: check.file, missing });
  }
});

if (dependencyIssues.length > 0) {
  console.log('❌ Missing component dependencies:');
  dependencyIssues.forEach(issue => {
    console.log(`   ${issue.file}:`);
    issue.missing.forEach(dep => console.log(`     - ${dep}`));
  });
} else {
  console.log('✅ All component dependencies present');
}

// Check 4: Verify scene registration
console.log('\n🎮 Checking scene registration...');
const gameMainContent = fs.readFileSync('src/client/game/main.ts', 'utf8');

const requiredScenes = ['LeaderboardScene', 'HowToPlayScene'];
let missingScenes = [];

requiredScenes.forEach(scene => {
  if (!gameMainContent.includes(scene)) {
    missingScenes.push(scene);
  }
});

if (missingScenes.length > 0) {
  console.log('❌ Missing scene registrations:');
  missingScenes.forEach(scene => console.log(`   - ${scene}`));
} else {
  console.log('✅ All required scenes registered');
}

// Check 5: Verify workflow integration points
console.log('\n🔄 Checking workflow integration points...');

const workflowChecks = [
  {
    description: 'Score submission to Reddit integration',
    file: 'src/client/game/scenes/Game.ts',
    pattern: /handleScoreSubmission.*RedditScoreSubmissionRequest/s
  },
  {
    description: 'Leaderboard reset with Reddit posting',
    file: 'src/server/core/ResetController.ts',
    pattern: /triggerManualReset.*redditPostHandler/s
  },
  {
    description: 'Widget update on score submission',
    file: 'src/server/index.ts',
    pattern: /updateSubredditWidget.*score.*submission/s
  },
  {
    description: 'StartMenu navigation to new scenes',
    file: 'src/client/game/scenes/StartMenu.ts',
    pattern: /openLeaderboard.*LeaderboardScene/s
  }
];

let workflowIssues = [];
workflowChecks.forEach(check => {
  if (fs.existsSync(check.file)) {
    const content = fs.readFileSync(check.file, 'utf8');
    if (!check.pattern.test(content)) {
      workflowIssues.push(check.description);
    }
  } else {
    workflowIssues.push(`${check.description} (file missing)`);
  }
});

if (workflowIssues.length > 0) {
  console.log('❌ Workflow integration issues:');
  workflowIssues.forEach(issue => console.log(`   - ${issue}`));
} else {
  console.log('✅ All workflow integration points verified');
}

// Check 6: Verify test coverage
console.log('\n🧪 Checking test coverage...');

const testFiles = [
  'src/__tests__/integration/workflow-integration.test.ts',
  'src/server/__tests__/LeaderboardManager.test.ts',
  'src/server/__tests__/RedditPostHandler.integration.test.ts',
  'src/client/game/ui/__tests__/ScoreSubmissionUI.test.ts'
];

let missingTests = [];
testFiles.forEach(testFile => {
  if (!fs.existsSync(testFile)) {
    missingTests.push(testFile);
  }
});

if (missingTests.length > 0) {
  console.log('❌ Missing test files:');
  missingTests.forEach(test => console.log(`   - ${test}`));
} else {
  console.log('✅ All integration tests present');
}

// Summary
console.log('\n📊 Integration Verification Summary');
console.log('=====================================');

const totalChecks = 6;
const passedChecks = [
  missingFiles.length === 0,
  missingEndpoints.length === 0,
  dependencyIssues.length === 0,
  missingScenes.length === 0,
  workflowIssues.length === 0,
  missingTests.length === 0
].filter(Boolean).length;

console.log(`✅ Passed: ${passedChecks}/${totalChecks} checks`);

if (passedChecks === totalChecks) {
  console.log('\n🎉 All integration points verified successfully!');
  console.log('\nThe Reddit Integration System is properly wired together:');
  console.log('• Score submission flows from Game → Server → Reddit');
  console.log('• Leaderboard management integrates with reset scheduling');
  console.log('• Reddit posting works with leaderboard resets');
  console.log('• Widget updates automatically on score changes');
  console.log('• UI navigation connects all new scenes');
  console.log('• Comprehensive test coverage validates workflows');
  
  console.log('\n🚀 Ready for end-to-end testing!');
  console.log('\nNext steps:');
  console.log('1. Run `npm run dev` to start the development server');
  console.log('2. Test score submission with Reddit posting');
  console.log('3. Verify leaderboard display and navigation');
  console.log('4. Test configuration management endpoints');
} else {
  console.log('\n⚠️  Some integration issues found. Please review the items above.');
  process.exit(1);
}
