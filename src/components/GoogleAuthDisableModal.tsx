import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { AlertTriangle, Shield, Key } from 'lucide-react';

interface GoogleAuthDisableModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const GoogleAuthDisableModal: React.FC<GoogleAuthDisableModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [seedPhrase, setSeedPhrase] = useState('');
  const [confirmSeedPhrase, setConfirmSeedPhrase] = useState('');
  const [understoodRisks, setUnderstoodRisks] = useState(false);
  const [confirmedDisable, setConfirmedDisable] = useState(false);

  const handleDisableGoogleAuth = async () => {
    if (!seedPhrase.trim()) {
      toast({
        title: "Seed Phrase Required",
        description: "Please enter your seed phrase to disable Google authentication.",
        variant: "destructive"
      });
      return;
    }

    if (seedPhrase !== confirmSeedPhrase) {
      toast({
        title: "Seed Phrases Don't Match",
        description: "Please ensure both seed phrase entries are identical.",
        variant: "destructive"
      });
      return;
    }

    if (!understoodRisks || !confirmedDisable) {
      toast({
        title: "Confirmation Required",
        description: "Please confirm you understand the risks and want to disable Google authentication.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      // Verify seed phrase matches user's wallet
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Get user's wallet to verify seed phrase
      const { data: wallet, error: walletError } = await supabase
        .from('user_wallets')
        .select('seed_phrase')
        .eq('user_id', user.id)
        .eq('wallet_type', 'custodial')
        .single();

      if (walletError || !wallet) {
        throw new Error('Wallet not found');
      }

      // Verify seed phrase (in production, this should be properly encrypted/decrypted)
      if (wallet.seed_phrase !== seedPhrase.trim()) {
        throw new Error('Invalid seed phrase');
      }

      // Update user profile to disable Google authentication
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          google_auth_disabled: true,
          google_auth_disabled_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (updateError) {
        throw updateError;
      }

      // Remove Google identity (this would require admin privileges in production)
      // For now, we'll just mark it as disabled in the profile
      
      toast({
        title: "Google Authentication Disabled",
        description: "You can now only log in using your seed phrase. Please save your seed phrase securely.",
        variant: "default"
      });

      onSuccess();
      onClose();

    } catch (error) {
      console.error('Error disabling Google auth:', error);
      toast({
        title: "Failed to Disable Google Auth",
        description: error instanceof Error ? error.message : "An unexpected error occurred.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReenableGoogleAuth = async () => {
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          google_auth_disabled: false,
          google_auth_disabled_at: null
        })
        .eq('id', user.id);

      if (updateError) {
        throw updateError;
      }

      toast({
        title: "Google Authentication Re-enabled",
        description: "You can now log in using both Google and seed phrase authentication.",
        variant: "default"
      });

      onSuccess();
      onClose();

    } catch (error) {
      console.error('Error re-enabling Google auth:', error);
      toast({
        title: "Failed to Re-enable Google Auth",
        description: error instanceof Error ? error.message : "An unexpected error occurred.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Google Authentication Management
          </CardTitle>
          <CardDescription>
            Manage your authentication methods for enhanced security
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Important:</strong> Disabling Google authentication means you can only log in using your seed phrase. 
              Make sure you have securely backed up your seed phrase before proceeding.
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <div>
              <Label htmlFor="seed-phrase">Enter Your Seed Phrase</Label>
              <Input
                id="seed-phrase"
                type="password"
                placeholder="Enter your 12-word seed phrase"
                value={seedPhrase}
                onChange={(e) => setSeedPhrase(e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="confirm-seed-phrase">Confirm Seed Phrase</Label>
              <Input
                id="confirm-seed-phrase"
                type="password"
                placeholder="Re-enter your seed phrase"
                value={confirmSeedPhrase}
                onChange={(e) => setConfirmSeedPhrase(e.target.value)}
                className="mt-1"
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-start space-x-2">
                <Checkbox
                  id="understood-risks"
                  checked={understoodRisks}
                  onCheckedChange={setUnderstoodRisks}
                />
                <Label htmlFor="understood-risks" className="text-sm">
                  I understand that disabling Google authentication means I can only log in using my seed phrase
                </Label>
              </div>

              <div className="flex items-start space-x-2">
                <Checkbox
                  id="confirmed-disable"
                  checked={confirmedDisable}
                  onCheckedChange={setConfirmedDisable}
                />
                <Label htmlFor="confirmed-disable" className="text-sm">
                  I have securely backed up my seed phrase and want to disable Google authentication
                </Label>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              onClick={handleDisableGoogleAuth}
              disabled={loading || !understoodRisks || !confirmedDisable}
              variant="destructive"
              className="flex-1"
            >
              <Key className="h-4 w-4 mr-2" />
              {loading ? "Disabling..." : "Disable Google Authentication"}
            </Button>
            
            <Button
              onClick={handleReenableGoogleAuth}
              disabled={loading}
              variant="outline"
              className="flex-1"
            >
              {loading ? "Re-enabling..." : "Re-enable Google Authentication"}
            </Button>
          </div>

          <div className="flex justify-end">
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
