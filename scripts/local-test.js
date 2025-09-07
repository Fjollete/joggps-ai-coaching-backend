const http = require('http');
const { spawn } = require('child_process');

// JogGPS AI Coaching Backend - Local Testing Script
// Usage: node scripts/local-test.js

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const COLORS = {
  RED: '\x1b[31m',
  GREEN: '\x1b[32m',
  YELLOW: '\x1b[33m',
  BLUE: '\x1b[34m',
  RESET: '\x1b[0m'
};

console.log(`${COLORS.BLUE}JogGPS AI Coaching Backend - Local Testing${COLORS.RESET}`);
console.log(`Testing API at: ${BASE_URL}`);
console.log('='.repeat(50));

// Helper function to make HTTP requests
function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE_URL + path);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });

      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          body: body,
          headers: res.headers,
        });
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

// Test function
async function testEndpoint(name, method, path, data = null, expectedStatus = 200) {
  console.log(`\n${COLORS.YELLOW}Testing: ${name}${COLORS.RESET}`);
  console.log(`${method} ${path}`);

  try {
    const response = await makeRequest(method, path, data);
    
    if (response.statusCode === expectedStatus) {
      console.log(`${COLORS.GREEN}✓ Status: ${response.statusCode}${COLORS.RESET}`);
    } else {
      console.log(`${COLORS.RED}✗ Status: ${response.statusCode} (Expected: ${expectedStatus})${COLORS.RESET}`);
    }

    // Try to parse JSON response
    try {
      const jsonBody = JSON.parse(response.body);
      console.log('Response:', JSON.stringify(jsonBody, null, 2));
    } catch {
      console.log('Response (text):', response.body);
    }

    return response.statusCode === expectedStatus;
  } catch (error) {
    console.log(`${COLORS.RED}✗ Error: ${error.message}${COLORS.RESET}`);
    return false;
  }
}

// Main test suite
async function runTests() {
  const results = {
    passed: 0,
    failed: 0,
    total: 0
  };

  const tests = [
    // 1. Health Check
    {
      name: 'Health Check',
      method: 'GET',
      path: '/api/health',
      expectedStatus: 200
    },

    // 2. Profile Management - Create
    {
      name: 'Create User Profile',
      method: 'POST',
      path: '/api/profile',
      data: {
        deviceId: 'test-device-123',
        trainingGoal: {
          raceType: '10k',
          targetTime: 2400,
          raceDate: '2024-06-15'
        },
        recentRuns: []
      },
      expectedStatus: 200
    },

    // 3. Profile Management - Get
    {
      name: 'Get User Profile',
      method: 'GET',
      path: '/api/profile?deviceId=test-device-123',
      expectedStatus: 200
    },

    // 4. Run Logging
    {
      name: 'Log Completed Run',
      method: 'POST',
      path: '/api/runs',
      data: {
        deviceId: 'test-device-123',
        date: '2024-01-15T10:30:00Z',
        distance: 5000,
        duration: 1800,
        avgPace: 360
      },
      expectedStatus: 200
    },

    // 5. Get Run History
    {
      name: 'Get Run History',
      method: 'GET',
      path: '/api/runs?deviceId=test-device-123&limit=10',
      expectedStatus: 200
    },

    // 6. AI Coaching Request (Note: This requires OPENROUTER_API_KEY)
    {
      name: 'AI Coaching Request',
      method: 'POST',
      path: '/api/coaching',
      data: {
        deviceId: 'test-device-123',
        currentSegment: {
          latitude: 40.7128,
          longitude: -74.0060,
          timestamp: 1642261800000,
          heartRate: 150,
          speed: 3.5,
          elevation: 10.0,
          accuracy: 5.0,
          bearing: 180.0
        },
        runTotals: {
          distance: 2500,
          duration: 900000,
          avgPace: 360,
          avgHeartRate: 145
        },
        intervalData: {
          lastIntervalDistance: 500,
          lastIntervalTime: 180000,
          lastIntervalPace: 360,
          recentPaces: [355, 360, 365],
          pacePattern: 'consistent'
        },
        trainingGoal: {
          raceType: '10k',
          targetTime: 2400,
          raceDate: '2024-06-15'
        },
        model: 'openai/gpt-4.1-nano'
      },
      expectedStatus: process.env.OPENROUTER_API_KEY ? 200 : 500
    }
  ];

  for (const test of tests) {
    const passed = await testEndpoint(
      test.name,
      test.method,
      test.path,
      test.data,
      test.expectedStatus
    );

    if (passed) {
      results.passed++;
    } else {
      results.failed++;
    }
    results.total++;

    // Add a small delay between tests
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log(`${COLORS.BLUE}Test Results:${COLORS.RESET}`);
  console.log(`${COLORS.GREEN}Passed: ${results.passed}${COLORS.RESET}`);
  console.log(`${COLORS.RED}Failed: ${results.failed}${COLORS.RESET}`);
  console.log(`Total: ${results.total}`);

  if (results.failed === 0) {
    console.log(`\n${COLORS.GREEN}All tests passed! 🎉${COLORS.RESET}`);
  } else {
    console.log(`\n${COLORS.RED}Some tests failed. Check the output above for details.${COLORS.RESET}`);
  }

  if (!process.env.OPENROUTER_API_KEY) {
    console.log(`\n${COLORS.YELLOW}Note: Set OPENROUTER_API_KEY environment variable to test AI coaching functionality.${COLORS.RESET}`);
  }

  return results.failed === 0;
}

// Check if server is running
async function checkServerHealth() {
  try {
    const response = await makeRequest('GET', '/api/health');
    return response.statusCode === 200;
  } catch {
    return false;
  }
}

// Main execution
async function main() {
  console.log('\nChecking if server is running...');
  
  const isHealthy = await checkServerHealth();
  if (!isHealthy) {
    console.log(`${COLORS.RED}Server is not responding at ${BASE_URL}${COLORS.RESET}`);
    console.log('Please make sure the server is running:');
    console.log('  npm run dev  (for development)');
    console.log('  npm start    (for production)');
    process.exit(1);
  }

  console.log(`${COLORS.GREEN}Server is healthy! Starting tests...${COLORS.RESET}`);
  
  const success = await runTests();
  process.exit(success ? 0 : 1);
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { makeRequest, testEndpoint, runTests };