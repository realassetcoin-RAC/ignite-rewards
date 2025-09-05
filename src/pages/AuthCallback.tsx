import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { getDashboardUrl } from "@/lib/dashboard-routing";
import { robustAdminCheck } from "@/utils/adminVerification";

/**
 * Auth callback page that handles role-based redirects after OAuth authentication
 * @returns {JSX.Element} The auth callback page component
 */
const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Get the current session
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          console.log('AuthCallback: Processing authentication for user:', session.user.email);
          
          // Get user profile and admin status in parallel
          const [profileResult, isAdmin] = await Promise.all([
            supabase
              .from('profiles')
              .select('id, email, full_name, role, created_at, updated_at')
              .eq('id', session.user.id)
              .single(),
            robustAdminCheck()
          ]);
          
          const profile = profileResult.data;
          
          // Use the same routing logic as the rest of the app
          const dashboardUrl = getDashboardUrl(isAdmin, profile);
          
          console.log('AuthCallback: Routing decision:', {
            isAdmin,
            profile: profile,
            role: profile?.role,
            dashboardUrl
          });
          
          navigate(dashboardUrl);
        } else {
          // No session, redirect to home
          console.log('AuthCallback: No session found, redirecting to home');
          navigate('/');
        }
      } catch (error) {
        console.error('Auth callback error:', error);
        navigate('/');
      }
    };

    handleAuthCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
        <p className="text-muted-foreground">Completing sign in...</p>
      </div>
    </div>
  );
};

export default AuthCallback;