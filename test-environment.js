// Test environment variable loading
console.log('🔍 Testing environment variables...');

// Check if we're in a browser environment
if (typeof window !== 'undefined') {
  console.log('🌐 Browser environment detected');
  console.log('VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL);
  console.log('VITE_SUPABASE_ANON_KEY:', import.meta.env.VITE_SUPABASE_ANON_KEY ? 'present' : 'missing');
  console.log('VITE_ENABLE_MOCK_AUTH:', import.meta.env.VITE_ENABLE_MOCK_AUTH);
} else {
  console.log('🖥️ Node.js environment detected');
  console.log('VITE_SUPABASE_URL:', process.env.VITE_SUPABASE_URL);
  console.log('VITE_SUPABASE_ANON_KEY:', process.env.VITE_SUPABASE_ANON_KEY ? 'present' : 'missing');
  console.log('VITE_ENABLE_MOCK_AUTH:', process.env.VITE_ENABLE_MOCK_AUTH);
}

