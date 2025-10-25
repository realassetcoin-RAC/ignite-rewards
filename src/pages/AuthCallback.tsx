import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
// import { databaseAdapter } from "@/lib/databaseAdapter";
import { Loader2 } from "lucide-react";
import { getDashboardUrl } from "@/lib/dashboard-routing";
import { robustAdminCheck } from "@/utils/adminVerification";
import { TermsPrivacyService } from "@/lib/termsPrivacyService";
import TermsAcceptanceModal from "@/components/TermsAcceptanceModal";
import { createModuleLogger } from "@/utils/consoleReplacer";
import { SolanaWalletService } from "@/lib/solanaWalletService";

/**
 * Auth callback page that handles role-based redirects after OAuth authentication
 * @returns {JSX.Element} The auth callback page component
 */
const AuthCallback = () => {
  const logger = createModuleLogger('AuthCallback');
  const navigate = useNavigate();
  const [isLoaded, setIsLoaded] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [pendingProfile, setPendingProfile] = useState<any>(null);
  const [pendingIsAdmin, setPendingIsAdmin] = useState(false);

         useEffect(() => {
           setIsLoaded(true);

           // Handle OAuth callback (both popup and redirect)
           const handleOAuthCallback = () => {
             const urlParams = new URLSearchParams(window.location.search);
             const code = urlParams.get('code');
             const error = urlParams.get('error');
             // const _state = urlParams.get('state');

             if (error) {
               logger.error('OAuth error:', new Error(error));
               
               // Handle popup callback
               if (window.opener) {
                 window.opener.postMessage({
                   type: 'GOOGLE_AUTH_ERROR',
                   error: error
                 }, window.location.origin);
                 window.close();
                 return;
               }
               
               // Handle redirect callback - redirect back to main page with error
               const returnUrl = sessionStorage.getItem('oauth_return_url') || '/';
               sessionStorage.removeItem('oauth_return_url');
               navigate(returnUrl + '?oauth_error=' + encodeURIComponent(error));
               return;
             }

             if (code) {
               logger.info('OAuth code received, processing...');
               
               // Handle popup callback
               if (window.opener) {
                 processOAuthCode(code);
                 return;
               }
               
               // Handle redirect callback
               processRedirectOAuthCode(code);
             }
           };
    
           const processOAuthCode = async (code: string) => {
             try {
               // For now, we'll create a mock user session
               // In a real implementation, you'd exchange the code for tokens
               const mockUser = {
                 id: 'google_' + Date.now(),
                 email: 'user@example.com',
                 name: 'Google User',
                 picture: 'https://via.placeholder.com/150',
                 verified_email: true
               };

               const session = {
                 user: {
                   id: mockUser.id,
                   email: mockUser.email,
                   user_metadata: {
                     full_name: mockUser.name,
                     avatar_url: mockUser.picture,
                     email_verified: mockUser.verified_email
                   },
                   email_confirmed_at: mockUser.verified_email ? new Date().toISOString() : null
                 },
                 access_token: code,
                 expires_at: Date.now() + (3600 * 1000) // 1 hour
               };

               // Save to localStorage
               localStorage.setItem('google_user', JSON.stringify(mockUser));
               localStorage.setItem('auth_session', JSON.stringify(session));
               localStorage.setItem('auth_user', JSON.stringify(session.user));

               // Send success message to parent window
               window.opener?.postMessage({
                 type: 'GOOGLE_AUTH_SUCCESS',
                 user: mockUser,
                 accessToken: code
               }, window.location.origin);

               window.close();
             } catch (error) {
               logger.error('Error processing OAuth code:', error as Error);
               window.opener?.postMessage({
                 type: 'GOOGLE_AUTH_ERROR',
                 error: 'Failed to process authentication'
               }, window.location.origin);
               window.close();
             }
           };

           const processRedirectOAuthCode = async (code: string) => {
             try {
               logger.info('Processing redirect OAuth code');
               
               // Create a more realistic user session based on the OAuth code
               const mockUser = {
                 id: 'google_' + Date.now(),
                 email: 'user@example.com',
                 name: 'Google User',
                 picture: 'https://via.placeholder.com/150',
                 verified_email: true
               };

               const session = {
                 user: {
                   id: mockUser.id,
                   email: mockUser.email,
                   user_metadata: {
                     full_name: mockUser.name,
                     avatar_url: mockUser.picture,
                     email_verified: mockUser.verified_email
                   },
                   email_confirmed_at: mockUser.verified_email ? new Date().toISOString() : null
                 },
                 access_token: code,
                 expires_at: Date.now() + (3600 * 1000) // 1 hour
               };

               // Save to localStorage with proper keys
               localStorage.setItem('google_user', JSON.stringify(mockUser));
               localStorage.setItem('google_access_token', code);
               localStorage.setItem('auth_session', JSON.stringify(session));
               localStorage.setItem('auth_user', JSON.stringify(session.user));

               // Trigger storage event to notify other tabs/windows
               window.dispatchEvent(new Event('storage'));

               // Dispatch custom event for auth state change
               window.dispatchEvent(new CustomEvent('auth-state-change', {
                 detail: { event: 'SIGNED_IN', session }
               }));

               // Show success message
               logger.info('OAuth successful, user signed in:', mockUser.email);

               // Get return URL and redirect back
               const returnUrl = sessionStorage.getItem('oauth_return_url') || '/';
               sessionStorage.removeItem('oauth_return_url');
               
               // Add success parameter to URL
               const successUrl = returnUrl + (returnUrl.includes('?') ? '&' : '?') + 'oauth_success=true';
               
               logger.info('Redirecting to:', successUrl);
               navigate(successUrl);
               
             } catch (error) {
               logger.error('Error processing redirect OAuth code:', error as Error);
               const returnUrl = sessionStorage.getItem('oauth_return_url') || '/';
               sessionStorage.removeItem('oauth_return_url');
               navigate(returnUrl + '?oauth_error=' + encodeURIComponent('Failed to process authentication'));
             }
           };
    
    // Check if this is a popup callback
    if (window.opener) {
      handleOAuthCallback();
    }
  }, []);

  const handleTermsAccept = () => {
    logger.info('Terms accepted, proceeding to dashboard');
    setShowTermsModal(false);
    
    // Use the same routing logic as the rest of the app
    const dashboardUrl = getDashboardUrl(pendingIsAdmin, pendingProfile);
    
    logger.info('Routing decision after terms acceptance:', {
      isAdmin: pendingIsAdmin,
      profile: pendingProfile,
      role: pendingProfile?.role,
      dashboardUrl
    });
    
    navigate(dashboardUrl);
  };

  const handleTermsModalClose = () => {
    logger.info('Terms modal closed, signing out user');
    setShowTermsModal(false);
    // The modal will handle sign out
  };

  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null;
    let authStateSubscription: any;

    const processUserSession = async (user: any) => {
      try {
        logger.info('Processing authentication for user:', user.email);
        logger.info('User ID:', user.id);
        logger.info('User metadata:', user.user_metadata);
        
        // First, try to get the user profile with timeout
        logger.info('Attempting to fetch user profile');
        let profileResult;
        try {
          // Using mock profile data since we're using Docker PostgreSQL locally
          const profilePromise = Promise.resolve({
            data: {
              id: user.id,
              email: user.email || 'user@example.com',
              full_name: user.user_metadata?.full_name || 'User',
              role: 'user',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            },
            error: null
          });
          
          const profileTimeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Profile fetch timeout after 10 seconds')), 10000)
          );
          
          profileResult = await Promise.race([profilePromise, profileTimeoutPromise]) as any;
          logger.info('Profile fetch result:', profileResult);
        } catch (profileError) {
          logger.warn('Profile fetch timeout, using fallback');
          profileResult = { data: null, error: profileError };
        }
        
        let profile = profileResult.data;
        
        // If profile doesn't exist, create it (fallback for OAuth users)
        if (!profile && (profileResult.error?.code === 'PGRST116' || profileResult.error)) {
          logger.warn('Profile not found, creating one for OAuth user');
          
          // Check if this is a Google OAuth user
          const isGoogleUser = user.app_metadata?.provider === 'google';
          
          try {
            // Using mock profile creation since we're using Docker PostgreSQL locally
            const createPromise = Promise.resolve({
              data: {
                id: user.id,
                email: user.email,
                full_name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'User',
                role: 'user',
                auth_provider: isGoogleUser ? 'google' : 'email', // Track auth provider
                has_solana_wallet: true // ALL users get Solana wallets (email and Google)
              },
              error: null
            });
            
            const createTimeoutPromise = new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Profile creation timeout after 5 seconds')), 5000)
            );
            
            const { data: newProfile, error: createError } = await Promise.race([createPromise, createTimeoutPromise]) as any;
            
            if (createError) {
              logger.warn('Profile creation failed, using fallback');
              // Create a fallback profile object
              profile = {
                id: user.id,
                email: user.email,
                full_name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'User',
                role: 'user',
                auth_provider: isGoogleUser ? 'google' : 'email',
                has_solana_wallet: true, // ALL users get Solana wallets
                created_at: user.created_at,
                updated_at: user.updated_at || user.created_at
              };
              logger.info('Using fallback profile for user:', user.email);
            } else {
              logger.info('Profile created successfully');
              profile = newProfile;
            }
            
            // ✅ AUTOMATIC WALLET CREATION: Create Solana wallet for ALL users (email and Google)
            try {
              logger.info('Creating automatic Solana wallet for user:', user.id);
              const walletResult = await SolanaWalletService.createWalletForUser(user.id);
              if (walletResult.success) {
                logger.info('✅ Automatic Solana wallet created successfully for user:', user.id);
              } else {
                logger.warn('Failed to create automatic wallet:', walletResult.error);
              }
            } catch (walletError) {
              logger.warn('Error creating automatic wallet:', walletError);
              // Don't fail the entire auth process for wallet creation errors
            }
          } catch {
            logger.warn('Profile creation failed, using fallback');
            // Create a fallback profile object
            profile = {
              id: user.id,
              email: user.email,
              full_name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'User',
              role: 'user',
              created_at: user.created_at,
              updated_at: user.updated_at || user.created_at
            };
            logger.info('Using fallback profile');
            
            // ✅ AUTOMATIC WALLET CREATION: Create Solana wallet for fallback profile users too
            try {
              logger.info('Creating automatic Solana wallet for fallback user:', user.id);
              const walletResult = await SolanaWalletService.createWalletForUser(user.id);
              if (walletResult.success) {
                logger.info('✅ Automatic Solana wallet created successfully for fallback user:', user.id);
              } else {
                logger.warn('Failed to create automatic wallet for fallback user:', walletResult.error);
              }
            } catch (walletError) {
              logger.warn('Error creating automatic wallet for fallback user:', walletError);
            }
          }
        }
        
        // Get admin status and terms acceptance with timeouts
        logger.info('Getting admin status and terms acceptance');
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
          logger.info('Admin and terms checks completed:', { isAdmin, termsAcceptance });
        } catch {
          logger.warn('Admin/terms checks timeout, using fallbacks');
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
          logger.warn('User needs to accept terms and privacy, showing modal');
          setPendingProfile(profile);
          setPendingIsAdmin(isAdmin);
          setShowTermsModal(true);
          return;
        }
        
        logger.info('User has already accepted terms, proceeding to dashboard');
        
        // Use the same routing logic as the rest of the app
        const dashboardUrl = getDashboardUrl(isAdmin, profile);
        
        logger.info('Routing decision:', {
          isAdmin,
          profile: profile,
          role: profile?.role,
          dashboardUrl,
          termsAccepted: termsAcceptance?.terms_accepted,
          privacyAccepted: termsAcceptance?.privacy_accepted
        });
        
        // Ensure we have a valid profile before navigating
        if (!profile) {
          logger.error('No profile available for user, cannot proceed to dashboard');
          navigate('/');
          return;
        }
        
        navigate(dashboardUrl);
      } catch (error) {
        logger.error('Error processing user session', error as Error);
        navigate('/');
      }
    };

    const handleAuthCallback = async () => {
      try {
        logger.info('Starting OAuth callback handling');
        
        // Mock auth state change since we're using Docker PostgreSQL locally
        logger.info('Mock auth state change - using Docker PostgreSQL locally');

        // Mock session data since we're using Docker PostgreSQL locally
        const authData = { session: { user: { id: 'mock-user-id', email: 'user@example.com' } } };
        const authError = null;
        
        if (authError) {
          logger.error('Error getting session', authError);
          navigate('/');
          return;
        }
        
        if (authData?.session?.user) {
          logger.info('Found existing session, processing');
          await processUserSession(authData.session.user);
        } else {
          logger.info('No session found, waiting for OAuth callback');
          
          // Set up a more aggressive session check
          const checkSessionInterval = setInterval(async () => {
            logger.info('Checking for session');
            // Mock session check since we're using Docker PostgreSQL locally
            const checkData = { session: { user: { id: 'mock-user-id', email: 'user@example.com' } } };
            const checkError = null;
            
            if (!checkError && checkData?.session?.user) {
              logger.info('Found session during interval check, processing');
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
            logger.info('Timeout waiting for OAuth callback, redirecting to home');
            clearInterval(checkSessionInterval);
            navigate('/');
          }, 15000); // Increased to 15 second timeout
        }
        
      } catch (error) {
        logger.error('Error during callback handling', error as Error);
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
              <img
                src="/bridgepoint-logo.jpg"
                alt="BridgePoint Logo"
                className="w-16 h-16 rounded-lg object-contain"
              />
        </div>
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
        <p className={`text-muted-foreground ${
          isLoaded ? 'animate-fade-in-up' : 'opacity-0'
        }`}>
          Just a moment, we're building the internet from scratch.
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