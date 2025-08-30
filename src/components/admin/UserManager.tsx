import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Eye, Mail, Calendar, User } from "lucide-react";

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: string;
  created_at: string;
  subscribers?: {
    subscribed: boolean;
    subscription_tier: string;
    subscription_end: string;
    created_at: string;
  }[];
}

interface UserManagerProps {
  onStatsUpdate: () => void;
}

const UserManager = ({ onStatsUpdate }: UserManagerProps) => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select(`
          id,
          email,
          full_name,
          role,
          created_at,
          subscribers (
            subscribed,
            subscription_tier,
            subscription_end,
            created_at
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setUsers((data as any) || []);
    } catch (error) {
      console.error("Failed to load users:", error);
      toast({
        title: "Error",
        description: "Failed to load users",
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

  const getSubscriptionStatus = (user: UserProfile) => {
    const subscription = user.subscribers?.[0];
    if (!subscription) return "No subscription";
    
    if (subscription.subscribed) {
      const endDate = subscription.subscription_end ? new Date(subscription.subscription_end) : null;
      if (endDate && endDate < new Date()) {
        return "Expired";
      }
      return "Active";
    }
    return "Inactive";
  };

  const getSubscriptionTier = (user: UserProfile) => {
    const subscription = user.subscribers?.[0];
    return subscription?.subscription_tier || "N/A";
  };

  const getSubscriptionColor = (status: string) => {
    switch (status) {
      case "Active": return "default";
      case "Expired": return "destructive";
      case "Inactive": return "secondary";
      default: return "outline";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">User Management</h3>
      </div>

      {loading ? (
        <div className="text-center py-8">Loading users...</div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Subscription</TableHead>
                <TableHead>Tier</TableHead>
                <TableHead>Registered</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">
                        {user.full_name || "N/A"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">{user.email}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getRoleColor(user.role)} className="capitalize">
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getSubscriptionColor(getSubscriptionStatus(user))}>
                      {getSubscriptionStatus(user)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground capitalize">
                      {getSubscriptionTier(user)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Calendar className="w-3 h-3" />
                      {new Date(user.created_at).toLocaleDateString()}
                    </div>
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
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
            <DialogDescription>
              View detailed user information and subscription history
            </DialogDescription>
          </DialogHeader>

          {selectedUser && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
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
                      <div>{selectedUser.full_name || "Not provided"}</div>
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
                      <div className="text-sm font-mono text-muted-foreground">
                        {selectedUser.id}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Registered</label>
                      <div>{new Date(selectedUser.created_at).toLocaleDateString()}</div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Calendar className="w-5 h-5" />
                      Subscription Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {selectedUser.subscribers && selectedUser.subscribers.length > 0 ? (
                      selectedUser.subscribers.map((subscription, index) => (
                        <div key={index} className="space-y-2 p-3 border rounded-lg">
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">Status</label>
                            <div>
                              <Badge variant={getSubscriptionColor(getSubscriptionStatus(selectedUser))}>
                                {getSubscriptionStatus(selectedUser)}
                              </Badge>
                            </div>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">Tier</label>
                            <div className="capitalize">{subscription.subscription_tier || "N/A"}</div>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">End Date</label>
                            <div>
                              {subscription.subscription_end 
                                ? new Date(subscription.subscription_end).toLocaleDateString()
                                : "No end date"}
                            </div>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">Started</label>
                            <div>{new Date(subscription.created_at).toLocaleDateString()}</div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        No subscription information available
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              <div className="flex justify-end">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserManager;