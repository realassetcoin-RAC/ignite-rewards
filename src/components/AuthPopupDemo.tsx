import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import LoginPopup from '@/components/LoginPopup';
import SignupPopup from '@/components/SignupPopup';
import { LogIn, UserPlus } from 'lucide-react';

/**
 * Demo component to showcase the Login and Signup popup modals
 * This component can be used for testing or as a reference for implementation
 */
export const AuthPopupDemo: React.FC = () => {
  const [showLogin, setShowLogin] = useState(false);
  const [showSignup, setShowSignup] = useState(false);

  const handleSwitchToSignup = () => {
    setShowLogin(false);
    setShowSignup(true);
  };

  const handleSwitchToLogin = () => {
    setShowSignup(false);
    setShowLogin(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            RAC Rewards Authentication
          </h1>
          <p className="text-gray-600">
            Login and Signup Popup Components Demo
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LogIn className="h-5 w-5" />
                Login Popup
              </CardTitle>
              <CardDescription>
                Sign in to your existing RAC Rewards account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Features:
                </p>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Email and password authentication</li>
                  <li>• Google OAuth integration</li>
                  <li>• Password visibility toggle</li>
                  <li>• Form validation</li>
                  <li>• Loading states</li>
                  <li>• Switch to signup option</li>
                </ul>
                <Button 
                  onClick={() => setShowLogin(true)}
                  className="w-full"
                >
                  Open Login Popup
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                Signup Popup
              </CardTitle>
              <CardDescription>
                Create a new RAC Rewards account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Features:
                </p>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Complete registration form</li>
                  <li>• Google OAuth integration</li>
                  <li>• Password confirmation</li>
                  <li>• Terms and privacy acceptance</li>
                  <li>• Form validation</li>
                  <li>• Switch to login option</li>
                </ul>
                <Button 
                  onClick={() => setShowSignup(true)}
                  className="w-full"
                  variant="outline"
                >
                  Open Signup Popup
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 p-6 bg-white rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold mb-3">Implementation Notes</h3>
          <div className="text-sm text-gray-600 space-y-2">
            <p>
              <strong>Components Created:</strong>
            </p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li><code>src/components/logo.tsx</code> - LogoIcon component</li>
              <li><code>src/components/LoginPopup.tsx</code> - Login modal popup</li>
              <li><code>src/components/SignupPopup.tsx</code> - Signup modal popup</li>
              <li><code>src/components/AuthPopupDemo.tsx</code> - Demo component</li>
            </ul>
            <p className="mt-4">
              <strong>Integration:</strong> Both popups integrate with the existing 
              <code> useSecureAuth</code> hook and <code>GoogleOAuthButton</code> component.
            </p>
          </div>
        </div>
      </div>

      {/* Popup Modals */}
      <LoginPopup
        isOpen={showLogin}
        onClose={() => setShowLogin(false)}
        onSwitchToSignup={handleSwitchToSignup}
      />

      <SignupPopup
        isOpen={showSignup}
        onClose={() => setShowSignup(false)}
        onSwitchToLogin={handleSwitchToLogin}
      />
    </div>
  );
};

export default AuthPopupDemo;
