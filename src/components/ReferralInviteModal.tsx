import React, { useState, useEffect, useCallback } from 'react';
import { databaseAdapter } from '@/lib/databaseAdapter';
import { useSecureAuth } from '@/hooks/useSecureAuth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Share2, 
  Copy, 
  MessageSquare, 
  Gift, 
  CheckCircle
} from 'lucide-react';

interface ReferralInviteModalProps {
  trigger?: React.ReactNode;
  onClose?: () => void;
}

export const ReferralInviteModal: React.FC<ReferralInviteModalProps> = ({ 
  trigger, 
  onClose 
}) => {
  const { user } = useSecureAuth();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [referralCode, setReferralCode] = useState<string>('');
  const [referralLink, setReferralLink] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const loadReferralCode = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      
      // Get user's loyalty number from profiles table
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('loyalty_card_number')
        .eq('id', user.id)
        .single();
      
      if (profileError) {
        // Console statement removed
        toast({
          title: "Error",
          description: "Failed to load your loyalty information.",
          variant: "destructive"
        });
        return;
      }

      if (profileData?.loyalty_card_number) {
        const loyaltyNumber = profileData.loyalty_card_number;
        setReferralCode(loyaltyNumber);
        setReferralLink(`${window.location.origin}/signup?ref=${loyaltyNumber}`);
      } else {
        toast({
          title: "No Loyalty Card",
          description: "You need a loyalty card to generate a referral code.",
          variant: "destructive"
        });
      }
    } catch {
      // Console statement removed
      toast({
        title: "Error",
        description: "Failed to load referral code. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    if (user && isOpen) {
      loadReferralCode();
    }
  }, [user, isOpen, loadReferralCode]);

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied!",
        description: `${label} copied to clipboard.`,
      });
    } catch {
      toast({
        title: "Copy Failed",
        description: "Failed to copy to clipboard.",
        variant: "destructive"
      });
    }
  };

  const shareViaSMS = () => {
    const message = `Join RAC Rewards with my loyalty number: ${referralCode} or visit: ${referralLink}`;
    const smsLink = `sms:?body=${encodeURIComponent(message)}`;
    window.open(smsLink);
  };

  const shareViaWeb = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join RAC Rewards',
          text: `Join RAC Rewards and earn rewards! Use my loyalty number: ${referralCode}`,
          url: referralLink
        });
      } catch {
        // User cancelled sharing
      }
    } else {
      // Fallback to clipboard
      await copyToClipboard(`${referralLink}`, 'Referral link');
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    onClose?.();
  };

  const handleTriggerClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOpen(true);
  };

  return (
    <>
      {/* Custom trigger that bypasses DialogTrigger */}
      {trigger ? (
        <div onClick={handleTriggerClick}>
          {trigger}
        </div>
      ) : (
        <Button className="w-full" onClick={handleTriggerClick}>
          <Share2 className="h-4 w-4 mr-2" />
          Invite Friends
        </Button>
      )}
      
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader className="pb-4 text-center">
          <DialogTitle className="flex items-center justify-center gap-2 text-lg">
            <Gift className="h-4 w-4 text-primary" />
            Invite Friends & Earn Rewards
          </DialogTitle>
          <DialogDescription className="text-sm">
            Share your referral code and earn points for each friend who joins and makes their first transaction.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="space-y-3">
              {/* Referral Code Display */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Your Loyalty Number</CardTitle>
                  <CardDescription className="text-xs">
                    Share your loyalty number with friends to earn rewards
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Input
                      value={referralCode}
                      readOnly
                      className="font-mono text-sm h-8"
                      placeholder="Loading your loyalty number..."
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(referralCode, 'Loyalty number')}
                      className="h-8 w-8 p-0"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Share Options */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Share Options</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      onClick={shareViaWeb}
                      className="h-10 flex items-center gap-2"
                    >
                      <Share2 className="h-4 w-4" />
                      <span className="text-sm">Share Link</span>
                    </Button>
                    <Button
                      variant="outline"
                      onClick={shareViaSMS}
                      className="h-10 flex items-center gap-2"
                    >
                      <MessageSquare className="h-4 w-4" />
                      <span className="text-sm">SMS</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* How it Works */}
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-primary mt-0.5" />
                    <div>
                      <h4 className="font-medium text-primary mb-1 text-sm">How it works:</h4>
                      <ul className="text-xs space-y-0.5">
                        <li>• Share your loyalty number with friends</li>
                        <li>• They sign up using your loyalty number</li>
                        <li>• When they make their first transaction, you both earn points</li>
                        <li>• Track your referrals and rewards in your dashboard</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-3 border-t">
          <Button variant="outline" onClick={handleClose} size="sm">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
};
