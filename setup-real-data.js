// Quick setup script to add real sample data
const { exec } = require('child_process');

console.log('🚀 Setting up real sample data for Rayyan Admin Dashboard...\n');

// Run the sample data script
exec('node backend/scripts/add-sample-acquisition-data.js', (error, stdout, stderr) => {
  if (error) {
    console.error('❌ Error running setup:', error);
    return;
  }
  
  if (stderr) {
    console.error('⚠️ Warning:', stderr);
  }
  
  console.log(stdout);
  
  console.log('\n✅ Setup complete! Your admin dashboard now has:');
  console.log('📊 Real user acquisition data with sources');
  console.log('💳 Sample transactions with various statuses');
  console.log('🔍 Working transaction filters');
  console.log('📈 Real analytics data');
  console.log('\n🌐 Access your dashboard at: http://localhost:3000/admin');
  console.log('🔑 Login with: admin@rayyan.com / password');
});