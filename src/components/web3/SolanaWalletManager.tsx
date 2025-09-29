import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useSecureAuth } from "@/hooks/useSecureAuth";
import { Copy, Download, Upload, Key, Shield, ExternalLink } from "lucide-react";
import { Keypair, Connection, clusterApiUrl, PublicKey } from "@solana/web3.js";
import { useWallet } from "@solana/wallet-adapter-react";
import * as bip39 from "bip39";

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
  const [seedPhrase, setSeedPhrase] = useState("");
  const [importSeedPhrase, setImportSeedPhrase] = useState("");
  const [balance, setBalance] = useState<number | null>(null);
  const { connected, publicKey, connect, disconnect } = useWallet();

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
        .from('user_solana_wallets')
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
      const targetPublicKey: PublicKey = publicKey ?? new Keypair().publicKey;
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
        .from('user_solana_wallets')
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

  const connectThirdPartyWallet = async () => {
    try {
      await connect();
      if (publicKey) {
        toast({ title: "Wallet Connected", description: `Connected: ${publicKey.toBase58().slice(0,6)}...` });
      }
    } catch (error) {
      console.error('Error connecting wallet:', error);
      toast({ title: "Error", description: "Failed to connect wallet", variant: "destructive" });
    }
  };

  const disconnectThirdPartyWallet = async () => {
    try {
      await disconnect();
      toast({ title: "Wallet Disconnected" });
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
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
        .from('user_solana_wallets')
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
    if (seedPhrase) {
      const element = document.createElement("a");
      const file = new Blob([seedPhrase], { type: "text/plain" });
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
          <Button onClick={generateWallet} disabled={creating} className="flex-1 bg-gradient-to-r from-primary to-purple-500 hover:from-primary/90 hover:to-purple-500/90 transform hover:scale-105 transition-all duration-300">
            <Key className="mr-2 h-4 w-4" />
            {creating ? "Creating..." : "Generate New Wallet"}
          </Button>
          <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
            <DialogTrigger asChild>
              <Button className="flex-1 bg-gradient-to-r from-primary to-purple-500 hover:from-primary/90 hover:to-purple-500/90 transform hover:scale-105 transition-all duration-300 text-white border-0">
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
                <Button onClick={importWallet} className="w-full bg-gradient-to-r from-primary to-purple-500 hover:from-primary/90 hover:to-purple-500/90 transform hover:scale-105 transition-all duration-300">
                  Import Wallet
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          {!connected ? (
            <Button className="flex-1 bg-gradient-to-r from-primary to-purple-500 hover:from-primary/90 hover:to-purple-500/90 transform hover:scale-105 transition-all duration-300 text-white border-0" onClick={connectThirdPartyWallet}>
              Connect Phantom/Solflare
            </Button>
          ) : (
            <Button className="flex-1 bg-gradient-to-r from-primary to-purple-500 hover:from-primary/90 hover:to-purple-500/90 transform hover:scale-105 transition-all duration-300 text-white border-0" onClick={disconnectThirdPartyWallet}>
              Disconnect Wallet
            </Button>
          )}
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
                <Button onClick={downloadSeedPhrase} className="flex-1 bg-gradient-to-r from-primary to-purple-500 hover:from-primary/90 hover:to-purple-500/90 transform hover:scale-105 transition-all duration-300 text-white border-0">
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
              <Button onClick={() => setShowSeedDialog(false)} className="w-full bg-gradient-to-r from-primary to-purple-500 hover:from-primary/90 hover:to-purple-500/90 transform hover:scale-105 transition-all duration-300">
                I've Saved My Seed Phrase
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

      <div className="text-xs text-muted-foreground">
        Created: {new Date(wallet.created_at).toLocaleDateString()}
      </div>
    </div>
  );
};

export default SolanaWalletManager;