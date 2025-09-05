import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useSecureAuth } from "@/hooks/useSecureAuth";
import { User, Mail, Calendar, Shield, Save, Smartphone, Key, Settings, AlertCircle } from "lucide-react";
import MFASetup from "@/components/MFASetup";
import { disableMFA, regenerateBackupCodes, getMFAStatus } from "@/lib/mfa";

const ProfileTab = () => {
  const { user, profile, isAdmin, refreshAuth, canUseMFA, mfaEnabled, isWalletUser } = useSecureAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [mfaLoading, setMfaLoading] = useState(false);
  const [showMFASetup, setShowMFASetup] = useState(false);
  const [mfaStatus, setMfaStatus] = useState({
    mfaEnabled: false,
    canUseMFA: false,
    backupCodesCount: 0,
    mfaSetupCompletedAt: undefined as string | undefined
  });
  const [formData, setFormData] = useState({
    full_name: profile?.full_name || "",
    email: user?.email || "",
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || "",
        email: user?.email || "",
      });
    }
  }, [profile, user]);

  // Load MFA status
  useEffect(() => {
    const loadMFAStatus = async () => {
      if (user?.id && canUseMFA) {
        try {
          const status = await getMFAStatus(user.id);
          setMfaStatus(status);
        } catch (error) {
          console.error('Error loading MFA status:', error);
        }
      }
    };

    loadMFAStatus();
  }, [user?.id, canUseMFA]);

  const updateProfile = async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      // For now, disable profile updates since schema is complex
      toast({
        title: "Info",
        description: "Profile updates are currently managed by administrators.",
        variant: "default",
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDisableMFA = async () => {
    if (!user?.id) return;

    setMfaLoading(true);
    try {
      const result = await disableMFA(user.id);
      
      if (result.success) {
        toast({
          title: "MFA Disabled",
          description: "Two-factor authentication has been disabled for your account.",
        });
        // Refresh auth state and MFA status
        refreshAuth();
        const status = await getMFAStatus(user.id);
        setMfaStatus(status);
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to disable MFA",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error disabling MFA:', error);
      toast({
        title: "Error",
        description: "Failed to disable MFA. Please try again.",
        variant: "destructive",
      });
    } finally {
      setMfaLoading(false);
    }
  };

  const handleRegenerateBackupCodes = async () => {
    if (!user?.id) return;

    setMfaLoading(true);
    try {
      const result = await regenerateBackupCodes(user.id);
      
      if (result.success) {
        toast({
          title: "Backup Codes Regenerated",
          description: "New backup codes have been generated. Please save them securely.",
        });
        // Refresh MFA status
        const status = await getMFAStatus(user.id);
        setMfaStatus(status);
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to regenerate backup codes",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error regenerating backup codes:', error);
      toast({
        title: "Error",
        description: "Failed to regenerate backup codes. Please try again.",
        variant: "destructive",
      });
    } finally {
      setMfaLoading(false);
    }
  };

  const handleMFASetupComplete = () => {
    setShowMFASetup(false);
    // Refresh auth state and MFA status
    refreshAuth();
    if (user?.id) {
      getMFAStatus(user.id).then(setMfaStatus);
    }
  };

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                <User className="h-8 w-8 text-primary" />
              </div>
              <div>
                <CardTitle className="flex items-center gap-2">
                  {formData.full_name || "User Profile"}
                  {isAdmin && (
                    <Badge variant="secondary" className="bg-primary/10 text-primary">
                      <Shield className="h-3 w-3 mr-1" />
                      Admin
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  {user?.email}
                </CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Account Information */}
      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
          <CardDescription>
            View and manage your account details
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm text-muted-foreground">User ID</Label>
              <code className="text-xs bg-muted px-2 py-1 rounded block mt-1 break-all">
                {user?.id}
              </code>
            </div>
            <div>
              <Label className="text-sm text-muted-foreground">Account Created</Label>
              <div className="flex items-center gap-2 mt-1">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  {profile?.created_at 
                    ? new Date(profile.created_at).toLocaleDateString() 
                    : "Unknown"
                  }
                </span>
              </div>
            </div>
            <div>
              <Label className="text-sm text-muted-foreground">Email Verified</Label>
              <div className="mt-1">
                <Badge variant={user?.email_confirmed_at ? "default" : "secondary"}>
                  {user?.email_confirmed_at ? "Verified" : "Not Verified"}
                </Badge>
              </div>
            </div>
            <div>
              <Label className="text-sm text-muted-foreground">Account Role</Label>
              <div className="mt-1">
                <Badge variant="outline">
                  {profile?.role || "Member"}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit Profile */}
      <Card>
        <CardHeader>
          <CardTitle>Edit Profile</CardTitle>
          <CardDescription>
            Update your personal information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="full_name">Full Name</Label>
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                placeholder="Enter your full name"
              />
            </div>
            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                value={formData.email}
                disabled
                placeholder="Email cannot be changed"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Email address cannot be changed from this interface
              </p>
            </div>
            <Separator />
            <Button onClick={updateProfile} disabled={loading} className="w-full sm:w-auto">
              <Save className="mr-2 h-4 w-4" />
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Account Security */}
      <Card>
        <CardHeader>
          <CardTitle>Account Security</CardTitle>
          <CardDescription>
            Manage your account security settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">Password</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Password management is handled through Supabase Auth. Use the forgot password feature on the login page to reset your password.
              </p>
              <Badge variant="outline">Managed by Supabase Auth</Badge>
            </div>
            
            {/* MFA Section - Only show for email/social users */}
            {canUseMFA ? (
              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium flex items-center gap-2">
                    <Smartphone className="h-4 w-4" />
                    Two-Factor Authentication
                  </h4>
                  <Badge variant={mfaStatus.mfaEnabled ? "default" : "secondary"}>
                    {mfaStatus.mfaEnabled ? "Enabled" : "Disabled"}
                  </Badge>
                </div>
                
                <p className="text-sm text-muted-foreground mb-4">
                  {mfaStatus.mfaEnabled 
                    ? "Your account is protected with two-factor authentication using an authenticator app."
                    : "Enhance your account security with two-factor authentication using an authenticator app."
                  }
                </p>

                {mfaStatus.mfaEnabled && (
                  <div className="space-y-3 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Backup codes remaining:</span>
                      <span className="font-medium">{mfaStatus.backupCodesCount}</span>
                    </div>
                    {mfaStatus.mfaSetupCompletedAt && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Setup completed:</span>
                        <span className="font-medium">
                          {new Date(mfaStatus.mfaSetupCompletedAt).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex gap-2">
                  {!mfaStatus.mfaEnabled ? (
                    <Dialog open={showMFASetup} onOpenChange={setShowMFASetup}>
                      <DialogTrigger asChild>
                        <Button size="sm">
                          <Settings className="h-4 w-4 mr-2" />
                          Enable MFA
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Enable Two-Factor Authentication</DialogTitle>
                          <DialogDescription>
                            Set up two-factor authentication to secure your account
                          </DialogDescription>
                        </DialogHeader>
                        <MFASetup onComplete={handleMFASetupComplete} onCancel={() => setShowMFASetup(false)} />
                      </DialogContent>
                    </Dialog>
                  ) : (
                    <>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={handleRegenerateBackupCodes}
                        disabled={mfaLoading}
                      >
                        <Key className="h-4 w-4 mr-2" />
                        Regenerate Backup Codes
                      </Button>
                      <Button 
                        variant="destructive" 
                        size="sm" 
                        onClick={handleDisableMFA}
                        disabled={mfaLoading}
                      >
                        Disable MFA
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="font-medium">Two-Factor Authentication</h4>
                  <Badge variant="outline">Not Available</Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  MFA is only available for users who signed up with email or social authentication.
                </p>
                <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-blue-700">
                    <p className="font-medium mb-1">Wallet Security</p>
                    <p>Your wallet-based authentication already provides strong security through cryptographic signatures.</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfileTab;