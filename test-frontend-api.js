const axios = require('axios');

async function testFrontendAPI() {
  try {
    console.log('🧪 Testing Frontend API Connection...\n');

    // Test if backend is running
    console.log('1. Testing backend health...');
    const healthResponse = await axios.get('http://localhost:5000/api/test');
    console.log('✅ Backend is running:', healthResponse.data.message);

    // Test login
    console.log('\n2. Testing login...');
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'admin@rayyan.com',
      password: 'password'
    });
    console.log('✅ Login successful');

    const token = loginResponse.data.token;

    // Test subscriptions endpoint (what frontend calls)
    console.log('\n3. Testing subscriptions endpoint...');
    const subsResponse = await axios.get('http://localhost:5000/api/subscriptions', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('✅ Subscriptions API Response:');
    console.log('- Count:', subsResponse.data.subscriptions.length);
    console.log('- Total:', subsResponse.data.pagination.total);
    console.log('- First subscription:', subsResponse.data.subscriptions[0]?.user?.name || 'none');

    // Test analytics endpoint
    console.log('\n4. Testing analytics endpoint...');
    const analyticsResponse = await axios.get('http://localhost:5000/api/subscriptions/analytics', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('✅ Analytics API Response:');
    console.log('- Total Subscriptions:', analyticsResponse.data.totalSubscriptions);
    console.log('- Active Plans:', analyticsResponse.data.activePlans);

    console.log('\n🎉 All API endpoints are working correctly!');
    console.log('\n💡 If frontend still shows "No Subscriptions Found", try:');
    console.log('1. Hard refresh the browser (Ctrl+F5)');
    console.log('2. Clear browser cache');
    console.log('3. Check browser console for errors');

  } catch (error) {
    console.error('❌ API Test failed:', error.response?.data || error.message);
    if (error.response?.status) {
      console.error('Status:', error.response.status);
    }
  }
}

testFrontendAPI();