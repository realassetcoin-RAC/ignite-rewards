import { useEffect, useState } from "react";
// import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Search, Users, Gift, CheckCircle2, Clock } from "lucide-react";

interface Referral {
  id: string;
  referrer_id: string;
  referral_code: string;
  referred_email?: string | null;
  referred_user_id?: string | null;
  merchant_id?: string | null;
  campaign_id?: string | null;
  status: string; // pending, completed, rewarded
  reward_points: number;
  completed_at?: string | null;
  rewarded_at?: string | null;
  created_at: string;
}

const ReferralManager = () => {
  const { toast } = useToast();
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>("");

  useEffect(() => {
    loadReferrals();
  }, []);

  const loadReferrals = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('user_referrals')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Failed to load referrals:', error);
        
        // Provide more specific error messages
        if (error.message?.includes('permission denied')) {
          toast({ 
            title: 'Access Denied', 
            description: 'You don\'t have permission to view referrals. Please contact an administrator.', 
            variant: 'destructive' 
          });
        } else if (error.message?.includes('relation') && error.message?.includes('does not exist')) {
          toast({ 
            title: 'Database Error', 
            description: 'The referrals table is not properly configured. Please run the database migrations.', 
            variant: 'destructive' 
          });
        } else if (error.message?.includes('schema must be one of the following')) {
          toast({ 
            title: 'Configuration Error', 
            description: 'Database schema configuration error. The referrals feature may not be properly set up.', 
            variant: 'destructive' 
          });
        } else {
          toast({ 
            title: 'Error', 
            description: `Failed to load referrals: ${error.message}`, 
            variant: 'destructive' 
          });
        }
        
        // Still show empty state instead of crashing
        setReferrals([]);
      } else {
        setReferrals(data || []);
      }
    } catch (error: any) {
      console.error('Failed to load referrals:', error);
      toast({ 
        title: 'Error', 
        description: 'An unexpected error occurred while loading referrals', 
        variant: 'destructive' 
      });
      setReferrals([]);
    } finally {
      setLoading(false);
    }
  };

  const filtered = referrals.filter(r => {
    if (!search) return true;
    const target = `${r.referral_code} ${r.referred_email || ''} ${r.status}`.toLowerCase();
    return target.includes(search.toLowerCase());
  });

  const markRewarded = async (referral: Referral) => {
    try {
      const { error } = await supabase
        .from('user_referrals')
        .update({ status: 'rewarded', rewarded_at: new Date().toISOString() })
        .eq('id', referral.id);
      if (error) throw error;
      toast({ title: 'Updated', description: 'Referral marked as rewarded.' });
      await loadReferrals();
    } catch (error) {
      console.error('Failed to update referral:', error);
      toast({ title: 'Error', description: 'Failed to update referral', variant: 'destructive' });
    }
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default">Completed</Badge>;
      case 'rewarded':
        return <Badge variant="secondary">Rewarded</Badge>;
      default:
        return <Badge variant="outline">Pending</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h3 className="text-lg font-medium flex items-center gap-2">
          <Users className="w-4 h-4" />
          User Referrals
        </h3>
        <div className="flex-1 max-w-sm relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by code, email, or status" className="pl-9" />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Gift className="w-5 h-5" /> Referrals</CardTitle>
          <CardDescription>Track referral status and reward payments.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-6">Loading referrals...</div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Referral Code</TableHead>
                    <TableHead>Referred Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Reward</TableHead>
                    <TableHead>Updated</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-mono">{r.referral_code}</TableCell>
                      <TableCell>{r.referred_email || '-'}</TableCell>
                      <TableCell>{statusBadge(r.status)}</TableCell>
                      <TableCell>{r.reward_points} pts</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {r.rewarded_at || r.completed_at || r.created_at ? new Date(r.rewarded_at || r.completed_at || r.created_at).toLocaleString() : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        {r.status !== 'rewarded' ? (
                          <Button size="sm" variant="outline" onClick={() => markRewarded(r)}>
                            <CheckCircle2 className="w-4 h-4 mr-1" /> Mark Rewarded
                          </Button>
                        ) : (
                          <Badge variant="secondary" className="flex items-center gap-1 justify-end"><Clock className="w-3 h-3" /> Paid</Badge>
                        )}
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

export default ReferralManager;

