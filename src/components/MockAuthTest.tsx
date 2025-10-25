import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { DirectAuthService } from '@/lib/directAuthService';
import { DirectGoogleOAuth } from '@/lib/directGoogleOAuth';

const MockAuthTest: React.FC = () => {
  const { toast } = useToast();
  const [isVisible, setIsVisible] = useState(false);

  const testMockAuth = async () => {
    try {
      console.log('🧪 Testing mock authentication...');
      
      // Create a mock Google user
      const mockUser = {
        id: 'test_user_' + Date.now(),
        email: 'test@example.com',
        name: 'Test User',
        picture: 'https://via.placeholder.com/150',
        verified_email: true
      };

      // Create session object
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
        access_token: 'mock_token_' + Date.now(),
        expires_at: Date.now() + (3600 * 1000) // 1 hour
      };

      // Save to localStorage
      localStorage.setItem('google_user', JSON.stringify(mockUser));
      localStorage.setItem('google_access_token', session.access_token);
      localStorage.setItem('auth_session', JSON.stringify(session));
      localStorage.setItem('auth_user', JSON.stringify(session.user));

      // Trigger storage event
      window.dispatchEvent(new Event('storage'));

      // Dispatch custom event for auth state change
      window.dispatchEvent(new CustomEvent('auth-state-change', {
        detail: { event: 'SIGNED_IN', session }
      }));

      console.log('✅ Mock authentication completed');
      toast({
        title: "Mock Authentication Successful!",
        description: "Test user signed in successfully.",
      });

    } catch (error) {
      console.error('❌ Mock authentication failed:', error);
      toast({
        title: "Mock Authentication Failed",
        description: "Failed to create test session.",
        variant: "destructive",
      });
    }
  };

  const clearAuth = () => {
    try {
      console.log('🧹 Clearing authentication...');
      
      // Clear localStorage
      localStorage.removeItem('google_user');
      localStorage.removeItem('google_access_token');
      localStorage.removeItem('auth_session');
      localStorage.removeItem('auth_user');

      // Trigger storage event
      window.dispatchEvent(new Event('storage'));

      // Dispatch custom event for auth state change
      window.dispatchEvent(new CustomEvent('auth-state-change', {
        detail: { event: 'SIGNED_OUT', session: null }
      }));

      console.log('✅ Authentication cleared');
      toast({
        title: "Authentication Cleared",
        description: "All auth data has been removed.",
      });

    } catch (error) {
      console.error('❌ Failed to clear authentication:', error);
      toast({
        title: "Clear Failed",
        description: "Failed to clear authentication data.",
        variant: "destructive",
      });
    }
  };

  const checkAuthState = () => {
    try {
      const authSession = localStorage.getItem('auth_session');
      const authUser = localStorage.getItem('auth_user');
      const googleUser = localStorage.getItem('google_user');
      const googleToken = localStorage.getItem('google_access_token');

      console.log('🔍 Current auth state:');
      console.log('- Auth Session:', authSession ? '✅ Exists' : '❌ Missing');
      console.log('- Auth User:', authUser ? '✅ Exists' : '❌ Missing');
      console.log('- Google User:', googleUser ? '✅ Exists' : '❌ Missing');
      console.log('- Google Token:', googleToken ? '✅ Exists' : '❌ Missing');

      if (authSession && authUser) {
        const sessionData = JSON.parse(authSession);
        const userData = JSON.parse(authUser);
        console.log('- Session User Email:', userData.email);
        console.log('- Session Expires:', new Date(sessionData.expires_at).toLocaleString());
        
        // Force refresh the Auth Debug Panel
        window.dispatchEvent(new CustomEvent('auth-state-change', {
          detail: { event: 'SIGNED_IN', session: sessionData }
        }));
      }

      toast({
        title: "Auth State Checked",
        description: authSession ? "✅ User is signed in!" : "❌ No active session found.",
      });

    } catch (error) {
      console.error('❌ Failed to check auth state:', error);
      toast({
        title: "Check Failed",
        description: "Failed to check authentication state.",
        variant: "destructive",
      });
    }
  };

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 left-4 bg-green-500 text-white px-3 py-1 rounded text-xs z-50"
      >
        Mock Auth Test
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 left-4 bg-white border border-gray-300 rounded-lg p-4 shadow-lg max-w-sm z-50">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-bold text-sm">Mock Auth Test</h3>
        <button
          onClick={() => setIsVisible(false)}
          className="text-gray-500 hover:text-gray-700"
        >
          ×
        </button>
      </div>
      
      <div className="space-y-2">
        <Button
          onClick={testMockAuth}
          className="w-full text-xs"
          size="sm"
        >
          Test Mock Login
        </Button>
        
        <Button
          onClick={checkAuthState}
          className="w-full text-xs"
          size="sm"
          variant="outline"
        >
          Check Auth State
        </Button>
        
        <Button
          onClick={clearAuth}
          className="w-full text-xs"
          size="sm"
          variant="destructive"
        >
          Clear Auth
        </Button>
      </div>
    </div>
  );
};

export default MockAuthTest;
