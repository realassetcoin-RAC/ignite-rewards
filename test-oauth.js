// Simple OAuth Test Script
import https from 'https';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔧 Testing OAuth Configuration...\n');

// Test 1: Check if server is running
console.log('1. Testing server connectivity...');
const testServer = () => {
  return new Promise((resolve, reject) => {
    const req = http.get('http://localhost:8084', (res) => {
      console.log(`   ✅ Server is running on port 8084 (Status: ${res.statusCode})`);
      resolve(true);
    });
    
    req.on('error', (err) => {
      console.log(`   ❌ Server not accessible: ${err.message}`);
      reject(err);
    });
    
    req.setTimeout(5000, () => {
      console.log('   ❌ Server connection timeout');
      reject(new Error('Timeout'));
    });
  });
};

// Test 2: Check OAuth test page
console.log('2. Testing OAuth test page...');
const testOAuthPage = () => {
  return new Promise((resolve, reject) => {
    const req = http.get('http://localhost:8084/auth-test-simple.html', (res) => {
      if (res.statusCode === 200) {
        console.log('   ✅ OAuth test page is accessible');
        resolve(true);
      } else {
        console.log(`   ❌ OAuth test page returned status: ${res.statusCode}`);
        reject(new Error(`Status: ${res.statusCode}`));
      }
    });
    
    req.on('error', (err) => {
      console.log(`   ❌ OAuth test page not accessible: ${err.message}`);
      reject(err);
    });
    
    req.setTimeout(5000, () => {
      console.log('   ❌ OAuth test page timeout');
      reject(new Error('Timeout'));
    });
  });
};

// Test 3: Check main application
console.log('3. Testing main application...');
const testMainApp = () => {
  return new Promise((resolve, reject) => {
    const req = http.get('http://localhost:8084', (res) => {
      if (res.statusCode === 200) {
        console.log('   ✅ Main application is accessible');
        resolve(true);
      } else {
        console.log(`   ❌ Main application returned status: ${res.statusCode}`);
        reject(new Error(`Status: ${res.statusCode}`));
      }
    });
    
    req.on('error', (err) => {
      console.log(`   ❌ Main application not accessible: ${err.message}`);
      reject(err);
    });
    
    req.setTimeout(5000, () => {
      console.log('   ❌ Main application timeout');
      reject(new Error('Timeout'));
    });
  });
};

// Test 4: Check environment variables
console.log('4. Checking environment configuration...');
const checkEnvConfig = () => {
  
  try {
    const envPath = path.join(__dirname, '.env');
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      
      const hasClientId = envContent.includes('VITE_GOOGLE_CLIENT_ID=965254391266-pi0nuo882g88tjn1hgn9uh7n72macekh.apps.googleusercontent.com');
      const hasRedirectUri = envContent.includes('VITE_GOOGLE_REDIRECT_URI=http://localhost:8084/auth/callback');
      const hasOAuthApiUrl = envContent.includes('VITE_OAUTH_API_BASE_URL=http://localhost:8084');
      
      console.log(`   ✅ .env file exists`);
      console.log(`   ${hasClientId ? '✅' : '❌'} Google Client ID configured`);
      console.log(`   ${hasRedirectUri ? '✅' : '❌'} Redirect URI configured (localhost:8084)`);
      console.log(`   ${hasOAuthApiUrl ? '✅' : '❌'} OAuth API URL configured (localhost:8084)`);
      
      return hasClientId && hasRedirectUri && hasOAuthApiUrl;
    } else {
      console.log('   ❌ .env file not found');
      return false;
    }
  } catch (error) {
    console.log(`   ❌ Error reading .env file: ${error.message}`);
    return false;
  }
};

// Run all tests
async function runTests() {
  try {
    await testServer();
    await testOAuthPage();
    await testMainApp();
    const envOk = checkEnvConfig();
    
    console.log('\n🎯 Test Summary:');
    console.log('================');
    console.log('✅ Server is running on port 8084');
    console.log('✅ OAuth test page is accessible');
    console.log('✅ Main application is accessible');
    console.log(`${envOk ? '✅' : '❌'} Environment configuration ${envOk ? 'looks good' : 'needs attention'}`);
    
    console.log('\n📋 Next Steps:');
    console.log('==============');
    console.log('1. Open http://localhost:8084/auth-test-simple.html in your browser');
    console.log('2. Click "🚀 Test Complete Auth Flow" button');
    console.log('3. Check browser console for any errors');
    console.log('4. If successful, test the main app at http://localhost:8084');
    
    if (envOk) {
      console.log('\n🎉 OAuth configuration appears to be correct!');
      console.log('   The Google Cloud Console settings should work with this setup.');
    } else {
      console.log('\n⚠️  Environment configuration needs to be fixed.');
    }
    
  } catch (error) {
    console.log(`\n❌ Test failed: ${error.message}`);
    console.log('\n🔧 Troubleshooting:');
    console.log('===================');
    console.log('1. Make sure the development server is running: bun run dev');
    console.log('2. Check if port 8084 is available: netstat -ano | findstr :8084');
    console.log('3. Verify .env file exists and has correct values');
  }
}

runTests();
