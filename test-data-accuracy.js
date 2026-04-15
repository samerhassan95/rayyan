const axios = require('axios');

const API_URL = 'http://localhost:5000';

async function testDataAccuracy() {
  console.log('🔍 Testing Data Accuracy...\n');

  try {
    // Login first
    const loginResponse = await axios.post(`${API_URL}/api/auth/login`, {
      email: 'admin@rayyan.com',
      password: 'password'
    });
    
    const token = loginResponse.data.token;
    const headers = { Authorization: `Bearer ${token}` };

    // Test 1: Check Recent Transactions data
    console.log('1. Checking Recent Transactions data...');
    const statsResponse = await axios.get(`${API_URL}/api/admin/dashboard/stats`, { headers });
    const { recentTransactions } = statsResponse.data;
    
    console.log(`✅ Recent Transactions: ${recentTransactions.length} transactions`);
    
    // Check status distribution
    const statusCounts = {};
    recentTransactions.forEach(t => {
      statusCounts[t.status] = (statusCounts[t.status] || 0) + 1;
    });
    
    console.log('   Status Distribution:');
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`   - ${status}: ${count} transactions`);
    });
    
    // Show sample transactions
    console.log('   Sample transactions:');
    recentTransactions.slice(0, 3).forEach(t => {
      console.log(`   - #${t.id}: $${t.amount} (${t.status}) - ${t.username}`);
    });
    console.log('');

    // Test 2: Check User Acquisition data
    console.log('2. Checking User Acquisition data...');
    const { userAcquisition } = statsResponse.data;
    
    console.log('✅ User Acquisition breakdown:');
    console.log(`   - Direct: ${userAcquisition.direct}% (${userAcquisition.directCount} users)`);
    console.log(`   - Referral: ${userAcquisition.referral}% (${userAcquisition.referralCount} users)`);
    console.log(`   - Social: ${userAcquisition.social}% (${userAcquisition.socialCount} users)`);
    console.log(`   - Other: ${userAcquisition.other}% (${userAcquisition.otherCount} users)`);
    console.log(`   - Total: ${userAcquisition.total} users`);
    console.log('');

    // Test 3: Check if data is realistic
    console.log('3. Data realism check...');
    
    // Check if all transactions have same status (unrealistic)
    const allSameStatus = Object.keys(statusCounts).length === 1;
    if (allSameStatus) {
      console.log('⚠️  WARNING: All transactions have the same status - this is unrealistic');
    } else {
      console.log('✅ Transaction statuses are varied - looks realistic');
    }
    
    // Check if user acquisition percentages are too uniform
    const percentages = [userAcquisition.direct, userAcquisition.referral, userAcquisition.social, userAcquisition.other];
    const uniquePercentages = [...new Set(percentages)];
    if (uniquePercentages.length <= 2) {
      console.log('⚠️  WARNING: User acquisition percentages are too uniform - might be hardcoded');
    } else {
      console.log('✅ User acquisition percentages are varied - looks realistic');
    }
    
    // Check total percentage
    const totalPercentage = percentages.reduce((sum, p) => sum + p, 0);
    if (Math.abs(totalPercentage - 100) > 1) {
      console.log(`⚠️  WARNING: User acquisition percentages don't add up to 100% (${totalPercentage}%)`);
    } else {
      console.log('✅ User acquisition percentages add up correctly');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data?.error || error.message);
  }
}

testDataAccuracy();