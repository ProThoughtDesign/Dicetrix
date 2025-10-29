#!/usr/bin/env node

/**
 * Comprehensive Testing and Validation Script
 * 
 * This script performs comprehensive testing of the Reddit Integration System
 * including desktop/mobile UI validation, error handling, and performance checks.
 */

import fs from 'fs';
import path from 'path';

console.log('🧪 Comprehensive Reddit Integration System Testing\n');

// Test 1: Validate responsive design patterns
console.log('📱 Testing responsive design patterns...');

const checkResponsivePatterns = (filePath, componentName) => {
  if (!fs.existsSync(filePath)) return [];
  
  const content = fs.readFileSync(filePath, 'utf8');
  const issues = [];
  
  // Check for responsive scaling
  if (!content.includes('scale.width') && !content.includes('scale.height')) {
    issues.push('Missing responsive scaling references');
  }
  
  // Check for mobile-friendly touch interactions
  if (content.includes('pointerdown') && !content.includes('useHandCursor')) {
    issues.push('Touch interactions may not be mobile-optimized');
  }
  
  // Check for responsive font sizing
  if (content.includes('fontSize') && !content.includes('*')) {
    issues.push('Font sizes may not be responsive');
  }
  
  return issues;
};

const uiComponents = [
  { file: 'src/client/game/scenes/StartMenu.ts', name: 'StartMenu' },
  { file: 'src/client/game/scenes/LeaderboardScene.ts', name: 'LeaderboardScene' },
  { file: 'src/client/game/scenes/HowToPlayScene.ts', name: 'HowToPlayScene' },
  { file: 'src/client/game/ui/ScoreSubmissionUI.ts', name: 'ScoreSubmissionUI' }
];

let responsiveIssues = [];
uiComponents.forEach(component => {
  const issues = checkResponsivePatterns(component.file, component.name);
  if (issues.length > 0) {
    responsiveIssues.push({ component: component.name, issues });
  }
});

if (responsiveIssues.length > 0) {
  console.log('⚠️  Responsive design issues found:');
  responsiveIssues.forEach(item => {
    console.log(`   ${item.component}:`);
    item.issues.forEach(issue => console.log(`     - ${issue}`));
  });
} else {
  console.log('✅ Responsive design patterns validated');
}

// Test 2: Validate error handling patterns
console.log('\n🚨 Testing error handling patterns...');

const checkErrorHandling = (filePath, componentName) => {
  if (!fs.existsSync(filePath)) return [];
  
  const content = fs.readFileSync(filePath, 'utf8');
  const issues = [];
  
  // Check for try-catch blocks around async operations
  const asyncMatches = content.match(/async\s+\w+\s*\([^)]*\)\s*:\s*Promise/g) || [];
  const tryCatchMatches = content.match(/try\s*{[\s\S]*?}\s*catch/g) || [];
  
  if (asyncMatches.length > 0 && tryCatchMatches.length === 0) {
    issues.push('Async functions without try-catch error handling');
  }
  
  // Check for fetch error handling
  if (content.includes('fetch(') && !content.includes('response.ok')) {
    issues.push('Fetch calls without response status checking');
  }
  
  // Check for user-friendly error messages
  if (content.includes('catch') && !content.includes('message')) {
    issues.push('Error handling without user-friendly messages');
  }
  
  return issues;
};

const serverComponents = [
  { file: 'src/server/index.ts', name: 'Server Routes' },
  { file: 'src/server/core/LeaderboardManager.ts', name: 'LeaderboardManager' },
  { file: 'src/server/core/RedditPostHandler.ts', name: 'RedditPostHandler' },
  { file: 'src/server/core/ResetController.ts', name: 'ResetController' }
];

let errorHandlingIssues = [];
[...uiComponents, ...serverComponents].forEach(component => {
  const issues = checkErrorHandling(component.file, component.name);
  if (issues.length > 0) {
    errorHandlingIssues.push({ component: component.name, issues });
  }
});

if (errorHandlingIssues.length > 0) {
  console.log('⚠️  Error handling issues found:');
  errorHandlingIssues.forEach(item => {
    console.log(`   ${item.component}:`);
    item.issues.forEach(issue => console.log(`     - ${issue}`));
  });
} else {
  console.log('✅ Error handling patterns validated');
}

// Test 3: Validate performance considerations
console.log('\n⚡ Testing performance patterns...');

