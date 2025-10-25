/**
 * Utility to fix admin user issues
 * This can be run in the browser console to fix admin user problems
 */


export async function fixAdminUser(email: string = 'realassetcoin@gmail.com'): Promise<boolean> {
  console.log(`🔧 Attempting to fix admin user: ${email}`);
  
  try {
    // First, get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('❌ No authenticated user found:', userError);
      return false;
    }
    
    if (user.email?.toLowerCase() !== email.toLowerCase()) {
      console.error(`❌ Current user ${user.email} does not match target email ${email}`);
      return false;
    }
    
    console.log('✅ User authenticated:', user.email);
    
    // Check if profile exists
    const { data: existingProfile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    
    if (profileError && profileError.code !== 'PGRST116') {
      console.error('❌ Error checking profile:', profileError);
      return false;
    }
    
    if (!existingProfile) {
      console.log('📝 Creating new profile...');
      // Create profile
      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          email: user.email,
          full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Admin User',
          role: 'admin'
        })
        .select()
        .single();
      
      if (createError) {
        console.error('❌ Error creating profile:', createError);
        return false;
      }
      
      console.log('✅ Profile created:', newProfile);
    } else {
      console.log('✅ Profile exists:', existingProfile);
      
      // Update role to admin if it's not already
      if (existingProfile.role !== 'admin') {
        console.log('📝 Updating role to admin...');
        const { data: updatedProfile, error: updateError } = await supabase
          .from('profiles')
          .update({ role: 'admin' })
          .eq('id', user.id)
          .select()
          .single();
        
        if (updateError) {
          console.error('❌ Error updating role:', updateError);
          return false;
        }
        
        console.log('✅ Role updated:', updatedProfile);
      } else {
        console.log('✅ Role is already admin');
      }
    }
    
    // Test admin access
    console.log('🧪 Testing admin access...');
    
    try {
      const { data: isAdminResult, error: isAdminError } = await supabase.rpc('is_admin');
      console.log('is_admin RPC result:', { data: isAdminResult, error: isAdminError });
    } catch (error) {
      console.log('is_admin RPC failed:', error);
    }
    
    try {
      const { data: checkAdminResult, error: checkAdminError } = await supabase.rpc('check_admin_access');
      console.log('check_admin_access RPC result:', { data: checkAdminResult, error: checkAdminError });
    } catch (error) {
      console.log('check_admin_access RPC failed:', error);
    }
    
    console.log('🎉 Admin user fix completed successfully!');
    console.log('💡 You may need to refresh the page or log out and log back in for changes to take effect.');
    
    return true;
    
  } catch (error) {
    console.error('❌ Fix admin user failed:', error);
    return false;
  }
}

// Make it available globally for console use
if (typeof window !== 'undefined') {
  (window as any).fixAdminUser = fixAdminUser;
}

export default fixAdminUser;