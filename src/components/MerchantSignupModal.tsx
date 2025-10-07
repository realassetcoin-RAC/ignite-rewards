import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Check, Loader2, Building2, Star, ArrowRight, Zap, Rocket, Cloud, AlertCircle } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import { databaseAdapter } from "@/lib/databaseAdapter";
import { useNavigate } from "react-router-dom";
import { createModuleLogger } from "@/utils/consoleReplacer";
import { merchantSignupSchema, validateFormData, useFieldValidation, businessNameSchema, nameSchema, emailSchema, passwordSchema, phoneSchema, urlSchema, industrySchema, citySchema, INDUSTRY_OPTIONS } from "@/utils/validation";

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

// Plan icons with colors
const planIcons = {
  startup: <Zap className="h-8 w-8 text-blue-500" />,
  momentum: <Star className="h-8 w-8 text-purple-500" />,
  energizer: <Rocket className="h-8 w-8 text-orange-500" />,
  cloud9: <Cloud className="h-8 w-8 text-green-500" />,
  super: <Rocket className="h-8 w-8 text-red-500" />
};


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
  city: string;
  country: string;
  address?: string;
}


/**
 * Merchant signup modal component that handles subscription plan selection and business enrollment
 * @param {MerchantSignupModalProps} props - The component props
 * @returns {JSX.Element} The merchant signup modal component
 */
