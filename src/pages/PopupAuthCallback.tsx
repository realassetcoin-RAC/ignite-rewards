import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Popup callback page that handles OAuth authentication in popup windows
 * This page should be minimal and only handle the OAuth completion
 */
const PopupAuthCallback = () => {
  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log('Popup auth callback started');
        
        // Use the shared Supabase client

        // Wait a bit for the OAuth callback to complete
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Handle the OAuth callback
        const { data, error } = await supabase.auth.getSession();
        
        console.log('Popup auth session check:', { data, error });
        
        if (error) {
          console.error('OAuth callback error:', error);
          // Notify parent window of error
          if (window.opener) {
            window.opener.postMessage({ 
              type: 'OAUTH_ERROR', 
              error: error.message 
            }, window.location.origin);
          }
        } else if (data.session) {
          // Authentication successful
          console.log('OAuth callback successful, user:', data.session.user.email);
          // Notify parent window of success
          if (window.opener) {
            window.opener.postMessage({ 
              type: 'OAUTH_SUCCESS', 
              session: data.session 
            }, window.location.origin);
          }
        } else {
          console.warn('No session found in popup callback');
          // Notify parent window of error
          if (window.opener) {
            window.opener.postMessage({ 
              type: 'OAUTH_ERROR', 
              error: 'No session found' 
            }, window.location.origin);
          }
        }

        // Close the popup window after a short delay
        setTimeout(() => {
          window.close();
        }, 500);
      } catch (error) {
        console.error('Popup auth callback error:', error);
        // Notify parent window of error
        if (window.opener) {
          window.opener.postMessage({ 
            type: 'OAUTH_ERROR', 
            error: 'Authentication failed' 
          }, window.location.origin);
        }
        setTimeout(() => {
          window.close();
        }, 500);
      }
    };

    handleAuthCallback();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Completing authentication...</p>
      </div>
    </div>
  );
};

export default PopupAuthCallback;
