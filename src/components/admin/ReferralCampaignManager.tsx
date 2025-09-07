import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit2, Calendar, Gift, CheckCircle2 } from "lucide-react";

interface ReferralCampaign {
  id: string;
  name: string;
  description?: string | null;
  reward_points: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
  created_at: string;
}

const ReferralCampaignManager = () => {
  const { toast } = useToast();
  const [campaigns, setCampaigns] = useState<ReferralCampaign[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const [editing, setEditing] = useState<ReferralCampaign | null>(null);

  const form = useForm({
    defaultValues: {
      name: "",
      description: "",
      reward_points: 10,
      start_date: "",
      end_date: "",
      is_active: true,
    },
  });

  useEffect(() => {
    loadCampaigns();
  }, []);

  const loadCampaigns = async () => {
    try {
      setLoading(true);
      
      // Use enhanced loading with fallback methods
      const { loadReferralCampaigns } = await import('@/utils/enhancedAdminLoading');
      const result = await loadReferralCampaigns();
      
      if (result.success) {
        setCampaigns(result.data || []);
        if (result.data && result.data.length === 0) {
          console.log('No referral campaigns found, but loading was successful');
        }
        console.log(`✅ Referral campaigns loaded from ${result.source}`);
      } else {
        console.error('Failed to load referral campaigns:', result.errors);
        toast({ 
          title: 'Loading Error', 
          description: result.message || 'Failed to load referral campaigns', 
          variant: 'destructive' 
        });
      }
    } catch (error) {
      console.error('Failed to load campaigns:', error);
      toast({ title: 'Error', description: 'Failed to load referral campaigns', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditing(null);
    form.reset({ name: "", description: "", reward_points: 10, start_date: "", end_date: "", is_active: true });
    setDialogOpen(true);
  };

  const openEdit = (campaign: ReferralCampaign) => {
    setEditing(campaign);
    form.reset({
      name: campaign.name,
      description: campaign.description || "",
      reward_points: campaign.reward_points,
      start_date: campaign.start_date?.split('T')[0] || "",
      end_date: campaign.end_date?.split('T')[0] || "",
      is_active: !!campaign.is_active,
    });
    setDialogOpen(true);
  };

  const onSubmit = async (values: any) => {
    try {
      if (!values.name || !values.start_date || !values.end_date) {
        toast({ title: 'Missing fields', description: 'Name, start and end dates are required.', variant: 'destructive' });
        return;
      }
      if (new Date(values.end_date) < new Date(values.start_date)) {
        toast({ title: 'Invalid dates', description: 'End date must be after start date.', variant: 'destructive' });
        return;
      }
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({ title: 'Authentication Error', description: 'Please log in to create campaigns.', variant: 'destructive' });
        return;
      }

      const payload = {
        name: values.name.trim(),
        description: values.description?.trim() || null,
        reward_points: Number(values.reward_points) || 0,
        start_date: values.start_date,
        end_date: values.end_date,
        is_active: !!values.is_active,
        ...(editing ? {} : { created_by: user.id }), // Only add created_by for new campaigns
      };
      
      if (editing) {
        const { error } = await supabase
          .from('referral_campaigns')
          .update(payload)
          .eq('id', editing.id);
        if (error) {
          console.error('Update error:', error);
          throw error;
        }
        toast({ title: 'Updated', description: 'Campaign updated successfully.' });
      } else {
        const { error } = await supabase
          .from('referral_campaigns')
          .insert([payload]);
        if (error) {
          console.error('Insert error:', error);
          throw error;
        }
        toast({ title: 'Created', description: 'Campaign created successfully.' });
      }
      setDialogOpen(false);
      setEditing(null);
      await loadCampaigns();
    } catch (error: any) {
      console.error('Failed to save campaign:', error);
      const errorMessage = error?.message || 'Failed to save campaign';
      toast({ 
        title: 'Error', 
        description: errorMessage.includes('permission') 
          ? 'You do not have permission to create campaigns. Please contact an administrator.'
          : errorMessage,
        variant: 'destructive' 
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium flex items-center gap-2">
          <Gift className="w-4 h-4" />
          Referral Campaigns
        </h3>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreate}>
              <Plus className="w-4 h-4 mr-2" />
              New Campaign
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editing ? 'Edit Campaign' : 'Create Campaign'}</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Campaign Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Launch Promo" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Input placeholder="Optional description" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="reward_points"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Reward Points</FormLabel>
                        <FormControl>
                          <Input type="number" min={0} step={1} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="start_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Calendar className="w-3 h-3" /> Start Date
                        </FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="end_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Calendar className="w-3 h-3" /> End Date
                        </FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="is_active"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Active Campaign</FormLabel>
                        <p className="text-sm text-muted-foreground">
                          Enable this campaign for new referrals
                        </p>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex gap-3 pt-4">
                  <Button type="submit" className="flex-1 bg-gradient-to-r from-primary to-purple-500 hover:from-primary/90 hover:to-purple-500/90 transform hover:scale-105 transition-all duration-300">
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    {editing ? 'Update Campaign' : 'Create Campaign'}
                  </Button>
                  <Button type="button" onClick={() => setDialogOpen(false)} className="flex-1 bg-gradient-to-r from-primary to-purple-500 hover:from-primary/90 hover:to-purple-500/90 transform hover:scale-105 transition-all duration-300 text-white border-0">
                    Cancel
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="w-5 h-5" /> Current Campaigns
          </CardTitle>
          <CardDescription>Manage start/end dates, active status, and reward points.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-6">Loading campaigns...</div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Reward</TableHead>
                    <TableHead>Dates</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {campaigns.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell>
                        <div className="font-medium">{c.name}</div>
                        <div className="text-sm text-muted-foreground">{c.description}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{c.reward_points} pts</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {new Date(c.start_date).toLocaleDateString()} → {new Date(c.end_date).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={c.is_active ? 'default' : 'secondary'}>
                          {c.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="outline" onClick={() => openEdit(c)}>
                          <Edit2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ReferralCampaignManager;

