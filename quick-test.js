// Quick test - works from any directory
const { execSync } = require('child_process');
const path = require('path');

console.log('=== QUICK DATABASE TEST ===\n');

// Check if we're in the right directory
const backendPath = path.join(__dirname, 'backend');
const hasBackend = require('fs').existsSync(backendPath);

if (!hasBackend) {
  console.log('✗ Cannot find backend folder!');
  console.log('Make sure you run this from the project root directory.');
  process.exit(1);
}

console.log('Testing from backend folder...\n');

try {
  // Run a simple test from backend
  const result = execSync('node -e "' +
    'const mysql = require(\\"mysql2/promise\\");' +
    'require(\\"dotenv\\").config();' +
    'const config = {' +
    '  host: process.env.DB_HOST,' +
    '  port: process.env.DB_PORT,' +
    '  user: process.env.DB_USER,' +
    '  password: process.env.DB_PASSWORD,' +
    '  database: process.env.DB_NAME' +
    '};' +
    'console.log(\\"Config:\\", JSON.stringify(config, null, 2));' +
    'mysql.createConnection(config).then(conn => {' +
    '  console.log(\\"✓ Connected to database!\\");' +
    '  return conn.query(\\"SELECT COUNT(*) as count FROM users\\");' +
    '}).then(([rows]) => {' +
    '  console.log(\\"✓ Users in database:\\", rows[0].count);' +
    '  return mysql.createConnection(config);' +
    '}).then(conn => {' +
    '  return conn.query(\\"SELECT COUNT(*) as count FROM subscriptions\\");' +
    '}).then(([rows]) => {' +
    '  console.log(\\"✓ Subscriptions in database:\\", rows[0].count);' +
    '  process.exit(0);' +
    '}).catch(err => {' +
    '  console.error(\\"✗ Error:\\", err.message);' +
    '  process.exit(1);' +
    '});' +
    '"', {
    cwd: backendPath,
    encoding: 'utf8',
    stdio: 'inherit'
  });
  
  console.log('\n✓ Database test passed!');
  console.log('\nIf you see data above but website shows 0:');
  console.log('1. Make sure backend server is running: cd backend && npm start');
  console.log('2. Check browser console (F12) for errors');
  console.log('3. Verify frontend .env.local has: NEXT_PUBLIC_API_URL=http://localhost:5000');
  
} catch (error) {
  console.error('\n✗ Test failed!');
  console.error('Error:', error.message);
  
  console.log('\nTroubleshooting:');
  console.log('1. Make sure MySQL is running in XAMPP');
  console.log('2. Check backend/.env file has correct database name');
  console.log('3. Verify database exists in phpMyAdmin');
}
