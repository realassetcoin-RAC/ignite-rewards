import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Check, ChevronLeft, ChevronRight, Loader2, Building2, Star, ArrowRight } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

/**
 * Merchant subscription plan interface
 */
interface MerchantPlan {
  id: string;
  name: string;
  price: number;
  priceYearly: number;
  period: string;
  popular?: boolean;
  features: string[];
  monthlyPoints: number;
  monthlyTransactions: number;
  planNumber: number;
  validFrom?: string;
  validUntil?: string;
}

/**
 * Database subscription plan interface
 */
interface DatabasePlan {
  id: string;
  name: string;
  description: string;
  price_monthly: number;
  price_yearly: number;
  monthly_points: number;
  monthly_transactions: number;
  features: string[];
  trial_days: number;
  is_active: boolean;
  popular?: boolean;
  plan_number: number;
  valid_from?: string;
  valid_until?: string;
  created_at: string;
}

/**
 * Merchant signup modal component props
 */
interface MerchantSignupModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback function to close the modal */
  onClose: () => void;
}

/**
 * Merchant form data interface
 */
interface MerchantForm {
  businessName: string;
  contactName: string;
  email: string;
  password: string;
  phone: string;
  website: string;
  industry: string;
  address: string;
}


/**
 * Merchant signup modal component that handles subscription plan selection and business enrollment
 * @param {MerchantSignupModalProps} props - The component props
 * @returns {JSX.Element} The merchant signup modal component
 */
