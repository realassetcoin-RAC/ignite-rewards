import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Eye, Mail, Calendar, CreditCard, User } from "lucide-react";

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
  stripe_customer_id: string;
  created_at: string;
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
  const [selectedSubscription, setSelectedSubscription] = useState<UserSubscription | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const [usersResult, subscribersResult] = await Promise.all([
        supabase
          .from("profiles")
          .select("*")
          .order("created_at", { ascending: false }),
        supabase
          .from("subscribers")
          .select("*")
          .order("created_at", { ascending: false })
      ]);

      if (usersResult.error) throw usersResult.error;
      if (subscribersResult.error) throw subscribersResult.error;

      setUsers(usersResult.data || []);
      setSubscribers(subscribersResult.data || []);
    } catch (error) {
      console.error("Failed to load users:", error);
      toast({
        title: "Error",
        description: "Failed to load users and subscriptions",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewUser = (user: UserProfile) => {
    setSelectedUser(user);
    const subscription = subscribers.find(sub => sub.user_id === user.id || sub.email === user.email);
    setSelectedSubscription(subscription || null);
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
    const subscription = subscribers.find(sub => sub.user_id === user.id || sub.email === user.email);
    if (!subscription) return { status: "None", color: "outline" as const };
    
    if (!subscription.subscribed) return { status: "Inactive", color: "secondary" as const };
    
    const endDate = subscription.subscription_end ? new Date(subscription.subscription_end) : null;
    const now = new Date();
    
    if (endDate && endDate < now) return { status: "Expired", color: "destructive" as const };
    
    return { status: subscription.subscription_tier || "Active", color: "default" as const };
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">Platform Users</h3>
          <p className="text-sm text-muted-foreground">
            All registered users and their subscription status
          </p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">Loading users...</div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Subscription</TableHead>
                <TableHead>Registered</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => {
                const subscriptionStatus = getSubscriptionStatus(user);
                return (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{user.full_name || user.email}</div>
                        <div className="text-sm text-muted-foreground">{user.email}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getRoleColor(user.role)} className="capitalize">
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={subscriptionStatus.color} className="capitalize">
                        {subscriptionStatus.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {formatDate(user.created_at)}
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
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
            <DialogDescription>
              Complete user profile and subscription information
            </DialogDescription>
          </DialogHeader>

          {selectedUser && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Profile Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Full Name</label>
                    <div>{selectedUser.full_name || "Not provided"}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Email</label>
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      {selectedUser.email}
                    </div>
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
                    <div className="text-xs font-mono bg-muted p-2 rounded">
                      {selectedUser.id}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Registered</label>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      {formatDate(selectedUser.created_at)}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <CreditCard className="w-5 h-5" />
                    Subscription Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {selectedSubscription ? (
                    <>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Status</label>
                        <div>
                          <Badge variant={selectedSubscription.subscribed ? "default" : "secondary"}>
                            {selectedSubscription.subscribed ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Tier</label>
                        <div>{selectedSubscription.subscription_tier || "Not specified"}</div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">End Date</label>
                        <div>
                          {selectedSubscription.subscription_end 
                            ? formatDate(selectedSubscription.subscription_end)
                            : "Not set"}
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Stripe Customer</label>
                        <div className="text-xs font-mono bg-muted p-2 rounded">
                          {selectedSubscription.stripe_customer_id || "Not available"}
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Subscribed On</label>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          {formatDate(selectedSubscription.created_at)}
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-6 text-muted-foreground">
                      <CreditCard className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>No subscription information available</p>
                      <p className="text-sm">This user hasn't subscribed to any virtual cards yet.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserManager;