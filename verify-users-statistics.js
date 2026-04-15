const axios = require('axios');

const API_URL = 'http://localhost:5000';

async function verifyUsersStatistics() {
  console.log('🔍 Verifying Users Statistics Accuracy...\n');

  try {
    // Login as admin
    const loginResponse = await axios.post(`${API_URL}/api/auth/login`, {
      email: 'admin@rayyan.com',
      password: 'password'
    });
    
    const token = loginResponse.data.token;
    const headers = { Authorization: `Bearer ${token}` };
    console.log('✅ Admin authenticated');

    // Get users statistics from API
    console.log('\n1. Getting statistics from Users API...');
    const usersResponse = await axios.get(`${API_URL}/api/admin/users`, { headers });
    const { users, statistics } = usersResponse.data;
    
    console.log('📊 API Statistics:');
    console.log(`   - Seat Utilization: ${statistics.seatUtilization}%`);
    console.log(`   - 2FA Enabled: ${statistics.twoFactorEnabled}`);
    console.log(`   - Recent Activity: ${statistics.avgActivation}%`);
    console.log(`   - New This Month: ${statistics.recentInvites}`);

    // Manual calculation to verify
    console.log('\n2. Manual verification from raw data...');
    
    // Get all users for manual calculation
    const allUsersResponse = await axios.get(`${API_URL}/api/admin/users?limit=100`, { headers });
    const allUsers = allUsersResponse.data.users;
    
    console.log(`📋 Raw Data Analysis (${allUsers.length} users):`);
    
    // Calculate Seat Utilization (active users / total users)
    const activeUsers = allUsers.filter(u => u.status === 'active').length;
    const totalUsers = allUsers.length;
    const calculatedSeatUtilization = Math.round((activeUsers / totalUsers) * 100);
    
    console.log(`   - Active Users: ${activeUsers}/${totalUsers}`);
    console.log(`   - Calculated Seat Utilization: ${calculatedSeatUtilization}%`);
    console.log(`   - API vs Calculated: ${statistics.seatUtilization}% vs ${calculatedSeatUtilization}% ${statistics.seatUtilization === calculatedSeatUtilization ? '✅' : '❌'}`);
    
    // Calculate 2FA Enabled
    const twoFactorUsers = allUsers.filter(u => u.two_factor_enabled).length;
    console.log(`   - 2FA Enabled Users: ${twoFactorUsers}`);
    console.log(`   - API vs Calculated: ${statistics.twoFactorEnabled} vs ${twoFactorUsers} ${statistics.twoFactorEnabled === twoFactorUsers ? '✅' : '❌'}`);
    
    // Calculate Recent Activity (users with recent login)
    const currentDate = new Date();
    const thirtyDaysAgo = new Date(currentDate.getTime() - (30 * 24 * 60 * 60 * 1000));
    
    const recentlyActiveUsers = allUsers.filter(u => {
      if (!u.last_login) return false;
      const lastLogin = new Date(u.last_login);
      return lastLogin >= thirtyDaysAgo;
    }).length;
    
    const calculatedRecentActivity = Math.round((recentlyActiveUsers / totalUsers) * 100);
    console.log(`   - Recently Active Users: ${recentlyActiveUsers}/${totalUsers}`);
    console.log(`   - Calculated Recent Activity: ${calculatedRecentActivity}%`);
    console.log(`   - API vs Calculated: ${statistics.avgActivation}% vs ${calculatedRecentActivity}% ${statistics.avgActivation === calculatedRecentActivity ? '✅' : '❌'}`);
    
    // Calculate New This Month
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();
    
    const newThisMonth = allUsers.filter(u => {
      const createdDate = new Date(u.created_at);
      return createdDate.getMonth() + 1 === currentMonth && createdDate.getFullYear() === currentYear;
    }).length;
    
    console.log(`   - New Users This Month: ${newThisMonth}`);
    console.log(`   - API vs Calculated: ${statistics.recentInvites} vs ${newThisMonth} ${statistics.recentInvites === newThisMonth ? '✅' : '❌'}`);

    // Additional verification - check user details
    console.log('\n3. Sample user data verification...');
    const sampleUsers = allUsers.slice(0, 3);
    
    for (const user of sampleUsers) {
      console.log(`\n   User: ${user.username}`);
      console.log(`     - Status: ${user.status}`);
      console.log(`     - 2FA: ${user.two_factor_enabled ? 'Enabled' : 'Disabled'}`);
      console.log(`     - Last Login: ${user.last_login || 'Never'}`);
      console.log(`     - Created: ${new Date(user.created_at).toLocaleDateString()}`);
      console.log(`     - Job Title: ${user.job_title || 'Not set'}`);
      console.log(`     - Phone: ${user.phone || 'Not set'}`);
    }

    // Summary
    console.log('\n📊 Statistics Accuracy Summary:');
    const seatUtilAccurate = statistics.seatUtilization === calculatedSeatUtilization;
    const twoFactorAccurate = statistics.twoFactorEnabled === twoFactorUsers;
    const recentActivityAccurate = statistics.avgActivation === calculatedRecentActivity;
    const newUsersAccurate = statistics.recentInvites === newThisMonth;
    
    console.log(`   - Seat Utilization: ${seatUtilAccurate ? '✅ Accurate' : '❌ Inaccurate'}`);
    console.log(`   - 2FA Enabled: ${twoFactorAccurate ? '✅ Accurate' : '❌ Inaccurate'}`);
    console.log(`   - Recent Activity: ${recentActivityAccurate ? '✅ Accurate' : '❌ Inaccurate'}`);
    console.log(`   - New This Month: ${newUsersAccurate ? '✅ Accurate' : '❌ Inaccurate'}`);
    
    const allAccurate = seatUtilAccurate && twoFactorAccurate && recentActivityAccurate && newUsersAccurate;
    console.log(`\n🎯 Overall Accuracy: ${allAccurate ? '✅ ALL STATISTICS ARE ACCURATE' : '❌ SOME STATISTICS NEED CORRECTION'}`);

  } catch (error) {
    console.error('❌ Verification failed:', error.response?.data || error.message);
  }
}

verifyUsersStatistics();