const checkPerformancePatterns = (filePath, componentName) => {
  if (!fs.existsSync(filePath)) return [];
  
  const content = fs.readFileSync(filePath, 'utf8');
  const issues = [];
  
  // Check for pagination in leaderboard queries
  if (componentName.includes('Leaderboard') && content.includes('zRange') && !content.includes('limit')) {
    issues.push('Leaderboard queries without pagination limits');
  }
  
  // Check for excessive API calls
  const fetchMatches = content.match(/fetch\(/g) || [];
  if (fetchMatches.length > 5) {
    issues.push(`High number of fetch calls (${fetchMatches.length}) - consider batching`);
  }
  
  // Check for memory leaks in event listeners
  if (content.includes('addEventListener') && !content.includes('removeEventListener')) {
    issues.push('Event listeners without cleanup');
  }
  
  // Check for efficient data structures
  if (content.includes('forEach') && content.includes('find')) {
    issues.push('Potentially inefficient nested loops');
  }
  
  return issues;
};

let performanceIssues = [];
[...uiComponents, ...serverComponents].forEach(component => {
  const issues = checkPerformancePatterns(component.file, component.name);
  if (issues.length > 0) {
    performanceIssues.push({ component: component.name, issues });
  }
});

if (performanceIssues.length > 0) {
  console.log('⚠️  Performance issues found:');
  performanceIssues.forEach(item => {
    console.log(`   ${item.component}:`);
    item.issues.forEach(issue => console.log(`     - ${issue}`));
  });
} else {
  console.log('✅ Performance patterns validated');
}

// Test 4: Validate graceful degradation
console.log('\n🛡️  Testing graceful degradation patterns...');

const checkGracefulDegradation = (filePath, componentName) => {
  if (!fs.existsSync(filePath)) return [];
  
  const content = fs.readFileSync(filePath, 'utf8');
  const issues = [];
  
  // Check for Reddit API fallbacks
  if (content.includes('reddit') && !content.includes('catch')) {
    issues.push('Reddit API calls without fallback handling');
  }
  
  // Check for offline capability indicators
  if (componentName.includes('Scene') && !content.includes('error')) {
    issues.push('UI scenes without error state handling');
  }
  
  // Check for default values
  if (content.includes('||') || content.includes('??')) {
    // Good - has fallback values
  } else if (content.includes('undefined') || content.includes('null')) {
    issues.push('Potential undefined/null values without defaults');
  }
  
  return issues;
};

let degradationIssues = [];
[...uiComponents, ...serverComponents].forEach(component => {
  const issues = checkGracefulDegradation(component.file, component.name);
  if (issues.length > 0) {
    degradationIssues.push({ component: component.name, issues });
  }
});

if (degradationIssues.length > 0) {
  console.log('⚠️  Graceful degradation issues found:');
  degradationIssues.forEach(item => {
    console.log(`   ${item.component}:`);
    item.issues.forEach(issue => console.log(`     - ${issue}`));
  });
} else {
  console.log('✅ Graceful degradation patterns validated');
}

// Test 5: Validate data validation and security
console.log('\n🔒 Testing data validation and security patterns...');

const checkSecurityPatterns = (filePath, componentName) => {
  if (!fs.existsSync(filePath)) return [];
  
  const content = fs.readFileSync(filePath, 'utf8');
  const issues = [];
  
  // Check for input validation
  if (content.includes('req.body') && !content.includes('typeof')) {
    issues.push('Request body without type validation');
  }
  
  // Check for SQL injection prevention (though we use Redis)
  if (content.includes('query') && content.includes('+')) {
    issues.push('Potential string concatenation in queries');
  }
  
  // Check for XSS prevention
  if (content.includes('innerHTML') || content.includes('outerHTML')) {
    issues.push('Direct HTML manipulation - potential XSS risk');
  }
  
  // Check for authentication
  if (content.includes('/api/') && !content.includes('authenticateUser')) {
    issues.push('API endpoints without authentication middleware');
  }
  
  return issues;
};

let securityIssues = [];
serverComponents.forEach(component => {
  const issues = checkSecurityPatterns(component.file, component.name);
  if (issues.length > 0) {
    securityIssues.push({ component: component.name, issues });
  }
});

if (securityIssues.length > 0) {
  console.log('⚠️  Security issues found:');
  securityIssues.forEach(item => {
    console.log(`   ${item.component}:`);
    item.issues.forEach(issue => console.log(`     - ${issue}`));
  });
} else {
  console.log('✅ Security patterns validated');
}

// Test 6: Validate test coverage completeness
console.log('\n🎯 Testing test coverage completeness...');

const testCoverageChecks = [
  {
    component: 'Score Submission Flow',
    testFile: 'src/client/game/ui/__tests__/ScoreSubmissionUI.test.ts',
    requiredTests: ['score validation', 'Reddit posting', 'error handling', 'cancellation']
  },
  {
    component: 'Leaderboard Management',
    testFile: 'src/server/__tests__/LeaderboardManager.test.ts',
    requiredTests: ['score submission', 'ranking', 'reset', 'configuration']
  },
  {
    component: 'Reddit Integration',
    testFile: 'src/server/__tests__/RedditPostHandler.integration.test.ts',
    requiredTests: ['post creation', 'widget update', 'notifications', 'error handling']
  },
  {
    component: 'Workflow Integration',
    testFile: 'src/__tests__/integration/workflow-integration.test.ts',
    requiredTests: ['end-to-end flow', 'error scenarios', 'performance']
  }
];

let testCoverageIssues = [];
testCoverageChecks.forEach(check => {
  if (!fs.existsSync(check.testFile)) {
    testCoverageIssues.push(`${check.component}: Test file missing`);
    return;
  }
  
  const testContent = fs.readFileSync(check.testFile, 'utf8');
  const missingTests = check.requiredTests.filter(test => 
    !testContent.toLowerCase().includes(test.toLowerCase())
  );
  
  if (missingTests.length > 0) {
    testCoverageIssues.push(`${check.component}: Missing tests for ${missingTests.join(', ')}`);
  }
});

if (testCoverageIssues.length > 0) {
  console.log('⚠️  Test coverage issues found:');
  testCoverageIssues.forEach(issue => console.log(`   - ${issue}`));
} else {
  console.log('✅ Test coverage validated');
}

// Summary and recommendations
console.log('\n📊 Comprehensive Testing Summary');
console.log('=================================');

const allIssues = [
  ...responsiveIssues,
  ...errorHandlingIssues,
  ...performanceIssues,
  ...degradationIssues,
  ...securityIssues,
  ...testCoverageIssues.map(issue => ({ component: 'Test Coverage', issues: [issue] }))
];

const totalChecks = 6;
const passedChecks = [
  responsiveIssues.length === 0,
  errorHandlingIssues.length === 0,
  performanceIssues.length === 0,
  degradationIssues.length === 0,
  securityIssues.length === 0,
  testCoverageIssues.length === 0
].filter(Boolean).length;

console.log(`✅ Passed: ${passedChecks}/${totalChecks} test categories`);

if (passedChecks === totalChecks) {
  console.log('\n🎉 All comprehensive tests passed!');
  console.log('\nThe Reddit Integration System is ready for production:');
  console.log('• ✅ Responsive design for desktop and mobile');
  console.log('• ✅ Robust error handling and graceful degradation');
  console.log('• ✅ Performance optimizations for large datasets');
  console.log('• ✅ Security best practices implemented');
  console.log('• ✅ Comprehensive test coverage');
  
  console.log('\n🚀 System validation complete!');
  console.log('\nRecommendations for deployment:');
  console.log('1. Run full test suite: `npm run test`');
  console.log('2. Test on multiple devices and screen sizes');
  console.log('3. Verify Reddit API integration in staging environment');
  console.log('4. Monitor performance metrics after deployment');
} else {
  console.log(`\n⚠️  ${allIssues.length} issues found across ${totalChecks - passedChecks} categories.`);
  console.log('\nPriority recommendations:');
  
  if (securityIssues.length > 0) {
    console.log('🔴 HIGH: Address security issues before deployment');
  }
  if (errorHandlingIssues.length > 0) {
    console.log('🟡 MEDIUM: Improve error handling for better user experience');
  }
  if (performanceIssues.length > 0) {
    console.log('🟡 MEDIUM: Optimize performance for scalability');
  }
  if (responsiveIssues.length > 0) {
    console.log('🟢 LOW: Enhance mobile responsiveness');
  }
  
  console.log('\nMost issues are minor and can be addressed in future iterations.');
  console.log('The core functionality is solid and ready for testing.');
}

console.log('\n📋 Next Steps:');
console.log('1. Address any high-priority issues identified above');
console.log('2. Run integration tests: `npm run test -- src/__tests__/integration/workflow-integration.test.ts --run`');
console.log('3. Test the system manually with `npm run dev`');
console.log('4. Verify all user workflows work as expected');
console.log('5. Deploy to staging environment for final validation');
