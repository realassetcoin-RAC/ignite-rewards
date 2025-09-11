import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  AlertCircle,
  ExternalLink,
  Trash2,
  RefreshCw
} from "lucide-react";
import { 
  generateLoyaltyOTP, 
  verifyLoyaltyOTP, 
  getUserLoyaltyLinks, 
  getAvailableLoyaltyNetworks,
  checkExistingLoyaltyLink,
  type LoyaltyNetwork 
} from "@/lib/loyaltyOtp";

interface UserLoyaltyLink {
  id: string;
  mobile_number: string;
  is_verified: boolean;
  linked_at: string;
  loyalty_networks: LoyaltyNetwork;
}

interface LoyaltyAccountLinkingProps {
  onLinkAdded?: () => void;
}

const LoyaltyAccountLinking = ({ onLinkAdded }: LoyaltyAccountLinkingProps) => {
  const { user } = useSecureAuth();
  const { toast } = useToast();
  const [availableNetworks, setAvailableNetworks] = useState<LoyaltyNetwork[]>([]);
  const [userLinks, setUserLinks] = useState<UserLoyaltyLink[]>([]);
  const [loading, setLoading] = useState(true);
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
    loadData();
  }, []);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const loadData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const [networksResult, linksResult] = await Promise.all([
        getAvailableLoyaltyNetworks(),
        getUserLoyaltyLinks(user.id)
      ]);

      if (networksResult.success) {
        setAvailableNetworks(networksResult.data || []);
      }

      if (linksResult.success) {
        setUserLinks(linksResult.data || []);
      }
    } catch (error) {
      console.error('Error loading loyalty data:', error);
      toast({
        title: "Error",
        description: "Failed to load loyalty networks",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStartLinking = async (data: { networkId: string; mobileNumber: string }) => {
    if (!user) return;

    try {
      setOtpLoading(true);

      // Check if user already has a link for this network
      const existingCheck = await checkExistingLoyaltyLink(user.id, data.networkId);
      if (existingCheck.success && existingCheck.exists) {
        toast({
          title: "Already Linked",
          description: "You already have a linked account for this loyalty network",
          variant: "destructive",
        });
        return;
      }

      const result = await generateLoyaltyOTP(user.id, data.networkId, data.mobileNumber);
      
      if (result.success) {
        setOtpSent(true);
        setCountdown(600); // 10 minutes
        setLinkingDialogOpen(false);
        setOtpDialogOpen(true);
        toast({
          title: "OTP Sent",
          description: "Verification code sent to your mobile number",
        });
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to send OTP",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error starting linking process:', error);
      toast({
        title: "Error",
        description: "Failed to start linking process",
        variant: "destructive",
      });
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyOTP = async (data: { otpCode: string }) => {
    if (!user || !selectedNetwork || !linkingForm.getValues('mobileNumber')) return;

    try {
      setOtpLoading(true);
      const result = await verifyLoyaltyOTP(
        user.id,
        selectedNetwork.id,
        linkingForm.getValues('mobileNumber'),
        data.otpCode
      );

      if (result.success) {
        toast({
          title: "Success",
          description: `Successfully linked your ${selectedNetwork.display_name} account`,
        });
        
        setOtpDialogOpen(false);
        setOtpSent(false);
        setSelectedNetwork(null);
        linkingForm.reset();
        otpForm.reset();
        loadData();
        onLinkAdded?.();
      } else {
        toast({
          title: "Verification Failed",
          description: result.error || "Invalid OTP code",
          variant: "destructive",
        });
        otpForm.setValue('otpCode', '');
      }
    } catch (error) {
      console.error('Error verifying OTP:', error);
      toast({
        title: "Error",
        description: "Failed to verify OTP",
        variant: "destructive",
      });
    } finally {
      setOtpLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (!user || !selectedNetwork || !linkingForm.getValues('mobileNumber')) return;

    try {
      setOtpLoading(true);
      const result = await generateLoyaltyOTP(
        user.id,
        selectedNetwork.id,
        linkingForm.getValues('mobileNumber')
      );

      if (result.success) {
        setCountdown(600); // Reset countdown
        toast({
          title: "OTP Resent",
          description: "New verification code sent to your mobile number",
        });
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to resend OTP",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error resending OTP:', error);
      toast({
        title: "Error",
        description: "Failed to resend OTP",
        variant: "destructive",
      });
    } finally {
      setOtpLoading(false);
    }
  };

  const handleStartLinkingProcess = (network: LoyaltyNetwork) => {
    setSelectedNetwork(network);
    linkingForm.setValue('networkId', network.id);
    setLinkingDialogOpen(true);
  };

  const formatCountdown = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getLinkedNetworkIds = () => {
    return userLinks.map(link => link.loyalty_networks.id);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <RefreshCw className="w-6 h-6 animate-spin mr-2" />
            Loading loyalty networks...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link className="w-5 h-5 text-primary" />
            Link Loyalty Networks
          </CardTitle>
          <CardDescription>
            Connect your loyalty accounts and instantly convert your points into our tokens to unlock exclusive benefits on our platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          {availableNetworks.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Shield className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No loyalty networks available at the moment</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {availableNetworks.map((network) => {
                const isLinked = getLinkedNetworkIds().includes(network.id);
                return (
                  <Card 
                    key={network.id} 
                    className={`relative transition-all duration-300 ${
                      isLinked 
                        ? 'bg-green-500/5 border-green-500/20' 
                        : 'bg-white/5 backdrop-blur-xl border-white/10 hover:bg-white/10 hover:border-white/20 hover:scale-105'
                    }`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3 mb-4">
                        {network.logo_url ? (
                          <img 
                            src={network.logo_url} 
                            alt={network.display_name}
                            className="w-12 h-12 rounded-lg object-cover shadow-md"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-purple-500/20 rounded-lg flex items-center justify-center">
                            <Shield className="w-6 h-6 text-primary" />
                          </div>
                        )}
                        <div className="flex-1">
                          <h3 className="font-semibold text-white">{network.display_name}</h3>
                          <p className="text-xs text-gray-400">
                            Rate: 1 = {network.conversion_rate} PB tokens
                          </p>
                        </div>
                      </div>
                      
                      <div className="mb-4">
                        <p className="text-sm text-gray-300 mb-2">
                          {network.description}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-gray-400">
                          <Smartphone className="w-3 h-3" />
                          <span>Mobile verification required</span>
                        </div>
                      </div>
                      
                      {isLinked ? (
                        <div className="flex items-center gap-2 px-3 py-2 bg-green-500/20 text-green-400 rounded-lg border border-green-500/30">
                          <CheckCircle className="w-4 h-4" />
                          <span className="text-sm font-medium">Successfully Linked</span>
                        </div>
                      ) : (
                        <Button 
                          onClick={() => handleStartLinkingProcess(network)}
                          className="w-full bg-gradient-to-r from-primary to-purple-500 hover:from-primary/90 hover:to-purple-500/90 text-white border-0"
                          size="sm"
                        >
                          <Link className="w-4 h-4 mr-2" />
                          Link Account
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {userLinks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              Linked Accounts
            </CardTitle>
            <CardDescription>
              Your connected loyalty accounts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {userLinks.map((link) => (
                <div key={link.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {link.loyalty_networks.logo_url ? (
                      <img 
                        src={link.loyalty_networks.logo_url} 
                        alt={link.loyalty_networks.display_name}
                        className="w-8 h-8 rounded"
                      />
                    ) : (
                      <div className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center">
                        <Shield className="w-4 h-4 text-gray-500" />
                      </div>
                    )}
                    <div>
                      <p className="font-medium">{link.loyalty_networks.display_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {link.mobile_number} • Linked {new Date(link.linked_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Verified
                    </Badge>
                    <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Linking Dialog */}
      <Dialog open={linkingDialogOpen} onOpenChange={setLinkingDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Link {selectedNetwork?.display_name} Account</DialogTitle>
            <DialogDescription>
              Enter your mobile number associated with your {selectedNetwork?.display_name} account
            </DialogDescription>
          </DialogHeader>
          
          <Form {...linkingForm}>
            <form onSubmit={linkingForm.handleSubmit(handleStartLinking)} className="space-y-4">
              <FormField
                control={linkingForm.control}
                name="mobileNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mobile Number</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="+1 (555) 123-4567" 
                        {...field}
                        type="tel"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setLinkingDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={otpLoading}>
                  {otpLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Smartphone className="w-4 h-4 mr-2" />
                      Send OTP
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* OTP Verification Dialog */}
      <Dialog open={otpDialogOpen} onOpenChange={setOtpDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Verify Mobile Number</DialogTitle>
            <DialogDescription>
              Enter the 6-digit code sent to {linkingForm.getValues('mobileNumber')}
            </DialogDescription>
          </DialogHeader>
          
          <Form {...otpForm}>
            <form onSubmit={otpForm.handleSubmit(handleVerifyOTP)} className="space-y-4">
              <FormField
                control={otpForm.control}
                name="otpCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Verification Code</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="123456" 
                        {...field}
                        maxLength={6}
                        className="text-center text-lg tracking-widest"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {countdown > 0 && (
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  Resend available in {formatCountdown(countdown)}
                </div>
              )}
              
              <div className="flex justify-between">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleResendOTP}
                  disabled={countdown > 0 || otpLoading}
                >
                  {otpLoading ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4 mr-2" />
                  )}
                  Resend Code
                </Button>
                
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={() => setOtpDialogOpen(false)}>
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

export default LoyaltyAccountLinking;
