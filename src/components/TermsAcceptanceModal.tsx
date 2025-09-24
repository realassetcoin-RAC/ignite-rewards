import React, { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { TermsPrivacyService } from "@/lib/termsPrivacyService";
import { useSecureAuth } from "@/hooks/useSecureAuth";
// import { useNavigate } from "react-router-dom";

interface TermsAcceptanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept: () => void;
}

const TermsAcceptanceModal: React.FC<TermsAcceptanceModalProps> = ({ 
  isOpen, 
  onClose, 
  onAccept 
}) => {
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user, signOut } = useSecureAuth();
  // const _navigate = useNavigate();

  const handleAccept = async () => {
    if (!acceptedTerms || !acceptedPrivacy) {
      toast({
        title: "Acceptance Required",
        description: "Please accept both the Terms of Service and Privacy Policy to continue.",
        variant: "destructive"
      });
      return;
    }

    if (!user) {
      toast({
        title: "Authentication Error",
        description: "User not found. Please try signing in again.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      await TermsPrivacyService.saveUserAcceptance(
        user.id,
        acceptedTerms,
        acceptedPrivacy
      );

      toast({
        title: "Terms Accepted",
        description: "Thank you for accepting our Terms of Service and Privacy Policy.",
      });

      onAccept();
    } catch (error) {
      console.error('Error saving terms acceptance:', error);
      toast({
        title: "Error",
        description: "Failed to save your acceptance. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDecline = async () => {
    toast({
      title: "Terms Declined",
      description: "You must accept our Terms of Service and Privacy Policy to use this service.",
      variant: "destructive"
    });

    // Sign out the user
    try {
      await signOut();
      onClose();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Terms of Service & Privacy Policy</DialogTitle>
          <DialogDescription>
            To continue using our service, please review and accept our Terms of Service and Privacy Policy.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-start space-x-2">
              <Checkbox 
                id="terms-acceptance" 
                checked={acceptedTerms}
                onCheckedChange={(checked) => setAcceptedTerms(checked as boolean)}
                required
              />
              <label 
                htmlFor="terms-acceptance" 
                className="text-sm text-muted-foreground leading-relaxed cursor-pointer"
              >
                I agree to the{' '}
                <a href="/terms" target="_blank" className="text-primary hover:underline">
                  Terms of Service
                </a>
              </label>
            </div>
            
            <div className="flex items-start space-x-2">
              <Checkbox 
                id="privacy-acceptance" 
                checked={acceptedPrivacy}
                onCheckedChange={(checked) => setAcceptedPrivacy(checked as boolean)}
                required
              />
              <label 
                htmlFor="privacy-acceptance" 
                className="text-sm text-muted-foreground leading-relaxed cursor-pointer"
              >
                I agree to the{' '}
                <a href="/privacy" target="_blank" className="text-primary hover:underline">
                  Privacy Policy
                </a>
              </label>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button 
              type="button"
              variant="outline"
              onClick={handleDecline}
              className="flex-1"
              disabled={loading}
            >
              Decline & Sign Out
            </Button>
            <Button 
              type="button"
              onClick={handleAccept}
              className="flex-1"
              disabled={loading || !acceptedTerms || !acceptedPrivacy}
            >
              {loading ? "Accepting..." : "Accept & Continue"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TermsAcceptanceModal;
