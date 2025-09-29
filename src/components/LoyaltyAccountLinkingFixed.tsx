import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useForm } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";
import { useSecureAuth } from "@/hooks/useSecureAuth";
import { 
  Link, 
  Shield, 
  Smartphone, 
  CheckCircle, 
  Clock, 
  Trash2,
  RefreshCw,
  Plus,
  Star,
  Gift
} from "lucide-react";

interface LoyaltyNetwork {
  id: string;
  name: string;
  description: string;
  logo_url?: string;
  conversion_rate: number;
  min_transfer_amount: number;
  is_active: boolean;
}

interface UserLoyaltyLink {
  id: string;
  network_name: string;
  mobile_number: string;
  is_verified: boolean;
  linked_at: string;
  points_balance: number;
}

interface LoyaltyAccountLinkingProps {
  onLinkAdded?: () => void;
}

const LoyaltyAccountLinkingFixed = ({ onLinkAdded }: LoyaltyAccountLinkingProps) => {
  const { user } = useSecureAuth();
  const { toast } = useToast();
  const [availableNetworks] = useState<LoyaltyNetwork[]>([
    {
      id: '1',
      name: 'AirAsia BIG',
      description: 'Convert your BIG Points to RAC tokens',
      conversion_rate: 0.1,
      min_transfer_amount: 100,
      is_active: true
    },
    {
      id: '2', 
      name: 'Starbucks Rewards',
      description: 'Transfer your Stars to earn RAC rewards',
      conversion_rate: 0.05,
      min_transfer_amount: 50,
      is_active: true
    },
    {
      id: '3',
      name: 'Grab Rewards',
      description: 'Convert GrabRewards points to RAC',
      conversion_rate: 0.2,
      min_transfer_amount: 200,
      is_active: true
    },
    {
      id: '4',
      name: 'Shopee Coins',
      description: 'Exchange Shopee Coins for RAC tokens',
      conversion_rate: 0.01,
      min_transfer_amount: 1000,
      is_active: true
    },
    {
      id: '5',
      name: 'Maybank TreatPoints',
      description: 'Convert TreatPoints to RAC rewards',
      conversion_rate: 0.15,
      min_transfer_amount: 150,
      is_active: true
    }
  ]);
  const [userLinks, setUserLinks] = useState<UserLoyaltyLink[]>([
    {
      id: '1',
      network_name: 'AirAsia BIG',
      mobile_number: '+60123456789',
      is_verified: true,
      linked_at: new Date(Date.now() - 86400000 * 7).toISOString(),
      points_balance: 2500
    },
    {
      id: '2',
      network_name: 'Starbucks Rewards',
      mobile_number: '+60123456789',
      is_verified: true,
      linked_at: new Date(Date.now() - 86400000 * 14).toISOString(),
      points_balance: 150
    }
  ]);
  const [loading, setLoading] = useState(false);
  const [linkingDialogOpen, setLinkingDialogOpen] = useState(false);
  const [otpDialogOpen, setOtpDialogOpen] = useState(false);
  const [selectedNetwork, setSelectedNetwork] = useState<LoyaltyNetwork | null>(null);
  const [otpSent, setOtpSent] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const linkingForm = useForm({
    defaultValues: {
      networkId: "",
      mobileNumber: ""
    }
  });

  const otpForm = useForm({
    defaultValues: {
      otpCode: ""
    }
  });

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleStartLinking = async (data: { networkId: string; mobileNumber: string }) => {
    const network = availableNetworks.find(n => n.id === data.networkId);
    if (!network) return;

    setSelectedNetwork(network);
    setLinkingDialogOpen(false);
    setOtpDialogOpen(true);
    setOtpSent(true);
    setCountdown(300); // 5 minutes

    toast({
      title: "OTP Sent",
      description: `Verification code sent to ${data.mobileNumber}`,
    });
  };

  const handleVerifyOTP = async (data: { otpCode: string }) => {
    if (!selectedNetwork) return;

    setOtpLoading(true);
    
    // Simulate OTP verification
    setTimeout(() => {
      const newLink: UserLoyaltyLink = {
        id: Date.now().toString(),
        network_name: selectedNetwork.name,
        mobile_number: linkingForm.getValues().mobileNumber,
        is_verified: true,
        linked_at: new Date().toISOString(),
        points_balance: Math.floor(Math.random() * 1000) + 100
      };

      setUserLinks(prev => [...prev, newLink]);
      setOtpDialogOpen(false);
      setOtpLoading(false);
      setSelectedNetwork(null);
      linkingForm.reset();
      otpForm.reset();

      toast({
        title: "Successfully Linked!",
        description: `Your ${selectedNetwork.name} account has been linked successfully.`,
      });

      if (onLinkAdded) {
        onLinkAdded();
      }
    }, 2000);
  };

  const handleResendOTP = async () => {
    setOtpLoading(true);
    setCountdown(300);
    
    setTimeout(() => {
      setOtpLoading(false);
      toast({
        title: "OTP Resent",
        description: "A new verification code has been sent to your mobile number.",
      });
    }, 1000);
  };

  const handleUnlink = async (linkId: string) => {
    setUserLinks(prev => prev.filter(link => link.id !== linkId));
    toast({
      title: "Account Unlinked",
      description: "The loyalty account has been successfully unlinked.",
    });
  };

  const handleTransferPoints = async (linkId: string) => {
    const link = userLinks.find(l => l.id === linkId);
    if (!link) return;

    const network = availableNetworks.find(n => n.name === link.network_name);
    if (!network) return;

    const transferAmount = Math.min(link.points_balance, 500);
    const racAmount = transferAmount * network.conversion_rate;

    // Update points balance
    setUserLinks(prev => prev.map(l => 
      l.id === linkId 
        ? { ...l, points_balance: l.points_balance - transferAmount }
        : l
    ));

    toast({
      title: "Points Transferred!",
      description: `Transferred ${transferAmount} points and earned ${racAmount.toFixed(2)} RAC tokens.`,
    });
  };

  const getLinkedNetworkIds = () => {
    return userLinks.map(link => {
      const network = availableNetworks.find(n => n.name === link.network_name);
      return network?.id;
    }).filter(Boolean);
  };

  if (loading) {
    return (
      <Card className="bg-white/5 backdrop-blur-xl border-white/10">
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <RefreshCw className="h-6 w-6 animate-spin text-primary" />
            <span className="ml-2 text-white">Loading loyalty networks...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Your Linked Accounts */}
      <Card className="bg-white/5 backdrop-blur-xl border-white/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <CheckCircle className="w-5 h-5 text-green-400" />
            Your Linked Accounts
          </CardTitle>
          <CardDescription className="text-gray-300">
            Manage your connected loyalty programs and transfer points
          </CardDescription>
        </CardHeader>
        <CardContent>
          {userLinks.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Shield className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No linked accounts yet</p>
              <p className="text-sm">Link your first loyalty account to start earning</p>
            </div>
          ) : (
            <div className="space-y-4">
              {userLinks.map((link) => {
                const network = availableNetworks.find(n => n.name === link.network_name);
                return (
                  <div key={link.id} className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-500/20 rounded-full">
                        <Star className="w-5 h-5 text-green-400" />
                      </div>
                      <div>
                        <h4 className="font-medium text-white">{link.network_name}</h4>
                        <p className="text-sm text-gray-400">{link.mobile_number}</p>
                        <p className="text-xs text-gray-500">
                          Linked on {new Date(link.linked_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm font-medium text-white">
                          {link.points_balance.toLocaleString()} points
                        </p>
                        {network && (
                          <p className="text-xs text-gray-400">
                            ≈ {(link.points_balance * network.conversion_rate).toFixed(2)} RAC
                          </p>
                        )}
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleTransferPoints(link.id)}
                          disabled={link.points_balance < (network?.min_transfer_amount || 100)}
                          className="bg-primary hover:bg-primary/80"
                        >
                          <Gift className="w-4 h-4 mr-1" />
                          Transfer
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleUnlink(link.id)}
                          className="bg-white/5 border-white/10 hover:bg-red-500/20 hover:border-red-500/20 text-white"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Available Networks */}
      <Card className="bg-white/5 backdrop-blur-xl border-white/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Link className="w-5 h-5 text-primary" />
            Available Loyalty Networks
          </CardTitle>
          <CardDescription className="text-gray-300">
            Connect your loyalty accounts to convert points into RAC tokens
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {availableNetworks.map((network) => {
              const isLinked = getLinkedNetworkIds().includes(network.id);
              
              return (
                <div key={network.id} className="p-4 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-all">
                  <div className="flex items-start justify-between mb-3">
                    <div className="p-2 bg-primary/20 rounded-full">
                      <Star className="w-5 h-5 text-primary" />
                    </div>
                    {isLinked && (
                      <Badge className="bg-green-500 text-white">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Linked
                      </Badge>
                    )}
                  </div>
                  
                  <h3 className="font-medium text-white mb-2">{network.name}</h3>
                  <p className="text-sm text-gray-400 mb-4">{network.description}</p>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Rate:</span>
                      <span className="text-white">{network.conversion_rate} RAC per point</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Min Transfer:</span>
                      <span className="text-white">{network.min_transfer_amount} points</span>
                    </div>
                  </div>
                  
                  <Button
                    className="w-full"
                    disabled={isLinked}
                    onClick={() => {
                      linkingForm.setValue('networkId', network.id);
                      setLinkingDialogOpen(true);
                    }}
                  >
                    {isLinked ? (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Already Linked
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4 mr-2" />
                        Link Account
                      </>
                    )}
                  </Button>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Linking Dialog */}
      <Dialog open={linkingDialogOpen} onOpenChange={setLinkingDialogOpen}>
        <DialogContent className="bg-black/90 backdrop-blur-xl border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white">Link Loyalty Account</DialogTitle>
            <DialogDescription className="text-gray-300">
              Enter the mobile number linked to your loyalty account
            </DialogDescription>
          </DialogHeader>
          <Form {...linkingForm}>
            <form onSubmit={linkingForm.handleSubmit(handleStartLinking)} className="space-y-4">
              <FormField
                control={linkingForm.control}
                name="mobileNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white">Mobile Number</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Smartphone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                          placeholder="+60123456789"
                          className="pl-10 bg-white/5 border-white/10 text-white"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setLinkingDialogOpen(false)} className="bg-white/5 border-white/10 text-white">
                  Cancel
                </Button>
                <Button type="submit">
                  Send OTP
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* OTP Dialog */}
      <Dialog open={otpDialogOpen} onOpenChange={setOtpDialogOpen}>
        <DialogContent className="bg-black/90 backdrop-blur-xl border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white">Verify Mobile Number</DialogTitle>
            <DialogDescription className="text-gray-300">
              Enter the 6-digit code sent to your mobile number
            </DialogDescription>
          </DialogHeader>
          <Form {...otpForm}>
            <form onSubmit={otpForm.handleSubmit(handleVerifyOTP)} className="space-y-4">
              <FormField
                control={otpForm.control}
                name="otpCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white">Verification Code</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="123456"
                        maxLength={6}
                        className="text-center text-lg font-mono bg-white/5 border-white/10 text-white"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {countdown > 0 && (
                <div className="text-center text-sm text-gray-400">
                  <Clock className="w-4 h-4 inline mr-1" />
                  Code expires in {Math.floor(countdown / 60)}:{(countdown % 60).toString().padStart(2, '0')}
                </div>
              )}
              
              <div className="flex justify-between">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleResendOTP}
                  disabled={countdown > 0 || otpLoading}
                  className="bg-white/5 border-white/10 text-white"
                >
                  {otpLoading ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4 mr-2" />
                  )}
                  Resend Code
                </Button>
                
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={() => setOtpDialogOpen(false)} className="bg-white/5 border-white/10 text-white">
                    Cancel
                  </Button>
                  <Button type="submit" disabled={otpLoading}>
                    {otpLoading ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Verify
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LoyaltyAccountLinkingFixed;
