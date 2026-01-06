/**
 * Test script for Gemini Vision API Integration
 */

require('dotenv').config();

const geminiService = require('./src/services/geminiService');
const visionAnalysisService = require('./src/services/visionAnalysisService');

async function testGeminiIntegration() {
  console.log('=== Testing Gemini Vision API Integration ===\n');

  // Test 1: Check Quota Info
  console.log('1. Checking Gemini API quota info...');
  const quotaInfo = geminiService.checkQuota();
  console.log(JSON.stringify(quotaInfo, null, 2));
  console.log();

  // Test 2: Check if API key is configured
  console.log('2. Checking API key configuration...');
  if (!quotaInfo.configured) {
    console.log('WARNING: GEMINI_API_KEY is not configured properly!');
    console.log('Please set a valid API key in the .env file');
    console.log('Current value:', process.env.GEMINI_API_KEY);
    console.log();
  } else {
    console.log('API key is configured.');
    console.log();
  }

  // Test 3: Get usage stats
  console.log('3. Getting usage statistics...');
  try {
    const usageStats = await visionAnalysisService.getUsageStats();
    console.log(JSON.stringify(usageStats, null, 2));
    console.log();
  } catch (error) {
    console.error('Error getting usage stats:', error.message);
    console.log();
  }

  // Test 4: Test API connection (only if API key is configured)
  if (quotaInfo.configured) {
    console.log('4. Testing Gemini API connection...');
    try {
      const testResult = await geminiService.testConnection();
      console.log('Connection test result:', testResult.success ? 'SUCCESS' : 'FAILED');
      if (testResult.success) {
        console.log('Response:', testResult.response);
      } else {
        console.log('Error:', testResult.error);
      }
      console.log();
    } catch (error) {
      console.error('Error testing connection:', error.message);
      console.log();
    }
  } else {
    console.log('4. Skipping API connection test (API key not configured)');
    console.log();
  }

  console.log('=== Test Complete ===');
}

// Run the test
testGeminiIntegration()
  .then(() => {
    console.log('\nAll tests completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\nTest failed with error:', error);
    process.exit(1);
  });
