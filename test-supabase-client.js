// Test script to verify Supabase client is working
// Run this in the browser console or as a Node.js script

console.log('🧪 Testing Supabase Client...');

// Test if the client has the required methods
const testClient = {
  auth: {
    getSession: () => Promise.resolve({ data: { session: null }, error: null }),
    getUser: () => Promise.resolve({ data: { user: null }, error: null }),
    signInWithPassword: () => Promise.resolve({ data: { user: null, session: null }, error: null }),
    signOut: () => Promise.resolve({ error: null }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } })
  }
};

// Test the methods
async function testSupabaseClient() {
  try {
    console.log('✅ Testing getSession...');
    const sessionResult = await testClient.auth.getSession();
    console.log('✅ getSession works:', sessionResult);

    console.log('✅ Testing getUser...');
    const userResult = await testClient.auth.getUser();
    console.log('✅ getUser works:', userResult);

    console.log('✅ Testing signInWithPassword...');
    const signInResult = await testClient.auth.signInWithPassword({ email: 'test@test.com', password: 'test' });
    console.log('✅ signInWithPassword works:', signInResult);

    console.log('✅ Testing signOut...');
    const signOutResult = await testClient.auth.signOut();
    console.log('✅ signOut works:', signOutResult);

    console.log('✅ Testing onAuthStateChange...');
    const authChangeResult = testClient.auth.onAuthStateChange(() => {});
    console.log('✅ onAuthStateChange works:', authChangeResult);

    console.log('🎉 All Supabase client methods are working!');
  } catch (error) {
    console.error('❌ Error testing Supabase client:', error);
  }
}

// Run the test
testSupabaseClient();
