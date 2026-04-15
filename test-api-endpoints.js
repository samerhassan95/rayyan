const axios = require('axios');

async function testAPIEndpoints() {
  const API_URL = 'http://localhost:5000';
  
  try {
    console.log('🔍 Testing API Endpoints...\n');
    
    // Test analytics endpoint
    console.log('📊 Testing /api/subscriptions/analytics...');
    const analyticsResponse = await axios.get(`${API_URL}/api/subscriptions/analytics`);
    console.log('Analytics Response:', JSON.stringify(analyticsResponse.data, null, 2));
    
    console.log('\n📋 Testing /api/subscriptions...');
    const subscriptionsResponse = await axios.get(`${API_URL}/api/subscriptions`);
    console.log('Subscriptions Response:', JSON.stringify(subscriptionsResponse.data, null, 2));
    
    console.log('\n✅ API endpoints are working!');
    
  } catch (error) {
    console.error('❌ API test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testAPIEndpoints();