import { useState, useEffect } from 'react';
import { useSecureAuth } from './useSecureAuth';
import { TermsPrivacyService } from '@/lib/termsPrivacyService';

export const useTermsPrivacy = () => {
  const { user } = useSecureAuth();
  const [hasAcceptedTerms, setHasAcceptedTerms] = useState(false);
  const [hasAcceptedPrivacy, setHasAcceptedPrivacy] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [needsAcceptance, setNeedsAcceptance] = useState(false);

  useEffect(() => {
    const checkAcceptance = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        const acceptance = await TermsPrivacyService.getUserAcceptance(user.id);
        if (acceptance) {
          setHasAcceptedTerms(acceptance.terms_accepted);
          setHasAcceptedPrivacy(acceptance.privacy_accepted);
          setNeedsAcceptance(!acceptance.terms_accepted || !acceptance.privacy_accepted);
        } else {
          setNeedsAcceptance(true);
        }
      } catch {
        // Console statement removed
        setNeedsAcceptance(true);
      } finally {
        setIsLoading(false);
      }
    };

    checkAcceptance();
  }, [user]);

  const saveAcceptance = async (termsAccepted: boolean, privacyAccepted: boolean) => {
    if (!user) return false;

    try {
      await TermsPrivacyService.saveUserAcceptance(
        user.id,
        termsAccepted,
        privacyAccepted
      );
      
      setHasAcceptedTerms(termsAccepted);
      setHasAcceptedPrivacy(privacyAccepted);
      setNeedsAcceptance(!termsAccepted || !privacyAccepted);
      
      return true;
    } catch {
      // Console statement removed
      return false;
    }
  };

  return {
    hasAcceptedTerms,
    hasAcceptedPrivacy,
    needsAcceptance,
    isLoading,
    saveAcceptance
  };
};

