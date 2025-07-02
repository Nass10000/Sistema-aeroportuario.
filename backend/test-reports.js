const https = require('https');
const http = require('http');

// Test configuration
const BASE_URL = 'http://localhost:3001';
const API_URL = BASE_URL; // No /api prefix needed

// Test credentials (these should exist from the initialization)
const TEST_CREDENTIALS = {
  admin: {
    email: 'admin@aereo.com',
    password: 'Admin123!'
  },
  manager: {
    email: 'manager@aereo.com', 
    password: 'Manager123!'
  },
  employee: {
    email: 'employee@aereo.com',
    password: 'Employee123!'
  }
};

// Test parameters for reports
const TEST_PARAMS = {
  dateRange: {
    startDate: '2024-01-01',
    endDate: '2024-12-31'
  },
  weekStartDate: '2024-01-01',
  stationId: '1',
  employeeId: '1'
};

class ReportsTestSuite {
  constructor() {
    this.tokens = {};
    this.results = {
      authentication: {},
      endpoints: {},
      csv_exports: {},
      authorization: {}
    };
  }

  // Helper method to make HTTP requests
  makeRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
      const urlObj = new URL(url);
      const isHttps = urlObj.protocol === 'https:';
      const httpModule = isHttps ? https : http;
      
      const requestOptions = {
        hostname: urlObj.hostname,
        port: urlObj.port || (isHttps ? 443 : 80),
        path: urlObj.pathname + urlObj.search,
        method: options.method || 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        }
      };

      const req = httpModule.request(requestOptions, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const jsonData = data ? JSON.parse(data) : {};
            resolve({
              status: res.statusCode,
              data: jsonData,
              headers: res.headers,
              rawData: data
            });
          } catch (e) {
            resolve({
              status: res.statusCode,
              data: data,
              headers: res.headers,
              rawData: data
            });
          }
        });
      });

      req.on('error', reject);
      
      if (options.body) {
        req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
      }
      
      req.end();
    });
  }

  // Test authentication for all roles
  async testAuthentication() {
    console.log('\n🔐 Testing Authentication...');
    
    for (const [role, credentials] of Object.entries(TEST_CREDENTIALS)) {
      try {
        const response = await this.makeRequest(`${API_URL}/auth/login`, {
          method: 'POST',
          body: credentials
        });

        if (response.status === 200 || response.status === 201) {
          this.tokens[role] = response.data.access_token;
          this.results.authentication[role] = '✅ Success';
          console.log(`✅ ${role} authentication: SUCCESS`);
        } else {
          this.results.authentication[role] = `❌ Failed (${response.status})`;
          console.log(`❌ ${role} authentication: FAILED (${response.status})`);
          console.log('Response:', response.data);
        }
      } catch (error) {
        this.results.authentication[role] = `❌ Error: ${error.message}`;
        console.log(`❌ ${role} authentication: ERROR - ${error.message}`);
      }
    }
  }

  // Test individual endpoint
  async testEndpoint(endpoint, params = {}, token = null, format = 'json') {
    const queryString = new URLSearchParams(params).toString();
    const url = `${API_URL}/reports/${endpoint}${queryString ? '?' + queryString : ''}`;
    
    const headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await this.makeRequest(url, { headers });
      
      return {
        status: response.status,
        success: response.status >= 200 && response.status < 300,
        data: response.data,
        headers: response.headers,
        rawData: response.rawData
      };
    } catch (error) {
      return {
        status: 0,
        success: false,
        error: error.message
      };
    }
  }

  // Test all endpoints
  async testAllEndpoints() {
    console.log('\n📊 Testing All Endpoints...');
    
    const endpoints = [
      {
        name: 'attendance',
        params: { ...TEST_PARAMS.dateRange, stationId: TEST_PARAMS.stationId }
      },
      {
        name: 'overtime', 
        params: { ...TEST_PARAMS.dateRange, stationId: TEST_PARAMS.stationId }
      },
      {
        name: 'coverage',
        params: {}
      },
      {
        name: 'weekly-schedule',
        params: { weekStartDate: TEST_PARAMS.weekStartDate, stationId: TEST_PARAMS.stationId }
      },
      {
        name: 'employee-schedule',
        params: { 
          employeeId: TEST_PARAMS.employeeId, 
          ...TEST_PARAMS.dateRange 
        }
      },
      {
        name: 'cost-analysis',
        params: { ...TEST_PARAMS.dateRange, stationId: TEST_PARAMS.stationId }
      },
      {
        name: 'operational-metrics',
        params: TEST_PARAMS.dateRange
      }
    ];

    // Use admin token for testing
    const adminToken = this.tokens.admin;
    
    for (const endpoint of endpoints) {
      console.log(`\n  Testing ${endpoint.name}...`);
      
      // Test JSON format
      const jsonResult = await this.testEndpoint(endpoint.name, endpoint.params, adminToken);
      const jsonStatus = jsonResult.success ? '✅' : '❌';
      console.log(`    JSON: ${jsonStatus} (${jsonResult.status})`);
      
      if (!jsonResult.success) {
        console.log(`    Error: ${jsonResult.error || JSON.stringify(jsonResult.data)}`);
      }
      
      // Test CSV format
      const csvParams = { ...endpoint.params, format: 'csv' };
      const csvResult = await this.testEndpoint(endpoint.name, csvParams, adminToken);
      const csvStatus = csvResult.success ? '✅' : '❌';
      console.log(`    CSV:  ${csvStatus} (${csvResult.status})`);
      
      if (!csvResult.success) {
        console.log(`    CSV Error: ${csvResult.error || JSON.stringify(csvResult.data)}`);
      }

      this.results.endpoints[endpoint.name] = {
        json: jsonStatus === '✅',
        csv: csvStatus === '✅',
        jsonStatus: jsonResult.status,
        csvStatus: csvResult.status,
        jsonError: jsonResult.error,
        csvError: csvResult.error
      };
    }
  }

  // Test authorization for different roles
  async testAuthorization() {
    console.log('\n🛡️ Testing Authorization...');
    
    const restrictedEndpoint = 'cost-analysis'; // Only admin, manager, president
    const params = TEST_PARAMS.dateRange;
    
    for (const [role, token] of Object.entries(this.tokens)) {
      if (!token) continue;
      
      const result = await this.testEndpoint(restrictedEndpoint, params, token);
      const hasAccess = result.success;
      const expectedAccess = ['admin', 'manager'].includes(role); // president token might not exist in test data
      
      console.log(`  ${role}: ${hasAccess ? '✅' : '❌'} (${result.status})`);
      
      this.results.authorization[role] = {
        hasAccess,
        expectedAccess,
        status: result.status,
        correct: hasAccess === expectedAccess || (hasAccess && ['admin', 'manager', 'supervisor'].includes(role))
      };
    }
  }

  // Test without authentication
  async testNoAuth() {
    console.log('\n🚫 Testing Without Authentication...');
    
    const result = await this.testEndpoint('attendance', TEST_PARAMS.dateRange);
    const shouldFail = !result.success && result.status === 401;
    
    console.log(`  No token: ${shouldFail ? '✅' : '❌'} (${result.status})`);
    
    this.results.no_auth = {
      correctlyBlocked: shouldFail,
      status: result.status
    };
  }

  // Generate comprehensive report
  generateReport() {
    console.log('\n📋 === TEST RESULTS SUMMARY ===');
    
    // Authentication results
    console.log('\n🔐 Authentication:');
    Object.entries(this.results.authentication).forEach(([role, result]) => {
      console.log(`  ${role}: ${result}`);
    });
    
    // Endpoints results
    console.log('\n📊 Endpoints:');
    Object.entries(this.results.endpoints).forEach(([endpoint, results]) => {
      const jsonIcon = results.json ? '✅' : '❌';
      const csvIcon = results.csv ? '✅' : '❌';
      console.log(`  ${endpoint}:`);
      console.log(`    JSON: ${jsonIcon} (${results.jsonStatus})`);
      console.log(`    CSV:  ${csvIcon} (${results.csvStatus})`);
    });
    
    // Authorization results
    console.log('\n🛡️ Authorization:');
    Object.entries(this.results.authorization).forEach(([role, result]) => {
      const icon = result.correct ? '✅' : '❌';
      console.log(`  ${role}: ${icon} (access: ${result.hasAccess}, status: ${result.status})`);
    });
    
    // No auth test
    console.log('\n🚫 No Authentication:');
    const noAuthIcon = this.results.no_auth?.correctlyBlocked ? '✅' : '❌';
    console.log(`  Correctly blocked: ${noAuthIcon} (${this.results.no_auth?.status})`);
    
    // Overall summary
    const totalEndpoints = Object.keys(this.results.endpoints).length;
    const workingEndpoints = Object.values(this.results.endpoints).filter(r => r.json).length;
    const workingCSV = Object.values(this.results.endpoints).filter(r => r.csv).length;
    
    console.log('\n📈 Overall Summary:');
    console.log(`  Working JSON endpoints: ${workingEndpoints}/${totalEndpoints}`);
    console.log(`  Working CSV exports: ${workingCSV}/${totalEndpoints}`);
    console.log(`  Authentication success: ${Object.values(this.results.authentication).filter(r => r.includes('✅')).length}/${Object.keys(TEST_CREDENTIALS).length}`);
    
    return this.results;
  }

  // Main test runner
  async run() {
    console.log('🚀 Starting Reports Endpoints Test Suite...');
    console.log(`📍 Testing against: ${BASE_URL}`);
    
    try {
      await this.testAuthentication();
      await this.testNoAuth();
      await this.testAllEndpoints();
      await this.testAuthorization();
      
      return this.generateReport();
    } catch (error) {
      console.error('💥 Test suite failed:', error);
      throw error;
    }
  }
}

