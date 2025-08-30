import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Eye, Users, CreditCard, Calendar, Mail, User } from "lucide-react";

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: string;
  created_at: string;
  updated_at: string;
}

interface UserSubscription {
  id: string;
  user_id: string;
  email: string;
  subscribed: boolean;
  subscription_tier: string;
  subscription_end: string;
  created_at: string;
  profiles?: {
    full_name: string;
    email: string;
  } | null;
}

interface UserManagerProps {
  onStatsUpdate: () => void;
}

const UserManager = ({ onStatsUpdate }: UserManagerProps) => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [subscribers, setSubscribers] = useState<UserSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [viewMode, setViewMode] = useState<"profiles" | "subscribers">("profiles");
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Load user profiles
      const { data: profilesData, error: profilesError } = await (supabase as any)
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (profilesError) {
        console.error("Failed to load profiles:", profilesError);
      } else {
        setUsers(profilesData || []);
      }

      // Load subscribers
      const { data: subscribersData, error: subscribersError } = await (supabase as any)
        .from("subscribers")
        .select(`
          id,
          user_id,
          email,
          subscribed,
          subscription_tier,
          subscription_end,
          created_at,
          profiles:user_id (
            full_name,
            email
          )
        `)
        .eq("subscribed", true)
        .order("created_at", { ascending: false });

      if (subscribersError) {
        console.error("Failed to load subscribers:", subscribersError);
      } else {
        setSubscribers((subscribersData as any) || []);
      }

    } catch (error) {
      console.error("Failed to load user data:", error);
      toast({
        title: "Error",
        description: "Failed to load user data. Check console for details.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewUser = (user: UserProfile) => {
    setSelectedUser(user);
    setDialogOpen(true);
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "admin": return "destructive";
      case "merchant": return "default";
      case "customer": return "secondary";
      default: return "outline";
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case "premium": return "default";
      case "basic": return "secondary";
      case "enterprise": return "destructive";
      default: return "outline";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">User Management</h3>
        <div className="flex gap-2">
          <Button
            variant={viewMode === "profiles" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("profiles")}
          >
            <User className="w-4 h-4 mr-2" />
            All Users
          </Button>
          <Button
            variant={viewMode === "subscribers" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("subscribers")}
          >
            <CreditCard className="w-4 h-4 mr-2" />
            Subscribers
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p>Loading user data...</p>
        </div>
      ) : (
        <div className="border rounded-lg">
          {viewMode === "profiles" ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{user.full_name || "N/A"}</div>
                        <div className="text-xs text-muted-foreground">
                          ID: {user.id.slice(0, 8)}...
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Mail className="w-3 h-3 text-muted-foreground" />
                        {user.email}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getRoleColor(user.role)} className="capitalize">
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(user.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleViewUser(user)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Subscriber</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Tier</TableHead>
                  <TableHead>Subscription End</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Subscribed</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subscribers.map((subscriber) => (
                  <TableRow key={subscriber.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {subscriber.profiles?.full_name || "N/A"}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          ID: {subscriber.id.slice(0, 8)}...
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Mail className="w-3 h-3 text-muted-foreground" />
                        {subscriber.email}
                      </div>
                    </TableCell>
                    <TableCell>
                      {subscriber.subscription_tier ? (
                        <Badge variant={getTierColor(subscriber.subscription_tier)} className="capitalize">
                          {subscriber.subscription_tier}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">No tier</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {subscriber.subscription_end ? (
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3 h-3 text-muted-foreground" />
                          {new Date(subscriber.subscription_end).toLocaleDateString()}
                        </div>
                      ) : (
                        "N/A"
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={subscriber.subscribed ? "default" : "secondary"}>
                        {subscriber.subscribed ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(subscriber.created_at).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
            <DialogDescription>
              View detailed user information and activity
            </DialogDescription>
          </DialogHeader>

          {selectedUser && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <User className="w-5 h-5" />
                    User Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Full Name</label>
                    <div>{selectedUser.full_name || "Not specified"}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Email</label>
                    <div>{selectedUser.email}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Role</label>
                    <div>
                      <Badge variant={getRoleColor(selectedUser.role)} className="capitalize">
                        {selectedUser.role}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">User ID</label>
                    <div className="font-mono text-sm">{selectedUser.id}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Created At</label>
                    <div>{new Date(selectedUser.created_at).toLocaleString()}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Last Updated</label>
                    <div>{new Date(selectedUser.updated_at).toLocaleString()}</div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <div className="flex justify-end">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserManager;