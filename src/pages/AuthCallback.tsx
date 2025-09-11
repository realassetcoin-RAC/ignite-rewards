import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Sparkles } from "lucide-react";
import { getDashboardUrl } from "@/lib/dashboard-routing";
import { robustAdminCheck } from "@/utils/adminVerification";
import { TermsPrivacyService } from "@/lib/termsPrivacyService";

/**
 * Auth callback page that handles role-based redirects after OAuth authentication
 * @returns {JSX.Element} The auth callback page component
 */
const AuthCallback = () => {
  const navigate = useNavigate();
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    let authStateSubscription: any;

    const processUserSession = async (user: any) => {
      try {
        console.log('✅ AuthCallback: Processing authentication for user:', user.email);
        
        // First, try to get the user profile
        let profileResult = await supabase
          .from('profiles')
          .select('id, email, full_name, role, created_at, updated_at')
          .eq('id', user.id)
          .single();
        
        let profile = profileResult.data;
        
        // If profile doesn't exist, create it (fallback for OAuth users)
        if (!profile && profileResult.error?.code === 'PGRST116') {
          console.log('⚠️ AuthCallback: Profile not found, creating one for OAuth user...');
          
          const { data: newProfile, error: createError } = await supabase
            .from('profiles')
            .insert({
              id: user.id,
              email: user.email,
              full_name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'User',
              role: 'user'
            })
            .select('id, email, full_name, role, created_at, updated_at')
            .single();
          
          if (createError) {
            console.error('❌ AuthCallback: Error creating profile:', createError);
            // Continue anyway, the user might still be able to use the app
          } else {
            console.log('✅ AuthCallback: Profile created successfully:', newProfile);
            profile = newProfile;
          }
        }
        
        // Get admin status and terms acceptance
        const [isAdmin, termsAcceptance] = await Promise.all([
          robustAdminCheck(),
          TermsPrivacyService.getUserAcceptance(user.id)
        ]);
        
        // Check if user needs to accept terms and privacy
        const needsTermsAcceptance = !termsAcceptance || !termsAcceptance.terms_accepted || !termsAcceptance.privacy_accepted;
        
        if (needsTermsAcceptance) {
          console.log('⚠️ AuthCallback: User needs to accept terms and privacy, redirecting to terms page');
          navigate('/?showTerms=true');
          return;
        }
        
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
          console.log('🔔 AuthCallback: Auth state change:', { 
            event, 
            hasSession: !!session,
            userId: session?.user?.id,
            userEmail: session?.user?.email,
            userMetadata: session?.user?.user_metadata
          });
          
          if (event === 'SIGNED_IN' && session?.user) {
            console.log('✅ AuthCallback: User signed in via OAuth, processing session...');
            await processUserSession(session.user);
          } else if (event === 'SIGNED_OUT') {
            console.log('❌ AuthCallback: User signed out, redirecting to home');
            navigate('/');
          } else if (event === 'TOKEN_REFRESHED') {
            console.log('🔄 AuthCallback: Token refreshed, checking session...');
            if (session?.user) {
              await processUserSession(session.user);
            }
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
          
          // Set a timeout to redirect if no auth state change occurs
          timeoutId = setTimeout(() => {
            console.log('⏰ AuthCallback: Timeout waiting for OAuth callback, redirecting to home');
            navigate('/');
          }, 10000); // 10 second timeout
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
          Completing sign in...
        </p>
      </div>
    </div>
  );
};

export default AuthCallback;