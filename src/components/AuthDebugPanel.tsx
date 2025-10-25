import React, { useState, useEffect } from 'react';
import { databaseAdapter } from '@/lib/databaseAdapter';
import { DirectGoogleOAuth } from '@/lib/directGoogleOAuth';
import { DirectAuthService } from '@/lib/directAuthService';

const AuthDebugPanel: React.FC = () => {
  const [authState, setAuthState] = useState<any>(null);
  const [localStorageData, setLocalStorageData] = useState<any>({});
  const [isVisible, setIsVisible] = useState(false);

  const refreshAuthState = async () => {
    try {
      // Get session from database adapter
      const { data: { session }, error } = await databaseAdapter.supabase.auth.getSession();
      
      // Get current user from DirectAuthService
      const currentUser = DirectAuthService.getCurrentUser();
      
      // Get Google user
      const googleUser = DirectGoogleOAuth.getCurrentUser();
      
      // Get localStorage data
      const authSession = localStorage.getItem('auth_session');
      const authUser = localStorage.getItem('auth_user');
      const googleUserStorage = localStorage.getItem('google_user');
      const googleToken = localStorage.getItem('google_access_token');

      setAuthState({
        session: session ? { ...session, user: session.user ? 'User exists' : 'No user' } : null,
        error,
        currentUser,
        googleUser,
        timestamp: new Date().toISOString()
      });

      setLocalStorageData({
        authSession: authSession ? JSON.parse(authSession) : null,
        authUser: authUser ? JSON.parse(authUser) : null,
        googleUser: googleUserStorage ? JSON.parse(googleUserStorage) : null,
        googleToken: googleToken ? 'Token exists' : null
      });
    } catch (error) {
      console.error('Error refreshing auth state:', error);
    }
  };

  useEffect(() => {
    refreshAuthState();
    
    // Listen for auth state changes
    const handleAuthChange = () => {
      refreshAuthState();
    };

    window.addEventListener('auth-state-change', handleAuthChange);
    window.addEventListener('storage', handleAuthChange);

    return () => {
      window.removeEventListener('auth-state-change', handleAuthChange);
      window.removeEventListener('storage', handleAuthChange);
    };
  }, []);

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 bg-blue-500 text-white px-3 py-1 rounded text-xs z-50"
      >
        Auth Debug
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white border border-gray-300 rounded-lg p-4 shadow-lg max-w-md z-50">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-bold text-sm">Auth Debug Panel</h3>
        <button
          onClick={() => setIsVisible(false)}
          className="text-gray-500 hover:text-gray-700"
        >
          ×
        </button>
      </div>
      
      <div className="space-y-2 text-xs">
        <div>
          <strong>Session:</strong> {authState?.session ? '✅ Active' : '❌ None'}
        </div>
        <div>
          <strong>Current User:</strong> {authState?.currentUser ? '✅ ' + authState.currentUser.email : '❌ None'}
        </div>
        <div>
          <strong>Google User:</strong> {authState?.googleUser ? '✅ ' + authState.googleUser.email : '❌ None'}
        </div>
        <div>
          <strong>Auth Session:</strong> {localStorageData?.authSession ? '✅ Stored' : '❌ None'}
        </div>
        <div>
          <strong>Google Token:</strong> {localStorageData?.googleToken ? '✅ Stored' : '❌ None'}
        </div>
        <div>
          <strong>Last Updated:</strong> {authState?.timestamp}
        </div>
      </div>
      
      <button
        onClick={refreshAuthState}
        className="mt-2 bg-blue-500 text-white px-2 py-1 rounded text-xs"
      >
        Refresh
      </button>
    </div>
  );
};

export default AuthDebugPanel;

