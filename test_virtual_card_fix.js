/**
 * Test script to verify virtual card creation fixes
 * Run this in the browser console after the fixes are applied
 */

async function testVirtualCardCreation() {
  console.log('🧪 Testing Virtual Card Creation Fix...');
  
  try {
    // Test 1: Check if Supabase client is available
    console.log('1. Checking Supabase client...');
    if (typeof supabase === 'undefined') {
      throw new Error('Supabase client not found');
    }
    console.log('✅ Supabase client available');
    
    // Test 2: Check authentication
    console.log('2. Checking authentication...');
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError) {
      throw new Error(`Authentication error: ${authError.message}`);
    }
    if (!user) {
      throw new Error('No authenticated user found');
    }
    console.log('✅ User authenticated:', user.email);
    
    // Test 3: Test loyalty number generation functions
    console.log('3. Testing loyalty number generation...');
    
    // Test api schema function
    try {
      const { data: apiNumber, error: apiError } = await supabase
        .rpc('generate_loyalty_number', { user_email: user.email });
      
      if (apiError) {
        console.warn('⚠️ API schema function failed:', apiError.message);
      } else {
        console.log('✅ API schema function works:', apiNumber);
      }
    } catch (e) {
      console.warn('⚠️ API schema function error:', e.message);
    }
    
    // Test public schema function
    try {
      const { data: publicNumber, error: publicError } = await supabase
        .rpc('generate_loyalty_number');
      
      if (publicError) {
        console.warn('⚠️ Public schema function failed:', publicError.message);
      } else {
        console.log('✅ Public schema function works:', publicNumber);
      }
    } catch (e) {
      console.warn('⚠️ Public schema function error:', e.message);
    }
    
    // Test 4: Check existing loyalty cards
    console.log('4. Checking existing loyalty cards...');
    
    // Check api schema
    try {
      const { data: apiCards, error: apiError } = await supabase
        .from('api.user_loyalty_cards')
        .select('*')
        .eq('user_id', user.id);
      
      if (apiError) {
        console.warn('⚠️ API schema table access failed:', apiError.message);
      } else {
        console.log('✅ API schema table accessible, cards found:', apiCards?.length || 0);
      }
    } catch (e) {
      console.warn('⚠️ API schema table error:', e.message);
    }
    
    // Check public schema
    try {
      const { data: publicCards, error: publicError } = await supabase
        .from('public.user_loyalty_cards')
        .select('*')
        .eq('user_id', user.id);
      
      if (publicError) {
        console.warn('⚠️ Public schema table access failed:', publicError.message);
      } else {
        console.log('✅ Public schema table accessible, cards found:', publicCards?.length || 0);
      }
    } catch (e) {
      console.warn('⚠️ Public schema table error:', e.message);
    }
    
    // Test 5: Simulate card creation (without actually creating)
    console.log('5. Testing card creation simulation...');
    
    const testData = {
      user_id: user.id,
      loyalty_number: 'T' + Math.floor(Math.random() * 10000000).toString().padStart(7, '0'),
      full_name: 'Test User',
      email: user.email,
      phone: '+1234567890',
      is_active: true
    };
    
    console.log('Test data prepared:', testData);
    console.log('✅ Card creation simulation ready');
    
    console.log('\n🎉 Virtual Card Creation Fix Test Complete!');
    console.log('If you see ✅ for most tests, the fix should work correctly.');
    console.log('⚠️ warnings indicate fallback mechanisms will be used.');
    console.log('❌ errors indicate issues that need to be addressed.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Full error:', error);
  }
}

// Auto-run the test
testVirtualCardCreation();