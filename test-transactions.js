const axios = require('axios');

async function testTransactions() {
  try {
    // Login first
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'admin@rayyan.com',
      password: 'password'
    });
    
    const token = loginResponse.data.token;
    const headers = { Authorization: `Bearer ${token}` };

    // Test transactions route
    console.log('Testing transactions route...');
    const response = await axios.get('http://localhost:5000/api/admin/transactions/filtered', { headers });
    console.log('✅ Success:', response.data.length, 'transactions');
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data?.error || error.message);
    console.error('Status:', error.response?.status);
  }
}

testTransactions();