const MerchantSignupModal: React.FC<MerchantSignupModalProps> = ({ isOpen, onClose }) => {
  const logger = createModuleLogger('MerchantSignupModal');
  
  // State management for form and UI
  const [selectedPlan, setSelectedPlan] = useState(0); // Default to first plan
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const [loading, setLoading] = useState(false);
  const [plansLoading, setPlansLoading] = useState(false);
  const [step, setStep] = useState<'select' | 'details'>('select');
  const [merchantPlans, setMerchantPlans] = useState<MerchantPlan[]>([]);
  const [api, setApi] = useState<CarouselApi>();
  const [, setCurrent] = useState(0);
  const [, setCount] = useState(0);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [formKey, setFormKey] = useState(0); // Key to force form re-render
  
  // Merchant form state
  const [merchantForm, setMerchantForm] = useState<MerchantForm>({
    businessName: "",
    contactName: "",
    email: "",
    password: "",
    phone: "",
    website: "",
    industry: "",
    city: "",
    country: ""
  });
  
  // City suggestions state
  const [citySuggestions, setCitySuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [cityInput, setCityInput] = useState("");
  
  // Terms acceptance state
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  
  const { toast } = useToast();
  const navigate = useNavigate();

  // Real-time validation (including industry and city fields)
  const businessNameValidation = useFieldValidation(businessNameSchema, merchantForm.businessName);
  const contactNameValidation = useFieldValidation(nameSchema, merchantForm.contactName);
  const emailValidation = useFieldValidation(emailSchema, merchantForm.email);
  const passwordValidation = useFieldValidation(passwordSchema, merchantForm.password);
  const phoneValidation = useFieldValidation(phoneSchema, merchantForm.phone);
  const websiteValidation = useFieldValidation(urlSchema, merchantForm.website);
  const industryValidation = useFieldValidation(industrySchema, merchantForm.industry);
  const cityValidation = useFieldValidation(citySchema, merchantForm.city);
  
  // City validation state
  const [cityValidationState, setCityValidationState] = useState<{
    isValidating: boolean;
    error?: string;
    suggestion?: string;
  }>({ isValidating: false });

  /**
   * Search cities with API Ninjas and show suggestions
   */
  const searchCities = async (query: string) => {
    if (!query || query.length < 2) {
      setCitySuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setCityValidationState({ isValidating: true });
    
    try {
      const apiKey = process.env.REACT_APP_API_NINJAS_KEY || 'mmukoqC1YD+DnoIYT1bUFQ==3yeUixLPT1Y8IxQt';
      const url = new URL('https://api.api-ninjas.com/v1/city');
      url.searchParams.append('name', query.trim());
      url.searchParams.append('limit', '10');

      const response = await fetch(url.toString(), {
        headers: {
          'X-Api-Key': apiKey,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          setCityValidationState({ 
            isValidating: false,
            error: 'API key not configured. Please contact support.'
          });
          return;
        }
        setCityValidationState({ 
          isValidating: false,
          error: 'Unable to search cities. Please try again.'
        });
        return;
      }

      const data = await response.json();
      
      if (data && data.length > 0) {
        setCitySuggestions(data);
        setShowSuggestions(true);
        setCityValidationState({ isValidating: false });
      } else {
        setCitySuggestions([]);
        setShowSuggestions(false);
        setCityValidationState({ 
          isValidating: false,
          error: 'No cities found. Please check your spelling.'
        });
      }
    } catch (error) {
      console.error('City search error:', error);
      setCityValidationState({ 
        isValidating: false,
        error: 'Unable to search cities. Please try again.'
      });
    }
  };

  /**
   * Handle city selection from suggestions
   */
  const handleCitySelection = (city: any) => {
    setCityInput(`${city.name}, ${city.country}`);
    setMerchantForm(prev => ({
      ...prev,
      city: city.name,
      country: city.country
    }));
    setShowSuggestions(false);
    setCitySuggestions([]);
    setCityValidationState({ isValidating: false });
  };

  /**
   * Load subscription plans from database using the validity-aware function
   */
  const loadPlans = async () => {
    try {
      setPlansLoading(true);
      logger.debug('Starting to load subscription plans');
      
      // Query public.merchant_subscription_plans directly (Docker Postgres)
      const { data, error } = await databaseAdapter
        .from('merchant_subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('plan_number', { ascending: true });
      
      logger.debug('Plans query result', { data, error });
      
      if (error) {
        logger.error('Plans query failed', error);
        toast({
          title: "Error",
          description: "Could not load subscription plans. Please try again later or contact support.",
          variant: "destructive"
        });
        setMerchantPlans([]);
        return;
      }

      if (data && Array.isArray(data) && data.length > 0) {
        logger.info('Plans loaded', { count: data.length, plans: 'plans' });
        logger.debug('Plans data', data);
        
        // Convert to MerchantPlan format
        const convertedPlans: MerchantPlan[] = data.map((plan: any) => {
          // Use features directly from database
          let featuresArray: string[] = [];
          logger.debug('Processing plan features', { planName: plan.name, features: plan.features, featuresType: typeof plan.features });
          
          if (Array.isArray(plan.features)) {
            featuresArray = plan.features;
          } else if (plan.features && typeof plan.features === 'object') {
            featuresArray = Object.entries(plan.features)
              .filter(([, value]) => value === true)
              .map(([key]) => key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()));
          }
          
          logger.debug('Processed features array', { planName: plan.name, featuresArray });
          
          // Use only the features from the database - no hardcoded overrides
          
          return {
            id: plan.id,
            name: plan.name,
            price: plan.price_monthly || 0,
            priceYearly: plan.price_yearly || 0,
            period: "month",
            popular: plan.popular || false,
            features: featuresArray,
            monthlyPoints: plan.monthly_points || 0,
            monthlyTransactions: plan.monthly_transactions || 0,
            planNumber: plan.plan_number || 0,
            validFrom: plan.valid_from,
            validUntil: plan.valid_until
          };
        });
        
        logger.debug('Converted plans', convertedPlans);
        setMerchantPlans(convertedPlans);
        logger.info('Set merchant plans state', { count: convertedPlans.length, plans: 'plans' });
      } else {
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
   * Carousel API effect for slide tracking
   */
  useEffect(() => {
    if (!api) {
      return;
    }

    setCount(api.scrollSnapList().length);
    setCurrent(api.selectedScrollSnap() + 1);

    const onSelect = () => {
      setCurrent(api.selectedScrollSnap() + 1);
      setCurrentSlide(api.selectedScrollSnap());
    };

    api.on("select", onSelect);
    onSelect(); // Set initial state

    return () => {
      api.off("select", onSelect);
    };
  }, [api]);

  /**
   * Reset modal state when it opens/closes
   */
  React.useEffect(() => {
    if (isOpen) {
      // Reset form data when modal opens to prevent prefilling
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
        city: "",
        country: ""
      });
      setCityInput("");
      setCitySuggestions([]);
      setShowSuggestions(false);
      setCityValidationState({ isValidating: false });
      setAcceptedTerms(false);
      setAcceptedPrivacy(false);
      setLoading(false);
      
      // Clear any stored data from sessionStorage and localStorage
      sessionStorage.removeItem('merchantPaymentData');
      sessionStorage.removeItem('merchantFormData');
      localStorage.removeItem('merchantFormData');
      
      // Force form re-render by changing key
      setFormKey(prev => prev + 1);
    }
  }, [isOpen]);

  /**
   * Reset form data to prevent prefilling
   */
  const resetFormData = () => {
    setMerchantForm({
      businessName: "",
      contactName: "",
      email: "",
      password: "",
      phone: "",
      website: "",
      industry: "",
      city: "",
      country: ""
    });
    setCityInput("");
    setCitySuggestions([]);
    setShowSuggestions(false);
    setCityValidationState({ isValidating: false });
    setAcceptedTerms(false);
    setAcceptedPrivacy(false);
    
    // Clear any stored payment data from sessionStorage
    sessionStorage.removeItem('merchantPaymentData');
    sessionStorage.removeItem('merchantFormData');
    localStorage.removeItem('merchantFormData');
    
    // Force form re-render by changing key
    setFormKey(prev => prev + 1);
  };

  /**
   * Navigate to next subscription plan
   */
  // const nextPlan = () => {
  //   // Function removed - was unused
  // };

  /**
   * Navigate to previous subscription plan
   */
  // const prevPlan = () => {
  //   // Function removed - was unused
  // };

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
    
    // Validate form data using schema (including industry field)
    const formDataWithTerms = {
      ...merchantForm,
      acceptTerms: acceptedTerms,
      acceptPrivacy: acceptedPrivacy
    };
    
    const validation = validateFormData(merchantSignupSchema, formDataWithTerms);
    
    if (!validation.success) {
      const firstError = validation.errors?.[0] || 'Please check your input';
      toast({
        title: "Validation Error",
        description: firstError,
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
      const { data, error } = await databaseAdapter.supabase.auth.signUp({
        email: merchantForm.email,
        password: merchantForm.password
      });

      if (error) {
        throw error;
      }

      // Redirect to payment gateway
      const paymentData = {
        planId: plan.id,
        planName: plan.name,
        price: selectedPrice,
        billingPeriod: billingPeriod,
        billingPeriodText: billingPeriodText,
        monthlyPoints: plan.monthlyPoints,
        monthlyTransactions: plan.monthlyTransactions,
        merchantData: {
          businessName: merchantForm.businessName,
          contactName: merchantForm.contactName,
          email: merchantForm.email,
          phone: merchantForm.phone,
          website: merchantForm.website,
          industry: merchantForm.industry,
          address: merchantForm.address,
          userId: data.user?.id
        }
      };

      // Store payment data in sessionStorage for payment gateway
      sessionStorage.setItem('merchantPaymentData', JSON.stringify(paymentData));

      toast({
        title: "Redirecting to Payment Gateway",
        description: "Please complete your payment to activate your subscription.",
      });

      // Redirect to payment gateway (you can replace this URL with your actual payment gateway)
      setTimeout(() => {
        window.location.href = `/payment?plan=${plan.id}&price=${selectedPrice}&period=${billingPeriod}`;
      }, 1500);
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
        <div className="rounded-2xl p-[2px] bg-gradient-to-br from-primary via-purple-500 via-blue-500 to-emerald-500 shadow-2xl">
          <div className="bg-gradient-to-br from-slate-900/95 via-slate-800/95 to-slate-900/95 backdrop-blur-xl border border-white/10 rounded-2xl max-h-[calc(100vh-2rem)] overflow-y-auto p-4 sm:p-6 shadow-inner">
            <DialogHeader className="space-y-2 text-center">
              <div className="flex items-center justify-center space-x-2">
                <div className="p-2 rounded-full bg-gradient-to-r from-primary to-purple-500 shadow-lg">
                  <Building2 className="h-5 w-5 text-white" />
                </div>
                <DialogTitle className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent">
                  Merchant Signup
                </DialogTitle>
              </div>
            </DialogHeader>

        {step === 'select' && (
          <div className="space-y-4">
            <div className="text-center px-2">
              <div className="flex items-center justify-center gap-2 mb-1">
                <h3 className="text-base sm:text-lg font-semibold">Choose Your Subscription Plan</h3>
                <Badge 
                  variant="secondary" 
                  className="cursor-pointer hover:bg-blue-100 hover:text-blue-700 transition-colors duration-200 text-xs"
                  onClick={() => navigate('/subscription-plans')}
                >
                  More Info
                </Badge>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground">Select the plan that best fits your business needs</p>
              
              {/* Billing Period Toggle */}
              <div className="flex items-center justify-center mt-4">
                <div className="bg-gradient-to-r from-white/10 to-white/5 rounded-xl p-1 flex border border-white/20 shadow-lg">
                  <button
                    type="button"
                    onClick={() => {
                      setBillingPeriod('monthly');
                      resetFormData(); // Reset form when changing billing period
                    }}
                    className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-300 ${
                      billingPeriod === 'monthly'
                        ? 'bg-gradient-to-r from-primary to-purple-500 text-white shadow-lg'
                        : 'text-slate-300 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    Monthly
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setBillingPeriod('yearly');
                      resetFormData(); // Reset form when changing billing period
                    }}
                    className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-300 ${
                      billingPeriod === 'yearly'
                        ? 'bg-gradient-to-r from-primary to-purple-500 text-white shadow-lg'
                        : 'text-slate-300 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    Yearly
                    <Badge className="ml-2 text-xs bg-gradient-to-r from-emerald-500 to-green-500 text-white">
                      Save 25%
                    </Badge>
                  </button>
                </div>
              </div>
            </div>

            {plansLoading ? (
              <div className="flex justify-center items-center min-h-[300px]">
                <div className="text-center space-y-6">
                  <div className="relative">
                    <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
                    <div className="absolute inset-0 h-12 w-12 mx-auto rounded-full border-2 border-primary/20"></div>
                  </div>
                  <p className="text-slate-300 text-lg font-medium">Loading subscription plans...</p>
                  <p className="text-slate-400 text-sm">Please wait while we fetch the best plans for you</p>
                </div>
              </div>
            ) : (
              <div className="w-full">
                {merchantPlans.length > 0 ? (
                  <div className="w-full max-w-5xl mx-auto px-6">
                    
                    {/* Carousel with Progress */}
                    <div className="mx-auto max-w-2xl py-4">
                      <Carousel 
                        setApi={setApi} 
                        className="w-full"
                        opts={{
                          align: "center",
                          loop: true,
                          skipSnaps: false,
                          dragFree: false,
                          slidesToScroll: 1,
                        }}
                      >
                        <CarouselContent>
                          {merchantPlans.map((plan, index) => (
                            <CarouselItem key={plan.id} className="basis-full">
                              <Card className="relative h-[28rem] bg-gradient-to-br from-slate-800/90 via-slate-700/90 to-slate-800/90 border border-white/20 shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-[1.02] backdrop-blur-sm">
                                <CardContent className="p-6 h-full flex flex-col">
                                  {/* Popular Badge */}
                                  {plan.popular && (
                                    <div className="absolute top-4 right-4 z-10">
                                      <Badge className="bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 text-white shadow-lg animate-pulse">
                                        <Star className="w-3 h-3 mr-1 fill-current" />
                                        Most Popular
                                      </Badge>
                                    </div>
                                  )}
                                  
                                  {/* Plan Header */}
                                  <div className="text-center mb-6 min-h-[100px] flex flex-col justify-center">
                                    {/* Plan Icon */}
                                    <div className="flex justify-center mb-3">
                                      {planIcons[plan.id as keyof typeof planIcons]}
                                    </div>
                                    <h3 className="text-2xl font-bold bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent mb-1.5">{plan.name}</h3>
                                    <div className="flex items-center justify-center gap-3 mb-2">
                                      <div className="text-4xl font-bold bg-gradient-to-r from-primary via-purple-400 to-blue-400 bg-clip-text text-transparent">
                                        ${billingPeriod === 'yearly' ? plan.priceYearly : plan.price}
                                      </div>
                                      <div className="text-xs text-slate-300 bg-gradient-to-r from-white/10 to-white/5 px-3 py-1 rounded-full border border-white/20">
                                        {billingPeriod === 'yearly' ? 'annually' : 'monthly'}
                                      </div>
                                    </div>
                                    {billingPeriod === 'yearly' && plan.priceYearly && plan.priceYearly > 0 && (
                                      <div className="text-lg text-slate-300">
                                        ${Math.round(plan.priceYearly / 12)} per month
                                      </div>
                                    )}
                                  </div>
                                  
                                  {/* Features List */}
                                  <div className="flex-1 mb-6 flex justify-center">
                                    <div className="space-y-2 w-full max-w-xs">
                                      {(() => {
                                        console.log('Rendering features for plan:', plan.name, 'features:', plan.features);
                                        return null;
                                      })()}
                                      {plan.features && plan.features.length > 0 ? (
                                        plan.features.slice(0, 7).map((feature, featureIndex) => (
                                          <div key={featureIndex} className="flex items-center text-xs text-slate-200 bg-white/5 rounded-md px-2 py-1 border border-white/10">
                                            <Check className="w-3 h-3 text-emerald-400 mr-2 flex-shrink-0" />
                                            <span className="font-medium">{feature}</span>
                                          </div>
                                        ))
                                      ) : (
                                        <div className="text-xs text-slate-400 text-center">
                                          No features available
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  
                                  {/* Action Button */}
                                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 w-full px-6 flex justify-center">
                                    <Button
                                      className="w-1/2 h-8 text-xs font-semibold transition-all duration-300 transform hover:scale-105 bg-gradient-to-r from-primary via-purple-500 to-blue-500 hover:from-primary/90 hover:via-purple-500/90 hover:to-blue-500/90 text-white shadow-xl hover:shadow-2xl border-0 rounded-lg"
                                      onClick={() => {
                                        setSelectedPlan(index);
                                        resetFormData(); // Reset form when selecting a plan
                                        setStep('details');
                                      }}
                                    >
                                      <span className="flex items-center space-x-2">
                                        <span>Select Plan</span>
                                        <ArrowRight className="w-4 h-4" />
                                      </span>
                                    </Button>
                                  </div>
                                </CardContent>
                              </Card>
                            </CarouselItem>
                          ))}
                        </CarouselContent>
                        <CarouselPrevious className="top-[calc(100%+0.5rem)] translate-y-0 left-0 bg-gradient-to-r from-slate-700 to-slate-600 hover:from-slate-600 hover:to-slate-500 border-white/20 text-white shadow-lg hover:shadow-xl" />
                        <CarouselNext className="top-[calc(100%+0.5rem)] translate-y-0 left-2 translate-x-full bg-gradient-to-r from-slate-700 to-slate-600 hover:from-slate-600 hover:to-slate-500 border-white/20 text-white shadow-lg hover:shadow-xl" />
                      </Carousel>

                      {/* Slide Indicators */}
                      <div className="flex justify-center space-x-2 mt-4">
                        {merchantPlans.map((_, index) => (
                          <button
                            key={index}
                            className={`h-2 rounded-full transition-all duration-300 ${
                              index === currentSlide 
                                ? 'bg-gradient-to-r from-primary to-purple-500 w-12 shadow-lg' 
                                : 'bg-white/30 hover:bg-white/50 w-3'
                            }`}
                            onClick={() => {
                              if (api) {
                                api.scrollTo(index);
                              }
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <Card className="w-full" style={{ borderRadius: '0px' }}>
                    <div className="p-6 text-center space-y-4">
                      <div className="text-4xl">📋</div>
                      <div>
                        <h4 className="text-lg font-semibold text-muted-foreground mb-2">No Plans Available</h4>
                        <p className="text-sm text-muted-foreground">
                          No subscription plans are currently available. Please contact our support team for assistance.
                        </p>
                      </div>
                    </div>
                  </Card>
                )}
              </div>
            )}
          </div>
        )}

        {step === 'details' && (
          <div className="space-y-6">
            <div className="text-center">
              <Badge variant="outline" className="mb-2">
                Selected: {merchantPlans[selectedPlan]?.name} - ${billingPeriod === 'yearly' ? merchantPlans[selectedPlan]?.priceYearly : merchantPlans[selectedPlan]?.price}
              </Badge>
              <h3 className="text-xl font-semibold mb-2">Business Information</h3>
              <p className="text-muted-foreground">Fill in your business details to get started</p>
            </div>

            <form key={formKey} onSubmit={handleSubmit} className="space-y-4 max-w-2xl mx-auto text-left" autoComplete="off">
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
                  autoComplete="off"
                  className={businessNameValidation.error ? 'border-red-500 focus:border-red-500' : ''}
                />
                {businessNameValidation.error && (
                  <div className="flex items-center gap-1 text-xs text-red-600">
                    <AlertCircle className="h-3 w-3" />
                    {businessNameValidation.error}
                  </div>
                )}
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
                  className={contactNameValidation.error ? 'border-red-500 focus:border-red-500' : ''}
                />
                {contactNameValidation.error && (
                  <div className="flex items-center gap-1 text-xs text-red-600">
                    <AlertCircle className="h-3 w-3" />
                    {contactNameValidation.error}
                  </div>
                )}
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
                  autoComplete="off"
                  className={emailValidation.error ? 'border-red-500 focus:border-red-500' : ''}
                />
                {emailValidation.error && (
                  <div className="flex items-center gap-1 text-xs text-red-600">
                    <AlertCircle className="h-3 w-3" />
                    {emailValidation.error}
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  value={merchantForm.password}
                  onChange={handleInputChange}
                  placeholder="Create a password (min. 8 characters, uppercase, lowercase, number, special char)"
                  required
                  minLength={8}
                  disabled={loading}
                  autoComplete="new-password"
                  className={passwordValidation.error ? 'border-red-500 focus:border-red-500' : ''}
                />
                {passwordValidation.error && (
                  <div className="flex items-center gap-1 text-xs text-red-600">
                    <AlertCircle className="h-3 w-3" />
                    {passwordValidation.error}
                  </div>
                )}
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
                  placeholder="Enter business phone (e.g., +1234567890)"
                  disabled={loading}
                  className={phoneValidation.error ? 'border-red-500 focus:border-red-500' : ''}
                />
                {phoneValidation.error && (
                  <div className="flex items-center gap-1 text-xs text-red-600">
                    <AlertCircle className="h-3 w-3" />
                    {phoneValidation.error}
                  </div>
                )}
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
                  className={websiteValidation.error ? 'border-red-500 focus:border-red-500' : ''}
                />
                {websiteValidation.error && (
                  <div className="flex items-center gap-1 text-xs text-red-600">
                    <AlertCircle className="h-3 w-3" />
                    {websiteValidation.error}
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="industry">Industry</Label>
                <Select
                  value={merchantForm.industry}
                  onValueChange={(value) => setMerchantForm(prev => ({ ...prev, industry: value }))}
                  disabled={loading}
                >
                  <SelectTrigger className={industryValidation.error ? 'border-red-500 focus:border-red-500' : ''}>
                    <SelectValue placeholder="Select your industry" />
                  </SelectTrigger>
                  <SelectContent>
                    {INDUSTRY_OPTIONS.map((industry) => (
                      <SelectItem key={industry} value={industry}>
                        {industry}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {industryValidation.error && (
                  <div className="flex items-center gap-1 text-xs text-red-600">
                    <AlertCircle className="h-3 w-3" />
                    {industryValidation.error}
                  </div>
                )}
              </div>
              
              <div className="space-y-2 relative">
                <Label htmlFor="cityCountry">City, Country *</Label>
                <Input
                  id="cityCountry"
                  name="cityCountry"
                  value={cityInput}
                  onChange={(e) => {
                    setCityInput(e.target.value);
                    // Debounce city search
                    const timeoutId = setTimeout(() => {
                      searchCities(e.target.value);
                    }, 300);
                    return () => clearTimeout(timeoutId);
                  }}
                  onFocus={() => {
                    if (citySuggestions.length > 0) {
                      setShowSuggestions(true);
                    }
                  }}
                  onBlur={() => {
                    // Delay hiding suggestions to allow clicking on them
                    setTimeout(() => setShowSuggestions(false), 200);
                  }}
                  placeholder="Type city name (e.g., New York, London, Tokyo)"
                  disabled={loading}
                  className={cityValidation.error || cityValidationState.error ? 'border-red-500 focus:border-red-500' : ''}
                  autoComplete="off"
                />
                
                {/* Loading indicator */}
                {cityValidationState.isValidating && (
                  <div className="absolute right-3 top-8 flex items-center gap-1 text-xs text-blue-600">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Searching...
                  </div>
                )}
                
                {/* Error message */}
                {cityValidationState.error && (
                  <div className="flex items-center gap-1 text-xs text-red-600">
                    <AlertCircle className="h-3 w-3" />
                    {cityValidationState.error}
                  </div>
                )}
                
                {/* City suggestions dropdown */}
                {showSuggestions && citySuggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-md shadow-lg z-50 max-h-60 overflow-y-auto">
                    {citySuggestions.map((city, index) => (
                      <div
                        key={`${city.name}-${city.country}-${index}`}
                        className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                        onMouseDown={(e) => {
                          e.preventDefault(); // Prevent input blur
                          handleCitySelection(city);
                        }}
                      >
                        <div className="font-medium text-gray-900">
                          {city.name}, {city.country}
                        </div>
                        <div className="text-xs text-gray-500">
                          Population: {city.population?.toLocaleString() || 'N/A'}
                          {city.is_capital && ' • Capital'}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Help text */}
                <p className="text-xs text-muted-foreground">
                  Start typing to search for cities worldwide. Select from the suggestions.
                </p>
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
              
              {/* Selected Plan Summary */}
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-2 mb-3">
                <div className="text-center">
                  <h4 className="font-semibold text-base mb-0">{merchantPlans[selectedPlan]?.name} Plan</h4>
                  <div className="text-xl font-bold text-primary mb-0">
                    ${billingPeriod === 'yearly' ? merchantPlans[selectedPlan]?.priceYearly : merchantPlans[selectedPlan]?.price}
                  </div>
                  {billingPeriod === 'yearly' && merchantPlans[selectedPlan]?.priceYearly && merchantPlans[selectedPlan]?.priceYearly > 0 && (
                    <div className="text-xs text-muted-foreground">
                      ${Math.round(merchantPlans[selectedPlan]?.priceYearly / 12)} billed yearly
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex gap-3 pt-4">
                <Button 
                  type="button"
                  variant="outline"
                  onClick={() => setStep('select')}
                  disabled={loading}
                  className="flex-1 border-primary/40 text-primary bg-primary/10 hover:bg-primary/20 backdrop-blur-sm rounded-none"
                  style={{ borderRadius: '0px' }}
                >
                  Back
                </Button>
                <Button 
                  type="submit"
                  disabled={loading || !acceptedTerms || !acceptedPrivacy}
                  className="flex-1 border-primary/40 text-primary bg-primary/10 hover:bg-primary/20 backdrop-blur-sm rounded-none"
                  variant="outline"
                  style={{ borderRadius: '0px' }}
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {loading ? 'Processing...' : 'Proceed to Payment'}
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