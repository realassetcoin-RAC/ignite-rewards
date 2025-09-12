import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Sparkles } from "lucide-react";
import { getDashboardUrl } from "@/lib/dashboard-routing";
import { robustAdminCheck } from "@/utils/adminVerification";
import { TermsPrivacyService } from "@/lib/termsPrivacyService";
import TermsAcceptanceModal from "@/components/TermsAcceptanceModal";

/**
 * Auth callback page that handles role-based redirects after OAuth authentication
 * @returns {JSX.Element} The auth callback page component
 */
const AuthCallback = () => {
  const navigate = useNavigate();
  const [isLoaded, setIsLoaded] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [pendingUser, setPendingUser] = useState<any>(null);
  const [pendingProfile, setPendingProfile] = useState<any>(null);
  const [pendingIsAdmin, setPendingIsAdmin] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const handleTermsAccept = () => {
    console.log('✅ AuthCallback: Terms accepted, proceeding to dashboard');
    setShowTermsModal(false);
    
    // Use the same routing logic as the rest of the app
    const dashboardUrl = getDashboardUrl(pendingIsAdmin, pendingProfile);
    
    console.log('🎯 AuthCallback: Routing decision after terms acceptance:', {
      isAdmin: pendingIsAdmin,
      profile: pendingProfile,
      role: pendingProfile?.role,
      dashboardUrl
    });
    
    navigate(dashboardUrl);
  };

  const handleTermsModalClose = () => {
    console.log('❌ AuthCallback: Terms modal closed, signing out user');
    setShowTermsModal(false);
    // The modal will handle sign out
  };

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    let authStateSubscription: any;

    const processUserSession = async (user: any) => {
      try {
        console.log('✅ AuthCallback: Processing authentication for user:', user.email);
        console.log('✅ AuthCallback: User ID:', user.id);
        console.log('✅ AuthCallback: User metadata:', user.user_metadata);
        
        // First, try to get the user profile with timeout
        console.log('🔄 AuthCallback: Attempting to fetch user profile...');
        let profileResult;
        try {
          const profilePromise = supabase
            .from('profiles' as any)
            .select('id, email, full_name, role, created_at, updated_at')
            .eq('id', user.id)
            .single();
          
          const profileTimeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Profile fetch timeout after 5 seconds')), 5000)
          );
          
          profileResult = await Promise.race([profilePromise, profileTimeoutPromise]) as any;
          console.log('📊 AuthCallback: Profile fetch result:', profileResult);
        } catch (profileError) {
          console.log('⚠️ AuthCallback: Profile fetch timeout, using fallback');
          profileResult = { data: null, error: profileError };
        }
        
        let profile = profileResult.data;
        
        // If profile doesn't exist, create it (fallback for OAuth users)
        if (!profile && (profileResult.error?.code === 'PGRST116' || profileResult.error)) {
          console.log('⚠️ AuthCallback: Profile not found, creating one for OAuth user...');
          
          try {
            const createPromise = supabase
              .from('profiles' as any)
              .insert({
                id: user.id,
                email: user.email,
                full_name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'User',
                role: 'user'
              } as any)
              .select('id, email, full_name, role, created_at, updated_at')
              .single();
            
            const createTimeoutPromise = new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Profile creation timeout after 5 seconds')), 5000)
            );
            
            const { data: newProfile, error: createError } = await Promise.race([createPromise, createTimeoutPromise]) as any;
            
            if (createError) {
              console.log('⚠️ AuthCallback: Profile creation timeout, using fallback');
              // Create a fallback profile object
              profile = {
                id: user.id,
                email: user.email,
                full_name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'User',
                role: 'user',
                created_at: user.created_at,
                updated_at: user.updated_at || user.created_at
              };
              console.log('✅ AuthCallback: Using fallback profile');
            } else {
              console.log('✅ AuthCallback: Profile created successfully');
              profile = newProfile;
            }
          } catch (createError) {
            console.log('⚠️ AuthCallback: Profile creation failed, using fallback');
            // Create a fallback profile object
            profile = {
              id: user.id,
              email: user.email,
              full_name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'User',
              role: 'user',
              created_at: user.created_at,
              updated_at: user.updated_at || user.created_at
            };
            console.log('✅ AuthCallback: Using fallback profile');
          }
        }
        
        // Get admin status and terms acceptance with timeouts
        console.log('🔄 AuthCallback: Getting admin status and terms acceptance...');
        let isAdmin = false;
        let termsAcceptance = null;
        
        try {
          const adminPromise = robustAdminCheck();
          const termsPromise = TermsPrivacyService.getUserAcceptance(user.id);
          
          const adminTimeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Admin check timeout after 5 seconds')), 5000)
          );
          const termsTimeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Terms check timeout after 5 seconds')), 5000)
          );
          
          const [adminResult, termsResult] = await Promise.all([
            Promise.race([adminPromise, adminTimeoutPromise]),
            Promise.race([termsPromise, termsTimeoutPromise])
          ]);
          
          isAdmin = adminResult as boolean;
          termsAcceptance = termsResult as any;
          console.log('✅ AuthCallback: Admin and terms checks completed:', { isAdmin, termsAcceptance });
        } catch (error) {
          console.log('⚠️ AuthCallback: Admin/terms checks timeout, using fallbacks');
          isAdmin = false; // Safe fallback
          // Don't set termsAcceptance to null on timeout - assume user has accepted terms
          // Only show terms modal if we explicitly know they haven't accepted
          termsAcceptance = { terms_accepted: true, privacy_accepted: true }; // Safe fallback
        }
        
        // Check if user needs to accept terms and privacy
        // Only show modal if we explicitly know they haven't accepted terms
        const needsTermsAcceptance = termsAcceptance && 
          (!termsAcceptance.terms_accepted || !termsAcceptance.privacy_accepted);
        
        if (needsTermsAcceptance) {
          console.log('⚠️ AuthCallback: User needs to accept terms and privacy, showing modal');
          setPendingUser(user);
          setPendingProfile(profile);
          setPendingIsAdmin(isAdmin);
          setShowTermsModal(true);
          return;
        }
        
        console.log('✅ AuthCallback: User has already accepted terms, proceeding to dashboard');
        
        // Use the same routing logic as the rest of the app
        const dashboardUrl = getDashboardUrl(isAdmin, profile);
        
        console.log('🎯 AuthCallback: Routing decision:', {
          isAdmin,
          profile: profile,
          role: profile?.role,
          dashboardUrl,
          termsAccepted: termsAcceptance?.terms_accepted,
          privacyAccepted: termsAcceptance?.privacy_accepted
        });
        
        navigate(dashboardUrl);
      } catch (error) {
        console.error('💥 AuthCallback: Error processing user session:', error);
        navigate('/');
      }
    };

    const handleAuthCallback = async () => {
      try {
        console.log('🔄 AuthCallback: Starting OAuth callback handling...');
        
        // Listen for auth state changes (this is more reliable for OAuth callbacks)
        authStateSubscription = supabase.auth.onAuthStateChange(async (event, session) => {
          console.log('🔔 AuthCallback: Auth state change event:', event);
          console.log('🔔 AuthCallback: Session details:', session);
          console.log('🔔 AuthCallback: User details:', session?.user);
          
          if (event === 'SIGNED_IN' && session?.user) {
            console.log('✅ AuthCallback: User signed in via OAuth, processing session...');
            try {
              await processUserSession(session.user);
            } catch (error) {
              console.error('❌ AuthCallback: Error processing user session:', error);
              navigate('/');
            }
          } else if (event === 'SIGNED_OUT') {
            console.log('❌ AuthCallback: User signed out, redirecting to home');
            navigate('/');
          } else if (event === 'TOKEN_REFRESHED') {
            console.log('🔄 AuthCallback: Token refreshed, checking session...');
            if (session?.user) {
              try {
                await processUserSession(session.user);
              } catch (error) {
                console.error('❌ AuthCallback: Error processing refreshed session:', error);
                navigate('/');
              }
            }
          } else {
            console.log('⚠️ AuthCallback: Unhandled auth event:', event, 'Session:', !!session);
          }
        });

        // Also try to get the current session immediately
        const { data: authData, error: authError } = await supabase.auth.getSession();
        
        if (authError) {
          console.error('❌ AuthCallback: Error getting session:', authError);
          navigate('/');
          return;
        }
        
        if (authData?.session?.user) {
          console.log('✅ AuthCallback: Found existing session, processing...');
          await processUserSession(authData.session.user);
        } else {
          console.log('⏳ AuthCallback: No session found, waiting for OAuth callback...');
          
          // Set up a more aggressive session check
          const checkSessionInterval = setInterval(async () => {
            console.log('🔄 AuthCallback: Checking for session...');
            const { data: checkData, error: checkError } = await supabase.auth.getSession();
            
            if (!checkError && checkData?.session?.user) {
              console.log('✅ AuthCallback: Found session during interval check, processing...');
              clearInterval(checkSessionInterval);
              if (timeoutId) {
                clearTimeout(timeoutId);
                timeoutId = null;
              }
              await processUserSession(checkData.session.user);
            }
          }, 1000); // Check every second
          
          // Set a timeout to redirect if no auth state change occurs
          timeoutId = setTimeout(() => {
            console.log('⏰ AuthCallback: Timeout waiting for OAuth callback, redirecting to home');
            clearInterval(checkSessionInterval);
            navigate('/');
          }, 15000); // Increased to 15 second timeout
        }
        
      } catch (error) {
        console.error('💥 AuthCallback: Error during callback handling:', error);
        navigate('/');
      }
    };

    // Start the callback handling
    timeoutId = setTimeout(handleAuthCallback, 100);
    
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (authStateSubscription) authStateSubscription.data.subscription.unsubscribe();
    };
  }, [navigate]);

  return (
    <div className="min-h-screen hero-gradient relative overflow-hidden flex items-center justify-center">
      {/* Animated Background Elements */}
      <div className="absolute top-20 left-20 w-72 h-72 bg-gradient-to-r from-primary/20 to-purple-500/20 rounded-full mix-blend-multiply filter blur-xl animate-pulse pointer-events-none"></div>
      <div className="absolute top-40 right-20 w-96 h-96 bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-2000 pointer-events-none"></div>
      <div className="absolute -bottom-20 left-40 w-80 h-80 bg-gradient-to-r from-blue-500/20 to-primary/20 rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-4000 pointer-events-none"></div>
      
      {/* Floating Particles */}
      <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-primary/40 rounded-full animate-bounce animation-delay-1000"></div>
      <div className="absolute top-1/3 right-1/3 w-1 h-1 bg-purple-500/60 rounded-full animate-bounce animation-delay-3000"></div>
      <div className="absolute bottom-1/3 left-1/3 w-1.5 h-1.5 bg-blue-500/50 rounded-full animate-bounce animation-delay-5000"></div>

      <div className="relative z-10 text-center space-y-4 card-gradient border-primary/20 backdrop-blur-md rounded-lg p-8">
        <div className="w-16 h-16 bg-primary rounded-lg flex items-center justify-center mx-auto mb-4">
          <Sparkles className="h-8 w-8 text-primary-foreground animate-pulse" />
        </div>
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
        <p className={`text-muted-foreground ${
          isLoaded ? 'animate-fade-in-up' : 'opacity-0'
        }`}>
          Kindly Wait while we Sign you In
        </p>
      </div>

      {/* Terms Acceptance Modal */}
      <TermsAcceptanceModal
        isOpen={showTermsModal}
        onClose={handleTermsModalClose}
        onAccept={handleTermsAccept}
      />
    </div>
  );
};

export default AuthCallback;