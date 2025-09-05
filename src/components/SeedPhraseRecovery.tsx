import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Keypair } from "@solana/web3.js";
import * as bip39 from "bip39";
import { Key, Shield, AlertTriangle } from "lucide-react";

interface SeedPhraseRecoveryProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: any) => void;
}

const SeedPhraseRecovery: React.FC<SeedPhraseRecoveryProps> = ({ 
  isOpen, 
  onClose, 
  onSuccess 
}) => {
  const [seedPhrase, setSeedPhrase] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleRecovery = async () => {
    if (!seedPhrase.trim()) {
      toast({
        title: "Error",
        description: "Please enter your seed phrase",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Validate mnemonic
      if (!bip39.validateMnemonic(seedPhrase.trim())) {
        throw new Error("Invalid seed phrase format");
      }

      // Generate keypair from seed phrase
      const seed = await bip39.mnemonicToSeed(seedPhrase.trim());
      const keypair = Keypair.fromSeed(seed.slice(0, 32));
      const walletAddress = keypair.publicKey.toString();

      // Use the new validation function
      const { data: validationResult, error: validationError } = await supabase
        .rpc('validate_seed_phrase_recovery', {
          wallet_address: walletAddress,
          seed_phrase: seedPhrase.trim()
        });

      if (validationError || !validationResult || validationResult.length === 0) {
        throw new Error("Failed to validate seed phrase");
      }

      const validation = validationResult[0];
      
      if (!validation.is_valid) {
        if (validation.recovery_attempts >= validation.max_attempts) {
          throw new Error("Too many failed recovery attempts. Please contact support.");
        }
        throw new Error("Invalid seed phrase. Please check and try again.");
      }

      // Log successful recovery attempt
      await supabase.rpc('log_recovery_attempt', {
        p_user_id: validation.user_id,
        p_wallet_address: walletAddress,
        p_action: 'success'
      });

      // Create recovery session
      const { data: sessionData, error: sessionError } = await supabase.rpc('create_recovery_session', {
        p_user_id: validation.user_id,
        p_wallet_address: walletAddress
      });

      if (sessionError) {
        // Fallback: return user data for manual session creation
        onSuccess({ id: validation.user_id, email: validation.user_email });
        toast({
          title: "Recovery Successful",
          description: "Account recovered using seed phrase. Please sign in with your email to complete the process.",
        });
      } else {
        onSuccess({ id: validation.user_id, email: validation.user_email });
        toast({
          title: "Recovery Successful",
          description: "Account recovered using seed phrase",
        });
      }

      onClose();
    } catch (error: any) {
      console.error('Recovery error:', error);
      
      // Log failed recovery attempt if we have wallet address
      if (seedPhrase.trim()) {
        try {
          const seed = await bip39.mnemonicToSeed(seedPhrase.trim());
          const keypair = Keypair.fromSeed(seed.slice(0, 32));
          const walletAddress = keypair.publicKey.toString();
          
          await supabase.rpc('log_recovery_attempt', {
            p_user_id: null,
            p_wallet_address: walletAddress,
            p_action: 'failure'
          });
        } catch (logError) {
          console.error('Failed to log recovery attempt:', logError);
        }
      }
      
      toast({
        title: "Recovery Failed",
        description: error.message || "Failed to recover account. Please check your seed phrase.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Recover Account with Seed Phrase
          </DialogTitle>
          <DialogDescription>
            Enter your 12-word seed phrase to recover your account and bypass email authentication.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-amber-800 mb-1">Security Notice</p>
                <p className="text-amber-700">
                  This method allows you to recover your account even if your email is compromised. 
                  Only use this if you have your original seed phrase.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="recovery-seed-phrase">12-Word Seed Phrase</Label>
            <Textarea
              id="recovery-seed-phrase"
              value={seedPhrase}
              onChange={(e) => setSeedPhrase(e.target.value)}
              placeholder="Enter your 12-word seed phrase separated by spaces"
              rows={3}
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Enter the exact seed phrase you received when creating your wallet
            </p>
          </div>

          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={onClose}
              className="flex-1"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleRecovery}
              disabled={loading || !seedPhrase.trim()}
              className="flex-1"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Recovering...
                </>
              ) : (
                <>
                  <Key className="mr-2 h-4 w-4" />
                  Recover Account
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SeedPhraseRecovery;