import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Check, ChevronLeft, ChevronRight, Loader2, Building2, Star, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

/**
 * Merchant subscription plan interface (from database)
 */
interface MerchantPlan {
  id: string;
  name: string;
  description?: string;
  price_monthly: number;
  features?: any[];
  trial_days?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
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

// Merchant subscription plans will be loaded from database

/**
 * Merchant signup modal component that handles subscription plan selection and business enrollment
 * @param {MerchantSignupModalProps} props - The component props
 * @returns {JSX.Element} The merchant signup modal component
 */
const MerchantSignupModal: React.FC<MerchantSignupModalProps> = ({ isOpen, onClose }) => {
  // State management for form and UI
  const [selectedPlan, setSelectedPlan] = useState(0); // Default to first plan
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'select' | 'details'>('select');
  const [merchantPlans, setMerchantPlans] = useState<MerchantPlan[]>([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [plansError, setPlansError] = useState<string | null>(null);
  
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
  
  const { toast } = useToast();
  const navigate = useNavigate();

  /**
   * Load subscription plans from database
   */
  const loadSubscriptionPlans = async () => {
    try {
      setPlansLoading(true);
      setPlansError(null);
      console.log('🔍 Loading subscription plans for merchant signup...');
      
      // Load only active plans for public display
      const { data, error } = await supabase
        .from('merchant_subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('price_monthly', { ascending: true });
      
      if (error) {
        console.error('❌ Failed to load subscription plans:', error);
        setPlansError(`Failed to load plans: ${error.message}`);
        
        // Fallback to default plans if database fails
        const fallbackPlans: MerchantPlan[] = [
          {
            id: "basic-fallback",
            name: "Basic",
            description: "Essential features for small businesses",
            price_monthly: 29.99,
            features: ["Basic analytics", "Customer loyalty tracking", "Email support"],
            trial_days: 30,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: "premium-fallback",
            name: "Premium",
            description: "Advanced features for growing businesses",
            price_monthly: 79.99,
            features: ["Advanced analytics", "Custom branding", "Priority support", "API access"],
            trial_days: 30,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: "enterprise-fallback",
            name: "Enterprise",
            description: "Full-featured solution for large businesses",
            price_monthly: 199.99,
            features: ["All Premium features", "Dedicated account manager", "Custom integrations", "24/7 phone support"],
            trial_days: 30,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ];
        
        console.log('🔄 Using fallback plans due to database error');
        setMerchantPlans(fallbackPlans);
      } else {
        console.log('✅ Loaded subscription plans from database:', data?.length || 0, 'plans');
        setMerchantPlans(data || []);
        
        if (data && data.length > 0) {
          console.log('📋 Available plans:', data.map(p => `${p.name} ($${p.price_monthly})`).join(', '));
        }
      }
    } catch (error: any) {
      console.error('❌ Exception loading subscription plans:', error);
      setPlansError(`Exception: ${error.message}`);
      setMerchantPlans([]); // Empty array if everything fails
    } finally {
      setPlansLoading(false);
    }
  };

  /**
   * Load plans when modal opens
   */
  useEffect(() => {
    if (isOpen) {
      loadSubscriptionPlans();
    }
  }, [isOpen]);

  /**
   * Reset modal state when it opens/closes
   */
  React.useEffect(() => {
    if (!isOpen) {
      setStep('select');
      setSelectedPlan(0);
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

    setLoading(true);
    const plan = merchantPlans[selectedPlan];
    
    if (!plan) {
      toast({
        title: "No Plan Selected",
        description: "Please select a subscription plan first.",
        variant: "destructive"
      });
      setLoading(false);
      return;
    }
    
    try {
      console.log('📝 Creating merchant account with plan:', plan);
      
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
            selected_plan_id: plan.id,
            selected_plan_name: plan.name,
            plan_price: plan.price_monthly,
            trial_days: plan.trial_days || 0
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
              
              {plansError && (
                <div className="mt-2 p-3 bg-orange-50 border border-orange-200 rounded-md">
                  <div className="flex items-center text-orange-700">
                    <AlertCircle className="w-4 h-4 mr-2" />
                    <span className="text-sm">{plansError}</span>
                  </div>
                </div>
              )}
            </div>

            {plansLoading ? (
              <div className="text-center py-8">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
                <p className="text-muted-foreground">Loading subscription plans...</p>
              </div>
            ) : merchantPlans.length === 0 ? (
              <div className="text-center py-8">
                <AlertCircle className="h-8 w-8 mx-auto mb-4 text-orange-500" />
                <p className="text-muted-foreground">No subscription plans available</p>
                <p className="text-sm text-muted-foreground mt-2">Please contact support for assistance</p>
              </div>
            ) : (
              <>
                <div className="relative max-w-md mx-auto">
                  <Card className="p-6 card-gradient card-shadow border-0">
                    <div className="relative">
                      {/* Navigation buttons - only show if multiple plans */}
                      {merchantPlans.length > 1 && (
                        <>
                          <div className="absolute top-1/2 -left-12 -translate-y-1/2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={prevPlan}
                              className="h-10 w-10 bg-black/20 hover:bg-black/40 border-0 text-white backdrop-blur-sm"
                            >
                              <ChevronLeft className="h-5 w-5" />
                            </Button>
                          </div>
                          <div className="absolute top-1/2 -right-12 -translate-y-1/2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={nextPlan}
                              className="h-10 w-10 bg-black/20 hover:bg-black/40 border-0 text-white backdrop-blur-sm"
                            >
                              <ChevronRight className="h-5 w-5" />
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                    
                    {/* Plan details */}
                    <div className="text-center min-h-[300px] flex flex-col justify-center">
                      <div className="flex items-center justify-center gap-2 mb-4">
                        <h4 className="text-2xl font-bold">
                          {merchantPlans[selectedPlan]?.name}
                        </h4>
                        {selectedPlan === 1 && merchantPlans.length > 1 && (
                          <Badge className="bg-primary text-primary-foreground">
                            <Star className="w-3 h-3 mr-1" />
                            Popular
                          </Badge>
                        )}
                      </div>
                      
                      <div className="text-3xl font-bold text-primary mb-2">
                        ${merchantPlans[selectedPlan]?.price_monthly?.toFixed(2) || '0.00'}
                        <span className="text-lg text-muted-foreground">/month</span>
                      </div>
                      
                      {merchantPlans[selectedPlan]?.trial_days && merchantPlans[selectedPlan].trial_days > 0 && (
                        <p className="text-sm text-green-600 mb-4">
                          {merchantPlans[selectedPlan].trial_days} day free trial
                        </p>
                      )}
                      
                      {merchantPlans[selectedPlan]?.description && (
                        <p className="text-muted-foreground mb-6 text-sm">
                          {merchantPlans[selectedPlan].description}
                        </p>
                      )}
                      
                      <div className="space-y-3">
                        {(merchantPlans[selectedPlan]?.features || []).map((feature, index) => (
                          <div key={index} className="flex items-center justify-center">
                            <Check className="w-4 h-4 text-primary mr-3 flex-shrink-0" />
                            <span className="text-muted-foreground text-left">{feature}</span>
                          </div>
                        ))}
                      </div>
                      
                      {/* Plan indicator dots */}
                      {merchantPlans.length > 1 && (
                        <div className="flex justify-center gap-2 mt-6">
                          {merchantPlans.map((_, index) => (
                            <button
                              key={index}
                              onClick={() => setSelectedPlan(index)}
                              className={`w-2 h-2 rounded-full transition-all ${
                                index === selectedPlan ? 'bg-primary' : 'bg-muted-foreground/30'
                              }`}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </Card>
                </div>

                <div className="flex justify-center">
                  <Button 
                    onClick={() => setStep('details')}
                    className="px-8"
                    variant="hero"
                    disabled={!merchantPlans[selectedPlan]}
                  >
                    Select This Plan
                  </Button>
                </div>
              </>
            )}
          </div>
        )}

        {step === 'details' && merchantPlans[selectedPlan] && (
          <div className="space-y-6">
            <div className="text-center">
              <Badge variant="outline" className="mb-2">
                Selected: {merchantPlans[selectedPlan].name} - ${merchantPlans[selectedPlan].price_monthly?.toFixed(2)}/month
              </Badge>
              <h3 className="text-xl font-semibold mb-2">Business Information</h3>
              <p className="text-muted-foreground">Fill in your business details to get started</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 max-w-md mx-auto text-left">
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
                  disabled={loading}
                  className="flex-1"
                  variant="hero"
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Start Subscription - ${merchantPlans[selectedPlan]?.price_monthly?.toFixed(2)}/month
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