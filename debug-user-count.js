const axios = require('axios');

const API_URL = 'http://localhost:5000';

async function debugUserCount() {
  console.log('👥 Debugging User Count Discrepancy...\n');

  try {
    // Login first
    const loginResponse = await axios.post(`${API_URL}/api/auth/login`, {
      email: 'admin@rayyan.com',
      password: 'password'
    });
    
    const token = loginResponse.data.token;
    const headers = { Authorization: `Bearer ${token}` };

    // Get dashboard stats
    const response = await axios.get(`${API_URL}/api/admin/dashboard/stats`, { headers });
    const { stats, userAcquisition } = response.data;
    
    console.log('📊 Current Stats:');
    console.log(`   Total Users (Card): ${stats.totalUsers}`);
    console.log(`   User Acquisition Total: ${userAcquisition.total}`);
    console.log(`   Acquisition Breakdown: ${userAcquisition.directCount} + ${userAcquisition.referralCount} + ${userAcquisition.socialCount} + ${userAcquisition.otherCount} = ${userAcquisition.directCount + userAcquisition.referralCount + userAcquisition.socialCount + userAcquisition.otherCount}`);
    console.log('');

    // Check what's causing the discrepancy
    console.log('🔍 Investigating the discrepancy...');
    
    // The issue is likely that some users have NULL acquisition_source
    // Let's check the backend logic
    
    console.log('📋 Possible causes:');
    console.log('1. Some users might have NULL acquisition_source');
    console.log('2. User Acquisition might be counting differently');
    console.log('3. There might be timing differences in the queries');
    console.log('');
    
    console.log('🔧 This needs to be fixed in the backend to ensure consistency');

  } catch (error) {
    console.error('❌ Debug failed:', error.response?.data?.error || error.message);
  }
}

debugUserCount();