const MerchantSignupModal: React.FC<MerchantSignupModalProps> = ({ isOpen, onClose }) => {
  // State management for form and UI
  const [selectedPlan, setSelectedPlan] = useState(0); // Default to first plan
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const [loading, setLoading] = useState(false);
  const [plansLoading, setPlansLoading] = useState(false);
  const [step, setStep] = useState<'select' | 'details'>('select');
  const [merchantPlans, setMerchantPlans] = useState<MerchantPlan[]>([]);
  
  // Merchant form state
  const [merchantForm, setMerchantForm] = useState<MerchantForm>({
    businessName: "",
    contactName: "",
    email: "",
    password: "",
    phone: "",
    website: "",
    industry: "",
    address: ""
  });
  
  // Terms acceptance state
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  
  const { toast } = useToast();
  const navigate = useNavigate();

  /**
   * Load subscription plans from database using the validity-aware function
   */
  const loadPlans = async () => {
    try {
      setPlansLoading(true);
      console.log('🔍 Loading valid subscription plans from database...');
      
      // Use the new function that filters by validity dates
      const { data, error } = await supabase
        .rpc('get_valid_subscription_plans');
      
      if (error) {
        console.error('Failed to load plans:', error);
        // Fallback to direct table query if function doesn't exist yet
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('merchant_subscription_plans')
          .select('*')
          .eq('is_active', true)
          .order('plan_number', { ascending: true });
        
        if (fallbackError) {
          toast({
            title: "Error",
            description: "Could not load subscription plans. Please try again later or contact support.",
            variant: "destructive"
          });
          setMerchantPlans([]);
          return;
        }
        
        if (fallbackData && fallbackData.length > 0) {
          const convertedPlans: MerchantPlan[] = fallbackData.map((plan: any) => ({
            id: plan.id,
            name: plan.name,
            price: plan.price_monthly || 0,
            priceYearly: plan.price_yearly || 0,
            period: "month",
            popular: plan.popular || false,
            features: Array.isArray(plan.features) ? plan.features : [],
            monthlyPoints: plan.monthly_points || 0,
            monthlyTransactions: plan.monthly_transactions || 0,
            planNumber: plan.plan_number || 0,
            validFrom: plan.valid_from,
            validUntil: plan.valid_until
          }));
          
          setMerchantPlans(convertedPlans);
          console.log('✅ Loaded', convertedPlans.length, 'subscription plans (fallback)');
        }
        return;
      }

      if (data && data.length > 0) {
        // Convert to MerchantPlan format
        const convertedPlans: MerchantPlan[] = data.map((plan: any) => ({
          id: plan.id,
          name: plan.name,
          price: plan.price_monthly || 0,
          priceYearly: plan.price_yearly || 0,
          period: "month",
          popular: plan.popular || false,
          features: Array.isArray(plan.features) ? plan.features : [],
          monthlyPoints: plan.monthly_points || 0,
          monthlyTransactions: plan.monthly_transactions || 0,
          planNumber: plan.plan_number || 0,
          validFrom: plan.valid_from,
          validUntil: plan.valid_until
        }));
        
        setMerchantPlans(convertedPlans);
        console.log('✅ Loaded', convertedPlans.length, 'valid subscription plans from database');
      } else {
        console.log('⚠️ No valid plans found in database');
        setMerchantPlans([]);
        toast({
          title: "No Plans Available",
          description: "No subscription plans are currently available. Please contact support.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error loading plans:', error);
      setMerchantPlans([]);
      toast({
        title: "Error",
        description: "An error occurred while loading subscription plans. Please try again later.",
        variant: "destructive"
      });
    } finally {
      setPlansLoading(false);
    }
  };

  /**
   * Load plans when modal opens
   */
  useEffect(() => {
    if (isOpen) {
      loadPlans();
    }
  }, [isOpen]);

  /**
   * Reset modal state when it opens/closes
   */
  React.useEffect(() => {
    if (!isOpen) {
      setStep('select');
      setSelectedPlan(0);
      setBillingPeriod('monthly');
      setMerchantForm({
        businessName: "",
        contactName: "",
        email: "",
        password: "",
        phone: "",
        website: "",
        industry: "",
        address: ""
      });
      setAcceptedTerms(false);
      setAcceptedPrivacy(false);
      setLoading(false);
    }
  }, [isOpen]);

  /**
   * Navigate to next subscription plan
   */
  const nextPlan = () => {
    setSelectedPlan((prev) => (prev + 1) % merchantPlans.length);
  };

  /**
   * Navigate to previous subscription plan
   */
  const prevPlan = () => {
    setSelectedPlan((prev) => (prev - 1 + merchantPlans.length) % merchantPlans.length);
  };

  /**
   * Handle input changes for merchant form
   * @param {React.ChangeEvent<HTMLInputElement>} e - Input change event
   */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setMerchantForm(prev => ({ ...prev, [name]: value }));
  };

  /**
   * Handle merchant signup form submission
   * @param {React.FormEvent} e - Form submission event
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!merchantForm.businessName || !merchantForm.contactName || !merchantForm.email || !merchantForm.password) {
      toast({
        title: "Missing Information", 
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    if (merchantForm.password.length < 6) {
      toast({
        title: "Password Too Short",
        description: "Password must be at least 6 characters long.",
        variant: "destructive"
      });
      return;
    }

    // Validate terms and privacy acceptance before proceeding
    if (!acceptedTerms || !acceptedPrivacy) {
      toast({
        title: "Terms and Privacy Required",
        description: "Please accept the Terms of Service and Privacy Policy to continue.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    const plan = merchantPlans[selectedPlan];
    
    if (!plan) {
      toast({
        title: "Error",
        description: "No subscription plan selected. Please try again.",
        variant: "destructive"
      });
      setLoading(false);
      return;
    }
    
    // Get the correct price based on billing period
    const selectedPrice = billingPeriod === 'yearly' ? plan.priceYearly : plan.price;
    const billingPeriodText = billingPeriod === 'yearly' ? 'year' : 'month';
    
    try {
      // Create merchant account with Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email: merchantForm.email,
        password: merchantForm.password,
        options: {
          data: {
            signup_type: 'merchant',
            full_name: merchantForm.contactName,
            business_name: merchantForm.businessName,
            contact_name: merchantForm.contactName,
            phone: merchantForm.phone,
            website: merchantForm.website,
            industry: merchantForm.industry,
            address: merchantForm.address,
            selected_plan: plan.id,
            plan_price: selectedPrice,
            billing_period: billingPeriod,
            monthly_points: plan.monthlyPoints,
            monthly_transactions: plan.monthlyTransactions
          },
          emailRedirectTo: `${window.location.origin}/merchant`
        }
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Account Created Successfully!",
        description: "Please check your email to verify your account. Once verified, you can set up your subscription.",
      });
      
      // Here you would integrate with Stripe for subscription billing after email verification
      console.log('Merchant signup successful:', {
        plan: plan,
        merchant: merchantForm,
        userId: data.user?.id
      });
      
      onClose();
    } catch (error: any) {
      console.error('Merchant signup error:', error);
      toast({
        title: "Signup Failed",
        description: error.message || "An error occurred during signup. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[calc(100vw-2rem)] sm:w-full sm:max-w-4xl bg-transparent border-0 shadow-none p-0">
        <div className="rounded-lg p-[1px] bg-gradient-to-r from-primary via-purple-500 to-blue-500 animate-gradient-x">
          <div className="bg-card/95 backdrop-blur-sm border border-border/50 card-shadow rounded-lg max-h-[calc(100vh-2rem)] overflow-y-auto p-4 sm:p-6">
            <DialogHeader className="space-y-3">
              <DialogTitle className="text-center text-xl sm:text-2xl font-bold bg-gradient-to-r from-primary via-purple-500 to-blue-500 bg-clip-text text-transparent animate-gradient-x">
                <Building2 className="inline-block mr-2 h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                Merchant Signup
              </DialogTitle>
            </DialogHeader>

        {step === 'select' && (
          <div className="space-y-6">
            <div className="text-center px-2">
              <h3 className="text-lg sm:text-xl font-semibold mb-2">Choose Your Subscription Plan</h3>
              <p className="text-sm sm:text-base text-muted-foreground">Select the plan that best fits your business needs</p>
              
              {/* Billing Period Toggle */}
              <div className="flex items-center justify-center mt-4">
                <div className="bg-muted/50 rounded-lg p-1 flex">
                  <button
                    type="button"
                    onClick={() => setBillingPeriod('monthly')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                      billingPeriod === 'monthly'
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Monthly
                  </button>
                  <button
                    type="button"
                    onClick={() => setBillingPeriod('yearly')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                      billingPeriod === 'yearly'
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Yearly
                    <Badge variant="secondary" className="ml-2 text-xs">
                      Save 25%
                    </Badge>
                  </button>
                </div>
              </div>
            </div>

            {plansLoading ? (
              <div className="flex justify-center items-center min-h-[400px]">
                <div className="text-center space-y-4">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                  <p className="text-muted-foreground">Loading subscription plans...</p>
                </div>
              </div>
            ) : (
              <div className="w-full max-w-2xl mx-auto">
                <Carousel
                  className="w-full"
                  opts={{
                    align: "center",
                    loop: true,
                    skipSnaps: false,
                    dragFree: false,
                  }}
                  onSelect={(index) => setSelectedPlan(index || 0)}
                >
                  <CarouselContent className="-ml-2 md:-ml-4">
                    {merchantPlans.length > 0 ? (
                      merchantPlans.map((plan, index) => (
                        <CarouselItem key={plan.id} className="pl-2 md:pl-4 basis-full">
                          <div className="p-1">
                            <Card className="group cursor-pointer border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-lg overflow-hidden h-full max-w-sm mx-auto card-gradient card-shadow border-0">
                              <div className="p-6 text-center min-h-[400px] flex flex-col justify-center">
                                {plan.popular && (
                                  <Badge className="bg-primary text-primary-foreground mb-4 w-fit mx-auto">
                                    <Star className="w-3 h-3 mr-1" />
                                    Popular
                                  </Badge>
                                )}
                                
                                <h4 className="text-2xl font-bold mb-4">{plan.name}</h4>
                                
                                <div className="text-3xl font-bold text-primary mb-2">
                                  ${billingPeriod === 'yearly' ? plan.priceYearly : plan.price}
                                  <span className="text-lg text-muted-foreground">/{billingPeriod === 'yearly' ? 'year' : 'month'}</span>
                                </div>
                                
                                {billingPeriod === 'yearly' && plan.priceYearly > 0 && (
                                  <div className="text-sm text-muted-foreground mb-4">
                                    ${Math.round(plan.priceYearly / 12)}/month billed yearly
                                  </div>
                                )}
                                
                                {/* Show monthly points and transactions */}
                                <div className="text-sm text-muted-foreground mb-4 space-y-1">
                                  <div>{plan.monthlyPoints} points/month</div>
                                  <div>{plan.monthlyTransactions} transactions/month</div>
                                </div>
                                
                                <div className="space-y-3 flex-grow">
                                  {plan.features?.map((feature, featureIndex) => (
                                    <div key={featureIndex} className="flex items-center justify-center">
                                      <Check className="w-4 h-4 text-primary mr-3 flex-shrink-0" />
                                      <span className="text-muted-foreground text-left">{feature}</span>
                                    </div>
                                  ))}
                                </div>
                                
                                <Button 
                                  className="w-full mt-6 bg-gradient-to-r from-primary to-purple-500 hover:opacity-90 transition-all duration-300 transform hover:scale-105"
                                  onClick={() => setStep('details')}
                                >
                                  Select This Plan
                                  <ArrowRight className="w-4 h-4 ml-2" />
                                </Button>
                              </div>
                            </Card>
                          </div>
                        </CarouselItem>
                      ))
                    ) : (
                      <CarouselItem className="pl-2 md:pl-4 basis-full">
                        <div className="p-1">
                          <Card className="max-w-sm mx-auto">
                            <div className="p-6 text-center space-y-4">
                              <div className="text-6xl">📋</div>
                              <div>
                                <h4 className="text-xl font-semibold text-muted-foreground mb-2">No Plans Available</h4>
                                <p className="text-muted-foreground">
                                  No subscription plans are currently available. Please contact our support team for assistance.
                                </p>
                              </div>
                            </div>
                          </Card>
                        </div>
                      </CarouselItem>
                    )}
                  </CarouselContent>
                  {merchantPlans.length > 1 && (
                    <>
                      <CarouselPrevious className="hidden md:flex -left-12" />
                      <CarouselNext className="hidden md:flex -right-12" />
                    </>
                  )}
                </Carousel>
              </div>
            )}
          </div>
        )}

        {step === 'details' && (
          <div className="space-y-6">
            <div className="text-center">
              <Badge variant="outline" className="mb-2">
                Selected: {merchantPlans[selectedPlan]?.name} - ${billingPeriod === 'yearly' ? merchantPlans[selectedPlan]?.priceYearly : merchantPlans[selectedPlan]?.price}/{billingPeriod === 'yearly' ? 'year' : 'month'}
              </Badge>
              <h3 className="text-xl font-semibold mb-2">Business Information</h3>
              <p className="text-muted-foreground">Fill in your business details to get started</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 max-w-4xl mx-auto text-left">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                <Label htmlFor="businessName">Business Name *</Label>
                <Input
                  id="businessName"
                  name="businessName"
                  value={merchantForm.businessName}
                  onChange={handleInputChange}
                  placeholder="Enter your business name"
                  required
                  disabled={loading}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="contactName">Contact Name *</Label>
                <Input
                  id="contactName"
                  name="contactName"
                  value={merchantForm.contactName}
                  onChange={handleInputChange}
                  placeholder="Enter contact person name"
                  required
                  disabled={loading}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={merchantForm.email}
                  onChange={handleInputChange}
                  placeholder="Enter business email"
                  required
                  disabled={loading}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  value={merchantForm.password}
                  onChange={handleInputChange}
                  placeholder="Create a password (min. 6 characters)"
                  required
                  minLength={6}
                  disabled={loading}
                />
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={merchantForm.phone}
                  onChange={handleInputChange}
                  placeholder="Enter business phone"
                  disabled={loading}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  name="website"
                  type="url"
                  value={merchantForm.website}
                  onChange={handleInputChange}
                  placeholder="https://your-website.com"
                  disabled={loading}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="industry">Industry</Label>
                <Input
                  id="industry"
                  name="industry"
                  value={merchantForm.industry}
                  onChange={handleInputChange}
                  placeholder="e.g., Retail, Food & Beverage"
                  disabled={loading}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="address">Business Address</Label>
                <Input
                  id="address"
                  name="address"
                  value={merchantForm.address}
                  onChange={handleInputChange}
                  placeholder="Enter business address"
                  disabled={loading}
                />
                  </div>
                </div>
              </div>
              
              {/* Terms and Privacy Checkboxes */}
              <div className="space-y-3 pt-4">
                <div className="flex items-start space-x-2">
                  <Checkbox 
                    id="terms-merchant" 
                    checked={acceptedTerms}
                    onCheckedChange={(checked) => setAcceptedTerms(checked as boolean)}
                    required
                  />
                  <label 
                    htmlFor="terms-merchant" 
                    className="text-xs text-muted-foreground leading-relaxed cursor-pointer"
                  >
                    I agree to the{' '}
                    <a href="/terms" target="_blank" className="text-primary hover:underline">
                      Terms of Service
                    </a>
                  </label>
                </div>
                <div className="flex items-start space-x-2">
                  <Checkbox 
                    id="privacy-merchant" 
                    checked={acceptedPrivacy}
                    onCheckedChange={(checked) => setAcceptedPrivacy(checked as boolean)}
                    required
                  />
                  <label 
                    htmlFor="privacy-merchant" 
                    className="text-xs text-muted-foreground leading-relaxed cursor-pointer"
                  >
                    I agree to the{' '}
                    <a href="/privacy" target="_blank" className="text-primary hover:underline">
                      Privacy Policy
                    </a>
                  </label>
                </div>
              </div>
              
              <div className="flex gap-3 pt-4">
                <Button 
                  type="button"
                  variant="outline"
                  onClick={() => setStep('select')}
                  disabled={loading}
                  className="flex-1 border-primary/40 text-primary bg-primary/10 hover:bg-primary/20 backdrop-blur-sm transition-smooth"
                >
                  Back
                </Button>
                <Button 
                  type="submit"
                  disabled={loading || !acceptedTerms || !acceptedPrivacy}
                  className="flex-1"
                  variant="hero"
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Start Subscription - ${billingPeriod === 'yearly' ? merchantPlans[selectedPlan]?.priceYearly : merchantPlans[selectedPlan]?.price}/{billingPeriod === 'yearly' ? 'year' : 'month'}
                </Button>
              </div>
            </form>
          </div>
        )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MerchantSignupModal;