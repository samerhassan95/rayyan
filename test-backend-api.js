// Test if backend API can access the database
const axios = require('axios');

const BASE_URL = 'http://localhost:5000';

console.log('=== TESTING BACKEND API ===\n');

async function testAPI() {
  try {
    // Test 1: Check if backend is running
    console.log('1. Testing if backend is running...');
    try {
      const response = await axios.get(`${BASE_URL}/api/test`);
      console.log('   ✓ Backend is running');
      console.log('   Response:', response.data);
    } catch (err) {
      if (err.code === 'ECONNREFUSED') {
        console.log('   ✗ Backend is NOT running!');
        console.log('   Solution: Run "npm start" in the backend folder');
        return;
      }
      throw err;
    }
    
    // Test 2: Check users endpoint
    console.log('\n2. Testing users endpoint...');
    try {
      const response = await axios.get(`${BASE_URL}/api/admin/users`, {
        headers: {
          'Authorization': 'Bearer dummy_token_for_testing'
        }
      });
      console.log(`   ✓ Users endpoint responded`);
      console.log(`   Total users: ${response.data.total || response.data.length || 'unknown'}`);
    } catch (err) {
      if (err.response) {
        console.log(`   Response status: ${err.response.status}`);
        console.log(`   Response data:`, err.response.data);
        if (err.response.status === 401) {
          console.log('   (401 is expected - authentication required)');
        }
      } else {
        console.log(`   ✗ Error: ${err.message}`);
      }
    }
    
    // Test 3: Check stats endpoint
    console.log('\n3. Testing stats endpoint...');
    try {
      const response = await axios.get(`${BASE_URL}/api/admin/stats`, {
        headers: {
          'Authorization': 'Bearer dummy_token_for_testing'
        }
      });
      console.log(`   ✓ Stats endpoint responded`);
      console.log(`   Stats:`, response.data);
    } catch (err) {
      if (err.response) {
        console.log(`   Response status: ${err.response.status}`);
        if (err.response.status === 401) {
          console.log('   (401 is expected - authentication required)');
        } else {
          console.log(`   Response data:`, err.response.data);
        }
      } else {
        console.log(`   ✗ Error: ${err.message}`);
      }
    }
    
    // Test 4: Try login
    console.log('\n4. Testing login endpoint...');
    try {
      const response = await axios.post(`${BASE_URL}/api/admin/login`, {
        email: 'admin@rayyan.com',
        password: 'admin123'
      });
      console.log('   ✓ Login successful!');
      console.log('   User:', response.data.user?.email);
      
      const token = response.data.token;
      
      // Test 5: Use token to get real data
      console.log('\n5. Testing authenticated request...');
      const statsResponse = await axios.get(`${BASE_URL}/api/admin/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      console.log('   ✓ Authenticated request successful!');
      console.log('   Stats:', JSON.stringify(statsResponse.data, null, 2));
      
    } catch (err) {
      if (err.response) {
        console.log(`   ✗ Login failed: ${err.response.status}`);
        console.log(`   Response:`, err.response.data);
        if (err.response.status === 401) {
          console.log('\n   Possible issues:');
          console.log('   - Admin user does not exist in database');
          console.log('   - Wrong password');
          console.log('   Solution: Run "node backend/scripts/create-admin.js"');
        }
      } else {
        console.log(`   ✗ Error: ${err.message}`);
      }
    }
    
    console.log('\n=== TEST COMPLETE ===');
    
  } catch (error) {
    console.error('\n✗ Unexpected error:', error.message);
  }
}

// Check if axios is installed
try {
  require.resolve('axios');
  testAPI();
} catch (e) {
  console.log('Installing axios...');
  const { execSync } = require('child_process');
  execSync('npm install axios', { stdio: 'inherit' });
  console.log('\nNow run the script again: node test-backend-api.js');
}
