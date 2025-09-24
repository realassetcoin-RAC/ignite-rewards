import React, { useState, useEffect } from "react";
import { useSecureAuth } from "@/hooks/useSecureAuth";
import EmailVerificationModal from "./EmailVerificationModal";

interface EmailVerificationGuardProps {
  children: React.ReactNode;
  userRole?: string;
}

const EmailVerificationGuard: React.FC<EmailVerificationGuardProps> = ({ 
  children, 
  userRole = "user" 
}) => {
  const { user, needsEmailVerification, isEmailVerified, loading } = useSecureAuth();
  const [showVerificationModal, setShowVerificationModal] = useState(false);

  useEffect(() => {
    // Only show verification modal if:
    // 1. User is authenticated
    // 2. Not loading
    // 3. Needs email verification
    // 4. Not already verified
    if (user && !loading && needsEmailVerification && !isEmailVerified) {
      setShowVerificationModal(true);
    } else {
      setShowVerificationModal(false);
    }
  }, [user, loading, needsEmailVerification, isEmailVerified]);

  // If user needs email verification, show the modal
  if (showVerificationModal) {
    return (
      <>
        <EmailVerificationModal
          isOpen={showVerificationModal}
          onClose={() => setShowVerificationModal(false)}
          userEmail={user?.email}
          userRole={userRole}
        />
        {/* Show a restricted view while verification is pending */}
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center space-y-4 p-8">
            <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold">Email Verification Required</h2>
            <p className="text-muted-foreground max-w-md">
              Please verify your email address to access all features. Check your inbox for a verification email.
            </p>
            <button
              onClick={() => setShowVerificationModal(true)}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              Open Verification Panel
            </button>
          </div>
        </div>
      </>
    );
  }

  // If user is verified or doesn't need verification, show the children
  return <>{children}</>;
};

export default EmailVerificationGuard;
