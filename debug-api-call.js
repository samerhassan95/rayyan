const axios = require('axios');

const API_URL = 'http://localhost:5000';

async function debugApiCall() {
  console.log('🔍 Debugging API Call...\n');

  try {
    // Login first
    console.log('1. Testing login...');
    const loginResponse = await axios.post(`${API_URL}/api/auth/login`, {
      email: 'admin@rayyan.com',
      password: 'password'
    });
    
    const token = loginResponse.data.token;
    const headers = { Authorization: `Bearer ${token}` };
    console.log('✅ Login successful\n');

    // Test the exact API call that frontend makes
    console.log('2. Testing dashboard stats API call...');
    try {
      const response = await axios.get(`${API_URL}/api/admin/dashboard/stats`, { headers });
      console.log('✅ API call successful');
      console.log('Response keys:', Object.keys(response.data));
      
      if (response.data.recentTransactions) {
        console.log(`Recent transactions count: ${response.data.recentTransactions.length}`);
        if (response.data.recentTransactions.length > 0) {
          console.log('First transaction:', response.data.recentTransactions[0]);
        }
      }
      
      if (response.data.userAcquisition) {
        console.log('User acquisition:', response.data.userAcquisition);
      }
      
    } catch (apiError) {
      console.error('❌ API call failed:', apiError.response?.data || apiError.message);
      console.error('Status:', apiError.response?.status);
      console.error('Headers:', apiError.response?.headers);
    }

  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  }
}

debugApiCall();