// Helper function to wait for server
function waitForServer(url, maxAttempts = 30, delay = 2000) {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    
    const check = () => {
      attempts++;
      console.log(`🔍 Checking server availability (attempt ${attempts}/${maxAttempts})...`);
      
      const urlObj = new URL(url);
      const req = http.get(url, (res) => {
        console.log('✅ Server is available!');
        resolve();
      });
      
      req.on('error', (err) => {
        if (attempts >= maxAttempts) {
          reject(new Error(`Server not available after ${maxAttempts} attempts`));
        } else {
          setTimeout(check, delay);
        }
      });
    };
    
    check();
  });
}

// Run tests if this script is executed directly
if (require.main === module) {
  async function main() {
    try {
      console.log('⏳ Waiting for server to be available...');
      await waitForServer(BASE_URL);
      
      const testSuite = new ReportsTestSuite();
      const results = await testSuite.run();
      
      // Save results to file
      const fs = require('fs');
      fs.writeFileSync(
        '/home/runner/work/Aereo/Aereo/backend/test-results.json', 
        JSON.stringify(results, null, 2)
      );
      
      console.log('\n💾 Results saved to test-results.json');
      console.log('\n🎉 Test suite completed!');
      
    } catch (error) {
      console.error('💥 Test execution failed:', error.message);
      process.exit(1);
    }
  }
  
  main();
}

module.exports = ReportsTestSuite;