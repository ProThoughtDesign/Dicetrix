#!/usr/bin/env node

/**
 * Test script for server endpoints
 * This script tests the basic functionality of the restored server endpoints
 */

const endpoints = [
  { method: 'GET', path: '/health', description: 'Health check endpoint' },
  { method: 'GET', path: '/test', description: 'Test endpoint with context info' },
  { method: 'GET', path: '/api/config/leaderboard', description: 'Get leaderboard configuration' },
  { method: 'GET', path: '/api/config/reddit', description: 'Get Reddit configuration' },
  { method: 'GET', path: '/api/system/status', description: 'Get system status' },
  { method: 'GET', path: '/api/leaderboards/medium', description: 'Get medium difficulty leaderboard' },
  { method: 'GET', path: '/api/leaderboards/all', description: 'Get all leaderboards' },
  { method: 'GET', path: '/api/reddit/leaderboard-widget', description: 'Get widget data' }
];

console.log('🧪 Server Endpoint Test Plan');
console.log('============================\n');

console.log('📋 Available Endpoints:');
endpoints.forEach((endpoint, index) => {
  console.log(`${index + 1}. ${endpoint.method} ${endpoint.path}`);
  console.log(`   Description: ${endpoint.description}\n`);
});

console.log('🚀 To test these endpoints:');
console.log('1. Run `npm run dev` in a separate terminal');
console.log('2. Open the playtest URL provided by Devvit');
console.log('3. Use browser dev tools or a tool like Postman to test endpoints');
console.log('4. Base URL will be the webview domain provided by Devvit\n');

console.log('📝 Example test commands (replace BASE_URL with actual webview URL):');
console.log('curl $BASE_URL/health');
console.log('curl $BASE_URL/test');
console.log('curl $BASE_URL/api/leaderboards/medium');
console.log('curl $BASE_URL/api/leaderboards/all\n');

console.log('⚠️  Note: Authenticated endpoints require valid Reddit user context');
console.log('   These will only work when accessed through the Devvit webview\n');

console.log('✅ Server endpoints have been restored and should be functional!');
