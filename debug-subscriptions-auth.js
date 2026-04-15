// Debug script to check authentication and API calls
console.log('🔍 Debugging Subscriptions Authentication...');

// Check if we're in browser environment
if (typeof window !== 'undefined') {
  // Check localStorage for token
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user');
  
  console.log('📱 Browser Environment Detected');
  console.log('🔑 Token exists:', !!token);
  console.log('👤 User data exists:', !!user);
  
  if (token) {
    console.log('🔑 Token preview:', token.substring(0, 20) + '...');
    
    // Try to decode JWT (basic check)
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      console.log('📋 Token payload:', payload);
      console.log('⏰ Token expires:', new Date(payload.exp * 1000));
      console.log('🔒 User role:', payload.role);
    } catch (e) {
      console.error('❌ Invalid token format:', e);
    }
  }
  
  if (user) {
    try {
      const userData = JSON.parse(user);
      console.log('👤 User data:', userData);
      console.log('🛡️ User role:', userData.role);
    } catch (e) {
      console.error('❌ Invalid user data format:', e);
    }
  }
  
  // Test API call
  if (token) {
    console.log('🌐 Testing API call...');
    
    fetch('http://localhost:5000/api/subscriptions/analytics', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })
    .then(response => {
      console.log('📡 API Response status:', response.status);
      return response.json();
    })
    .then(data => {
      console.log('📊 API Response data:', data);
    })
    .catch(error => {
      console.error('❌ API Error:', error);
    });
  }
} else {
  console.log('🖥️ Node.js Environment - Cannot access localStorage');
}

// Export for use in browser console
if (typeof window !== 'undefined') {
  window.debugAuth = function() {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    return {
      hasToken: !!token,
      hasUser: !!user,
      token: token ? token.substring(0, 20) + '...' : null,
      user: user ? JSON.parse(user) : null
    };
  };
  
  console.log('💡 Run window.debugAuth() in console for quick debug info');
}