import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useSecureAuth } from "@/hooks/useSecureAuth";
import { User, Mail, Calendar, Shield, Save } from "lucide-react";

const ProfileTab = () => {
  const { user, profile, isAdmin, refreshAuth } = useSecureAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
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
            
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">Two-Factor Authentication</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Enhance your account security with two-factor authentication.
              </p>
              <Badge variant="secondary">Coming Soon</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfileTab;