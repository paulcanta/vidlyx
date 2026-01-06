/**
 * Test script for Folder and Tag CRUD APIs
 * This script tests all endpoints to ensure they work correctly
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:4051';

// Color codes for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Test state
let authCookie = '';
let createdFolderId = '';
let createdTagId = '';

async function testAuth() {
  log('\n=== Testing Authentication ===', 'blue');

  try {
    // Register a test user
    const email = `test-${Date.now()}@example.com`;
    const password = 'TestPassword123!';

    log(`Registering user: ${email}`, 'yellow');
    const registerResponse = await axios.post(`${BASE_URL}/api/auth/register`, {
      email,
      password,
      name: 'Test User'
    });

    log('Registration successful', 'green');

    // Extract session cookie
    authCookie = registerResponse.headers['set-cookie']?.[0] || '';

    if (!authCookie) {
      log('Warning: No session cookie received', 'yellow');
    }

    return true;
  } catch (error) {
    // If registration fails, try logging in with existing user
    try {
      log('Registration failed, trying login with test@example.com', 'yellow');
      const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
        email: 'test@example.com',
        password: 'password123'
      });

      authCookie = loginResponse.headers['set-cookie']?.[0] || '';
      log('Login successful', 'green');
      return true;
    } catch (loginError) {
      log(`Authentication failed: ${loginError.message}`, 'red');
      return false;
    }
  }
}

async function testCreateFolder() {
  log('\n=== Testing POST /api/folders (Create Folder) ===', 'blue');

  try {
    const response = await axios.post(
      `${BASE_URL}/api/folders`,
      {
        name: 'My Test Folder',
        color: '#3b82f6'
      },
      {
        headers: {
          Cookie: authCookie
        }
      }
    );

    createdFolderId = response.data.folder.id;
    log(`Folder created successfully: ${response.data.folder.name} (ID: ${createdFolderId})`, 'green');
    log(`Response: ${JSON.stringify(response.data, null, 2)}`, 'yellow');
    return true;
  } catch (error) {
    log(`Error: ${error.response?.data?.error || error.message}`, 'red');
    return false;
  }
}

async function testGetFolders() {
  log('\n=== Testing GET /api/folders (Get All Folders) ===', 'blue');

  try {
    const response = await axios.get(`${BASE_URL}/api/folders`, {
      headers: {
        Cookie: authCookie
      }
    });

    log(`Found ${response.data.count} folder(s)`, 'green');
    log(`Response: ${JSON.stringify(response.data, null, 2)}`, 'yellow');
    return true;
  } catch (error) {
    log(`Error: ${error.response?.data?.error || error.message}`, 'red');
    return false;
  }
}

async function testGetFolderById() {
  log('\n=== Testing GET /api/folders/:id (Get Folder by ID) ===', 'blue');

  if (!createdFolderId) {
    log('Skipping: No folder ID available', 'yellow');
    return false;
  }

  try {
    const response = await axios.get(`${BASE_URL}/api/folders/${createdFolderId}`, {
      headers: {
        Cookie: authCookie
      }
    });

    log(`Folder retrieved: ${response.data.folder.name}`, 'green');
    log(`Response: ${JSON.stringify(response.data, null, 2)}`, 'yellow');
    return true;
  } catch (error) {
    log(`Error: ${error.response?.data?.error || error.message}`, 'red');
    return false;
  }
}

async function testUpdateFolder() {
  log('\n=== Testing PUT /api/folders/:id (Update Folder) ===', 'blue');

  if (!createdFolderId) {
    log('Skipping: No folder ID available', 'yellow');
    return false;
  }

  try {
    const response = await axios.put(
      `${BASE_URL}/api/folders/${createdFolderId}`,
      {
        name: 'Updated Folder Name',
        color: '#ef4444'
      },
      {
        headers: {
          Cookie: authCookie
        }
      }
    );

    log(`Folder updated: ${response.data.folder.name}`, 'green');
    log(`Response: ${JSON.stringify(response.data, null, 2)}`, 'yellow');
    return true;
  } catch (error) {
    log(`Error: ${error.response?.data?.error || error.message}`, 'red');
    return false;
  }
}

async function testCreateTag() {
  log('\n=== Testing POST /api/tags (Create Tag) ===', 'blue');

  try {
    const response = await axios.post(
      `${BASE_URL}/api/tags`,
      {
        name: 'Important',
        color: '#ef4444'
      },
      {
        headers: {
          Cookie: authCookie
        }
      }
    );

    createdTagId = response.data.tag.id;
    log(`Tag created successfully: ${response.data.tag.name} (ID: ${createdTagId})`, 'green');
    log(`Response: ${JSON.stringify(response.data, null, 2)}`, 'yellow');
    return true;
  } catch (error) {
    log(`Error: ${error.response?.data?.error || error.message}`, 'red');
    return false;
  }
}

async function testGetTags() {
  log('\n=== Testing GET /api/tags (Get All Tags) ===', 'blue');

  try {
    const response = await axios.get(`${BASE_URL}/api/tags`, {
      headers: {
        Cookie: authCookie
      }
    });

    log(`Found ${response.data.count} tag(s)`, 'green');
    log(`Response: ${JSON.stringify(response.data, null, 2)}`, 'yellow');
    return true;
  } catch (error) {
    log(`Error: ${error.response?.data?.error || error.message}`, 'red');
    return false;
  }
}

async function testGetTagById() {
  log('\n=== Testing GET /api/tags/:id (Get Tag by ID) ===', 'blue');

  if (!createdTagId) {
    log('Skipping: No tag ID available', 'yellow');
    return false;
  }

  try {
    const response = await axios.get(`${BASE_URL}/api/tags/${createdTagId}`, {
      headers: {
        Cookie: authCookie
      }
    });

    log(`Tag retrieved: ${response.data.tag.name}`, 'green');
    log(`Response: ${JSON.stringify(response.data, null, 2)}`, 'yellow');
    return true;
  } catch (error) {
    log(`Error: ${error.response?.data?.error || error.message}`, 'red');
    return false;
  }
}

async function testDeleteTag() {
  log('\n=== Testing DELETE /api/tags/:id (Delete Tag) ===', 'blue');

  if (!createdTagId) {
    log('Skipping: No tag ID available', 'yellow');
    return false;
  }

  try {
    const response = await axios.delete(`${BASE_URL}/api/tags/${createdTagId}`, {
      headers: {
        Cookie: authCookie
      }
    });

    log(`Tag deleted successfully`, 'green');
    log(`Response: ${JSON.stringify(response.data, null, 2)}`, 'yellow');
    return true;
  } catch (error) {
    log(`Error: ${error.response?.data?.error || error.message}`, 'red');
    return false;
  }
}

async function testDeleteFolder() {
  log('\n=== Testing DELETE /api/folders/:id (Delete Folder) ===', 'blue');

  if (!createdFolderId) {
    log('Skipping: No folder ID available', 'yellow');
    return false;
  }

  try {
    const response = await axios.delete(`${BASE_URL}/api/folders/${createdFolderId}`, {
      headers: {
        Cookie: authCookie
      }
    });

    log(`Folder deleted successfully`, 'green');
    log(`Response: ${JSON.stringify(response.data, null, 2)}`, 'yellow');
    return true;
  } catch (error) {
    log(`Error: ${error.response?.data?.error || error.message}`, 'red');
    return false;
  }
}

async function testDuplicateFolderName() {
  log('\n=== Testing Duplicate Folder Name Validation ===', 'blue');

  try {
    // Create first folder
    await axios.post(
      `${BASE_URL}/api/folders`,
      {
        name: 'Duplicate Test',
        color: '#3b82f6'
      },
      {
        headers: {
          Cookie: authCookie
        }
      }
    );

    // Try to create duplicate
    await axios.post(
      `${BASE_URL}/api/folders`,
      {
        name: 'Duplicate Test',
        color: '#ef4444'
      },
      {
        headers: {
          Cookie: authCookie
        }
      }
    );

    log('Error: Duplicate folder was created (validation failed)', 'red');
    return false;
  } catch (error) {
    if (error.response?.status === 409) {
      log('Duplicate validation working correctly (409 Conflict)', 'green');
      return true;
    } else {
      log(`Unexpected error: ${error.response?.data?.error || error.message}`, 'red');
      return false;
    }
  }
}

async function runTests() {
  log('\n========================================', 'blue');
  log('  Folder & Tag CRUD API Test Suite', 'blue');
  log('========================================\n', 'blue');

  const results = {
    passed: 0,
    failed: 0
  };

  // Check server health
  try {
    await axios.get(`${BASE_URL}/health`);
    log('Server is running', 'green');
  } catch (error) {
    log('Error: Server is not running. Please start the server first.', 'red');
    process.exit(1);
  }

  // Run tests
  const tests = [
    { name: 'Authentication', fn: testAuth },
    { name: 'Create Folder', fn: testCreateFolder },
    { name: 'Get Folders', fn: testGetFolders },
    { name: 'Get Folder by ID', fn: testGetFolderById },
    { name: 'Update Folder', fn: testUpdateFolder },
    { name: 'Create Tag', fn: testCreateTag },
    { name: 'Get Tags', fn: testGetTags },
    { name: 'Get Tag by ID', fn: testGetTagById },
    { name: 'Duplicate Folder Validation', fn: testDuplicateFolderName },
    { name: 'Delete Tag', fn: testDeleteTag },
    { name: 'Delete Folder', fn: testDeleteFolder }
  ];

  for (const test of tests) {
    const result = await test.fn();
    if (result) {
      results.passed++;
    } else {
      results.failed++;
    }
  }

  // Summary
  log('\n========================================', 'blue');
  log('  Test Summary', 'blue');
  log('========================================', 'blue');
  log(`Total Tests: ${results.passed + results.failed}`, 'yellow');
  log(`Passed: ${results.passed}`, 'green');
  log(`Failed: ${results.failed}`, results.failed > 0 ? 'red' : 'green');
  log('========================================\n', 'blue');

  process.exit(results.failed > 0 ? 1 : 0);
}

// Run tests
runTests();
