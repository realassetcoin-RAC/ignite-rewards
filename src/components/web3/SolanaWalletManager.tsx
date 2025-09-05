import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useSecureAuth } from "@/hooks/useSecureAuth";
import { Wallet, Copy, Download, Upload, Key, Shield, ExternalLink } from "lucide-react";
import { Keypair, Connection, clusterApiUrl, PublicKey } from "@solana/web3.js";
import * as bip39 from "bip39";
import bs58 from "bs58";

interface UserWallet {
  id: string;
  solana_address: string;
  wallet_type: string;
  is_active: boolean;
  created_at: string;
}

const SolanaWalletManager = () => {
  const { user } = useSecureAuth();
  const { toast } = useToast();
  const [wallet, setWallet] = useState<UserWallet | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showSeedDialog, setShowSeedDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showViewSeedDialog, setShowViewSeedDialog] = useState(false);
  const [seedPhrase, setSeedPhrase] = useState("");
  const [importSeedPhrase, setImportSeedPhrase] = useState("");
  const [viewSeedPhrase, setViewSeedPhrase] = useState("");
  const [balance, setBalance] = useState<number | null>(null);

  useEffect(() => {
    if (user) {
      loadUserWallet();
    }
  }, [user]);

  useEffect(() => {
    if (wallet) {
      loadWalletBalance();
    }
  }, [wallet]);

  const loadUserWallet = async () => {
    try {
      const { data, error } = await supabase
        .from('user_wallets')
        .select('*')
        .eq('user_id', user?.id)
        .eq('is_active', true)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading wallet:', error);
        return;
      }

      setWallet(data);
    } catch (error) {
      console.error('Error loading wallet:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadWalletBalance = async () => {
    if (!wallet) return;

    try {
      const connection = new Connection(clusterApiUrl('devnet'));
      const targetPublicKey = new PublicKey(wallet.solana_address);
      const walletBalance = await connection.getBalance(targetPublicKey);
      setBalance(walletBalance / 1e9); // Convert lamports to SOL
    } catch (error) {
      console.error('Error loading wallet balance:', error);
      setBalance(0);
    }
  };

  const generateWallet = async () => {
    setCreating(true);
    try {
      // Generate mnemonic and keypair
      const mnemonic = bip39.generateMnemonic();
      const seed = await bip39.mnemonicToSeed(mnemonic);
      const keypair = Keypair.fromSeed(seed.slice(0, 32));
      
      // Simple encryption (in production, use proper encryption)
      const encryptedSeed = btoa(mnemonic); // Base64 encoding as basic encryption
      
      const { data, error } = await supabase
        .from('user_wallets')
        .insert({
          user_id: user?.id,
          solana_address: keypair.publicKey.toString(),
          encrypted_seed_phrase: encryptedSeed,
          wallet_type: 'generated',
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;

      setWallet(data);
      setSeedPhrase(mnemonic);
      setShowSeedDialog(true);

      toast({
        title: "Wallet Created",
        description: "Your Solana wallet has been generated successfully!",
      });
    } catch (error) {
      console.error('Error creating wallet:', error);
      toast({
        title: "Error",
        description: "Failed to create wallet. Please try again.",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };


  const importWallet = async () => {
    if (!importSeedPhrase.trim()) {
      toast({
        title: "Error",
        description: "Please enter a valid seed phrase",
        variant: "destructive",
      });
      return;
    }

    try {
      // Validate mnemonic
      if (!bip39.validateMnemonic(importSeedPhrase.trim())) {
        throw new Error("Invalid seed phrase");
      }

      const seed = await bip39.mnemonicToSeed(importSeedPhrase.trim());
      const keypair = Keypair.fromSeed(seed.slice(0, 32));
      
      // Simple encryption
      const encryptedSeed = btoa(importSeedPhrase.trim());
      
      const { data, error } = await supabase
        .from('user_wallets')
        .insert({
          user_id: user?.id,
          solana_address: keypair.publicKey.toString(),
          encrypted_seed_phrase: encryptedSeed,
          wallet_type: 'imported',
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;

      setWallet(data);
      setImportSeedPhrase("");
      setShowImportDialog(false);

      toast({
        title: "Wallet Imported",
        description: "Your Solana wallet has been imported successfully!",
      });
    } catch (error) {
      console.error('Error importing wallet:', error);
      toast({
        title: "Error",
        description: "Failed to import wallet. Please check your seed phrase.",
        variant: "destructive",
      });
    }
  };

  const copyAddress = () => {
    if (wallet?.solana_address) {
      navigator.clipboard.writeText(wallet.solana_address);
      toast({
        title: "Copied",
        description: "Wallet address copied to clipboard",
      });
    }
  };

  const downloadSeedPhrase = () => {
    const phraseToDownload = seedPhrase || viewSeedPhrase;
    if (phraseToDownload) {
      const element = document.createElement("a");
      const file = new Blob([phraseToDownload], { type: "text/plain" });
      element.href = URL.createObjectURL(file);
      element.download = "solana-wallet-seed-phrase.txt";
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
      
      toast({
        title: "Downloaded",
        description: "Seed phrase saved to your device",
      });
    }
  };

  const viewExistingSeedPhrase = async () => {
    if (!wallet) return;
    
    try {
      // Decrypt the stored seed phrase
      const decryptedSeed = atob(wallet.encrypted_seed_phrase);
      setViewSeedPhrase(decryptedSeed);
      setShowViewSeedDialog(true);
    } catch (error) {
      console.error('Error decrypting seed phrase:', error);
      toast({
        title: "Error",
        description: "Failed to decrypt seed phrase",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!wallet) {
    return (
      <div className="space-y-4">
        <div className="text-center space-y-2">
          <p className="text-muted-foreground">No wallet found. Create or import a Solana wallet to get started.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button onClick={generateWallet} disabled={creating} className="flex-1">
            <Key className="mr-2 h-4 w-4" />
            {creating ? "Creating..." : "Generate New Wallet"}
          </Button>
          <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" className="flex-1">
                <Upload className="mr-2 h-4 w-4" />
                Import Wallet
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Import Solana Wallet</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="seed-phrase">12-Word Seed Phrase</Label>
                  <Textarea
                    id="seed-phrase"
                    value={importSeedPhrase}
                    onChange={(e) => setImportSeedPhrase(e.target.value)}
                    placeholder="Enter your 12-word seed phrase separated by spaces"
                    rows={3}
                  />
                </div>
                <Button onClick={importWallet} className="w-full">
                  Import Wallet
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Seed Phrase Backup Dialog */}
        <Dialog open={showSeedDialog} onOpenChange={setShowSeedDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Backup Your Seed Phrase
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                <p className="text-sm font-medium text-destructive mb-2">⚠️ Important Security Notice</p>
                <p className="text-sm text-muted-foreground">
                  This seed phrase is the only way to recover your wallet. Store it securely and never share it with anyone.
                </p>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <p className="font-mono text-sm break-all">{seedPhrase}</p>
              </div>
              <div className="flex gap-2">
                <Button onClick={downloadSeedPhrase} variant="outline" className="flex-1">
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>
                <Button 
                  onClick={() => {
                    navigator.clipboard.writeText(seedPhrase);
                    toast({ title: "Copied", description: "Seed phrase copied to clipboard" });
                  }}
                  variant="outline" 
                  className="flex-1"
                >
                  <Copy className="mr-2 h-4 w-4" />
                  Copy
                </Button>
              </div>
              <Button onClick={() => setShowSeedDialog(false)} className="w-full">
                I've Saved My Seed Phrase
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* View Existing Seed Phrase Dialog */}
        <Dialog open={showViewSeedDialog} onOpenChange={setShowViewSeedDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Your Seed Phrase
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                <p className="text-sm font-medium text-destructive mb-2">⚠️ Security Warning</p>
                <p className="text-sm text-muted-foreground">
                  This seed phrase can be used to recover your account if your email is compromised. 
                  Store it securely and never share it with anyone.
                </p>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <p className="font-mono text-sm break-all">{viewSeedPhrase}</p>
              </div>
              <div className="flex gap-2">
                <Button onClick={downloadSeedPhrase} variant="outline" className="flex-1">
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>
                <Button 
                  onClick={() => {
                    navigator.clipboard.writeText(viewSeedPhrase);
                    toast({ title: "Copied", description: "Seed phrase copied to clipboard" });
                  }}
                  variant="outline" 
                  className="flex-1"
                >
                  <Copy className="mr-2 h-4 w-4" />
                  Copy
                </Button>
              </div>
              <Button onClick={() => setShowViewSeedDialog(false)} className="w-full">
                I've Secured My Seed Phrase
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant={wallet.is_active ? "default" : "secondary"}>
            {wallet.wallet_type === 'generated' ? 'Generated' : 'Imported'}
          </Badge>
          <Badge variant="outline">
            {wallet.is_active ? 'Active' : 'Inactive'}
          </Badge>
        </div>
        {balance !== null && (
          <div className="text-sm text-muted-foreground">
            Balance: {balance.toFixed(4)} SOL
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label className="text-sm text-muted-foreground">Wallet Address</Label>
        <div className="flex items-center gap-2">
          <code className="flex-1 text-xs font-mono bg-muted px-2 py-1 rounded break-all">
            {wallet.solana_address}
          </code>
          <Button size="sm" variant="outline" onClick={copyAddress}>
            <Copy className="h-4 w-4" />
          </Button>
          <Button 
            size="sm" 
            variant="outline" 
            asChild
          >
            <a 
              href={`https://explorer.solana.com/address/${wallet.solana_address}?cluster=devnet`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-sm text-muted-foreground">Recovery Options</Label>
        <div className="flex gap-2">
          <Button 
            size="sm" 
            variant="outline" 
            onClick={viewExistingSeedPhrase}
            className="flex-1"
          >
            <Key className="mr-2 h-4 w-4" />
            View Seed Phrase
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Your seed phrase allows you to recover your account even if your email is compromised.
        </p>
      </div>

      <div className="text-xs text-muted-foreground">
        Created: {new Date(wallet.created_at).toLocaleDateString()}
      </div>
    </div>
  );
};

export default SolanaWalletManager;