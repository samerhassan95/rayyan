const axios = require('axios');

async function testUpdate() {
  const API_URL = 'http://localhost:5000';
  const token = 'YOUR_TOKEN_HERE'; // I don't have the token
  
  try {
    // This won't work without a token, but I can check the route logic
  } catch (error) {
    console.error(error.response?.data);
  }
}
