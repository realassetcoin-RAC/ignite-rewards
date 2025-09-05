import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Mail, Wallet, UserPlus } from "lucide-react";

/**
 * Admin user creator component that allows existing admins to create new admin users
 * @returns {JSX.Element} The admin user creator component
 */
const AdminUserCreator: React.FC = () => {
  const [emailForm, setEmailForm] = useState({
    email: "",
    password: "",
    fullName: ""
  });

  const [walletForm, setWalletForm] = useState({
    email: "",
    walletAddress: "",
    fullName: ""
  });

  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  /**
   * Handle email-based admin creation
   * @param {React.FormEvent} e - Form submission event
   */
  const handleEmailAdminCreation = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!emailForm.email || !emailForm.password) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    if (emailForm.password.length < 6) {
      toast({
        title: "Password Too Short", 
        description: "Password must be at least 6 characters long.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      // Create admin user with Supabase Auth Admin API
      // Note: This should ideally be done through a secure backend endpoint
      const { data, error } = await supabase.auth.signUp({
        email: emailForm.email,
        password: emailForm.password,
        options: {
          data: {
            signup_type: 'admin',
            full_name: emailForm.fullName || emailForm.email,
          },
          emailRedirectTo: `${window.location.origin}/admin`
        }
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Admin Account Created",
        description: `Admin account created for ${emailForm.email}. They will need to verify their email before accessing the admin panel.`,
      });

      // Reset form
      setEmailForm({ email: "", password: "", fullName: "" });
    } catch (error: any) {
      console.error('Admin creation error:', error);
      toast({
        title: "Creation Failed",
        description: error.message || "Failed to create admin account. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle wallet-based admin creation
   * @param {React.FormEvent} e - Form submission event
   */
  const handleWalletAdminCreation = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!walletForm.email || !walletForm.walletAddress) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      // Call the create_admin_user function
      const { data, error } = await supabase.rpc('create_admin_user', {
        admin_email: walletForm.email,
        admin_wallet_address: walletForm.walletAddress,
        admin_full_name: walletForm.fullName || null
      });

      if (error) {
        throw error;
      }

      if (data?.success) {
        toast({
          title: "Admin Account Created",
          description: `Wallet-linked admin account created for ${walletForm.email}`,
        });

        // Reset form
        setWalletForm({ email: "", walletAddress: "", fullName: "" });
      } else {
        throw new Error(data?.message || "Failed to create admin account");
      }
    } catch (error: any) {
      console.error('Wallet admin creation error:', error);
      toast({
        title: "Creation Failed",
        description: error.message || "Failed to create wallet-linked admin account.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="h-5 w-5" />
          Create Admin User
        </CardTitle>
        <CardDescription>
          Create new admin users with email/password or wallet authentication
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="email" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="email" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Email & Password
            </TabsTrigger>
            <TabsTrigger value="wallet" className="flex items-center gap-2">
              <Wallet className="h-4 w-4" />
              Wallet Address
            </TabsTrigger>
          </TabsList>

          <TabsContent value="email" className="space-y-4">
            <form onSubmit={handleEmailAdminCreation} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={emailForm.email}
                  onChange={(e) => setEmailForm({ ...emailForm, email: e.target.value })}
                  placeholder="admin@example.com"
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <Input
                  id="password"
                  type="password"
                  value={emailForm.password}
                  onChange={(e) => setEmailForm({ ...emailForm, password: e.target.value })}
                  placeholder="Minimum 6 characters"
                  required
                  minLength={6}
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  type="text"
                  value={emailForm.fullName}
                  onChange={(e) => setEmailForm({ ...emailForm, fullName: e.target.value })}
                  placeholder="John Doe"
                  disabled={loading}
                />
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={loading}
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Admin Account
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="wallet" className="space-y-4">
            <form onSubmit={handleWalletAdminCreation} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="walletEmail">Email Address *</Label>
                <Input
                  id="walletEmail"
                  type="email"
                  value={walletForm.email}
                  onChange={(e) => setWalletForm({ ...walletForm, email: e.target.value })}
                  placeholder="admin@example.com"
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="walletAddress">Solana Wallet Address *</Label>
                <Input
                  id="walletAddress"
                  type="text"
                  value={walletForm.walletAddress}
                  onChange={(e) => setWalletForm({ ...walletForm, walletAddress: e.target.value })}
                  placeholder="Enter Solana wallet address"
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="walletFullName">Full Name</Label>
                <Input
                  id="walletFullName"
                  type="text"
                  value={walletForm.fullName}
                  onChange={(e) => setWalletForm({ ...walletForm, fullName: e.target.value })}
                  placeholder="John Doe"
                  disabled={loading}
                />
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={loading}
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Wallet-Linked Admin
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default AdminUserCreator;