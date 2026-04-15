const axios = require('axios');

async function testSimple() {
  try {
    console.log('Testing simple subscriptions API...');
    
    // Login first
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'admin@rayyan.com',
      password: 'password'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Login successful');
    
    // Test basic subscriptions call
    const response = await axios.get('http://localhost:5000/api/subscriptions', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('✅ API Response:', {
      subscriptionsCount: response.data.subscriptions?.length || 0,
      totalFromPagination: response.data.pagination?.total || 0,
      firstSubscription: response.data.subscriptions?.[0] || 'none'
    });
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    if (error.response?.status) {
      console.error('Status:', error.response.status);
    }
  }
}

testSimple();