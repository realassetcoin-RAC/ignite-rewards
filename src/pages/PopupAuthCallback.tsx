import { useEffect } from "react";
import { databaseAdapter } from "@/lib/databaseAdapter";

/**
 * Popup callback page that handles OAuth authentication in popup windows
 * This page should be minimal and only handle the OAuth completion
 */
const PopupAuthCallback = () => {
  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log('Local popup auth callback started');
        
        // Wait a bit for the OAuth callback to complete
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Handle the OAuth callback using local auth
        const { data, error } = await databaseAdapter.supabase.getUser();
        
        console.log('Local popup auth session check:', { data, error });
        
        if (error) {
          console.error('Local OAuth callback error:', error);
          // Notify parent window of error
          if (window.opener) {
            window.opener.postMessage({ 
              type: 'OAUTH_ERROR', 
              error: error.message 
            }, window.location.origin);
          }
        } else if (data?.user) {
          // Authentication successful
          console.log('Local OAuth callback successful, user:', data.user.email);
          // Notify parent window of success
          if (window.opener) {
            window.opener.postMessage({ 
              type: 'OAUTH_SUCCESS', 
              session: { user: data.user } 
            }, window.location.origin);
          }
        } else {
          console.warn('No user found in local popup callback');
          // Notify parent window of error
          if (window.opener) {
            window.opener.postMessage({ 
              type: 'OAUTH_ERROR', 
              error: 'No user found' 
            }, window.location.origin);
          }
        }

        // Close the popup window after a short delay
        setTimeout(() => {
          window.close();
        }, 500);
      } catch (error) {
        console.error('Local popup auth callback error:', error);
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
