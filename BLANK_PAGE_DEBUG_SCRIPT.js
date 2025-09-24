// Blank Page Debug Script
// Run this in the browser console to diagnose the issue

console.log('🔍 Starting blank page diagnostic...');

// Check 1: Basic DOM elements
console.log('1. Checking DOM elements:');
console.log('- Root element:', document.getElementById('root'));
console.log('- Root children:', document.getElementById('root')?.children.length);

// Check 2: React DevTools
console.log('2. Checking React:');
if (window.React) {
  console.log('✅ React is loaded');
} else {
  console.log('❌ React is not loaded');
}

// Check 3: Check for errors
console.log('3. Checking for errors:');
const errors = [];
const originalError = console.error;
console.error = function(...args) {
  errors.push(args);
  originalError.apply(console, args);
};

// Check 4: Network requests
console.log('4. Checking network requests:');
const networkEntries = performance.getEntriesByType('resource');
const failedRequests = networkEntries.filter(entry => entry.transferSize === 0);
console.log('Failed requests:', failedRequests);

// Check 5: Check if main script loaded
console.log('5. Checking main script:');
const scripts = Array.from(document.scripts);
const mainScript = scripts.find(script => script.src.includes('index-'));
console.log('Main script:', mainScript);

// Check 6: Check for authentication issues
console.log('6. Checking authentication:');
if (window.supabase) {
  console.log('✅ Supabase is loaded');
  // Test connection
  window.supabase.auth.getSession().then(({ data, error }) => {
    console.log('Auth session:', { data, error });
  }).catch(err => {
    console.log('Auth error:', err);
  });
} else {
  console.log('❌ Supabase is not loaded');
}

// Check 7: Check for wallet issues
console.log('7. Checking wallet providers:');
if (window.solana) {
  console.log('✅ Solana wallet detected');
} else {
  console.log('❌ No Solana wallet detected');
}

// Summary
setTimeout(() => {
  console.log('📊 Diagnostic Summary:');
  console.log('- DOM ready:', document.readyState);
  console.log('- Errors found:', errors.length);
  console.log('- Failed requests:', failedRequests.length);
  console.log('- Main script loaded:', !!mainScript);
  
  if (errors.length > 0) {
    console.log('🚨 Errors detected:');
    errors.forEach((error, index) => {
      console.log(`Error ${index + 1}:`, error);
    });
  }
  
  if (failedRequests.length > 0) {
    console.log('🚨 Failed requests:');
    failedRequests.forEach((request, index) => {
      console.log(`Request ${index + 1}:`, request.name);
    });
  }
}, 2000);


