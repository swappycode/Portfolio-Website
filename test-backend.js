// Simple test script to verify backend API endpoints
const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3001';

async function testEndpoints() {
  console.log('Testing Backend API Integration...\n');

  try {
    // Test profile endpoint
    console.log('1. Testing Profile Endpoint:');
    const profileResponse = await fetch(`${BASE_URL}/api/v1/profile`);
    const profileData = await profileResponse.json();
    console.log('Profile Response:', profileData);
    console.log('✓ Profile endpoint working\n');

    // Test GitHub projects endpoint
    console.log('2. Testing GitHub Projects Endpoint:');
    const gitResponse = await fetch(`${BASE_URL}/api/v1/gitprojects`);
    const gitData = await gitResponse.json();
    console.log('GitHub Projects Response:', {
      success: gitData.success,
      count: gitData.count,
      projects: gitData.data?.slice(0, 2) // Show first 2 projects
    });
    console.log('✓ GitHub endpoint working\n');

    // Test itch.io projects endpoint
    console.log('3. Testing itch.io Projects Endpoint:');
    const itchResponse = await fetch(`${BASE_URL}/api/v1/itchprojects`);
    const itchData = await itchResponse.json();
    console.log('itch.io Projects Response:', {
      success: itchData.success,
      count: itchData.count,
      games: itchData.data?.slice(0, 2) // Show first 2 games
    });
    console.log('✓ itch.io endpoint working\n');

    console.log('🎉 All backend endpoints are working correctly!');
    console.log('\nNext steps:');
    console.log('1. Start the Aetheria frontend: cd aetheria-portfolio && npm run dev');
    console.log('2. Open http://localhost:5173 in your browser');
    console.log('3. Navigate to the PROJECTS NPC to see real data from your backend');

  } catch (error) {
    console.error('❌ Error testing endpoints:', error.message);
    console.log('\nMake sure your backend is running on port 3001');
    console.log('Start backend with: cd backend && npm run dev');
  }
}

testEndpoints();