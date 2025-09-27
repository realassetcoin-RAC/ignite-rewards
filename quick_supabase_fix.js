// Quick Supabase Fix - Immediate Solution
// Run this in browser console for immediate fix

console.log('🔧 QUICK SUPABASE FIX - IMMEDIATE SOLUTION');

// Step 1: Complete cleanup
localStorage.clear();
sessionStorage.clear();
console.log('✅ Storage cleared');

// Step 2: Create direct Supabase client
const { createClient } = await import('https://cdn.skypack.dev/@supabase/supabase-js@2');
const directSupabase = createClient(
    'https://wndswqvqogeblksrujpg.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InduZHN3cXZxb2dlYmxrc3J1anBnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzMzEyMTAsImV4cCI6MjA3MTkwNzIxMH0.eOXJEo3XheuB2AK3NlRotSKqPMueqkgPUa896TM-hfA'
);

// Step 3: Test connection
const { data, error } = await directSupabase.from('profiles').select('count').limit(1);
if (error) {
    console.error('❌ Connection failed:', error);
} else {
    console.log('✅ Connection successful');
}

// Step 4: Login with admin credentials
const { data: loginData, error: loginError } = await directSupabase.auth.signInWithPassword({
    email: 'admin@igniterewards.com',
    password: 'admin123!'
});

if (loginError) {
    console.error('❌ Login failed:', loginError);
} else {
    console.log('✅ Login successful');
    
    // Store session
    localStorage.setItem('sb-wndswqvqogeblksrujpg-auth-token', JSON.stringify({
        currentSession: loginData.session,
        expiresAt: loginData.session.expires_at
    }));
    
    // Override app's database adapter
    if (window.databaseAdapter) {
        window.databaseAdapter.supabaseClient = directSupabase;
        console.log('✅ Database adapter overridden');
    }
    
    // Refresh page
    console.log('🔄 Refreshing page...');
    window.location.reload();
}

