import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Check, ChevronLeft, ChevronRight, Loader2, CreditCard } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Checkbox } from "@/components/ui/checkbox";

/**
 * Virtual card configuration interface
 */
interface VirtualCard {
  id: string;
  name: string;
  price: number;
  image: string;
  features: string[];
}

/**
 * Customer signup modal component props
 */
interface CustomerSignupModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback function to close the modal */
  onClose: () => void;
}

/**
 * Customer form data interface
 */
interface CustomerForm {
  name: string;
  email: string;
  password: string;
  phone: string;
  city: string;
}

// Virtual card options available for customers
const virtualCards: VirtualCard[] = [
  {
    id: "basic",
    name: "Basic Card",
    price: 0,
    image: "/src/assets/rac-card.jpg",
    features: ["Standard rewards", "Basic design", "Mobile wallet support"]
  },
  {
    id: "premium",
    name: "Premium Card",
    price: 9.99,
    image: "/src/assets/rac-nft-card.jpg",
    features: ["Enhanced rewards", "Premium design", "NFT collectible", "Priority support"]
  }
];

/**
 * Customer signup modal component that handles virtual card selection and customer enrollment
 * @param {CustomerSignupModalProps} props - The component props
 * @returns {JSX.Element} The customer signup modal component
 */
const CustomerSignupModal: React.FC<CustomerSignupModalProps> = ({ isOpen, onClose }) => {
  // State management for form and UI
  const [selectedCard, setSelectedCard] = useState(0);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'select' | 'details'>('select');
  
  // Customer form state
  const [customerForm, setCustomerForm] = useState<CustomerForm>({
    name: "",
    email: "",
    password: "",
    phone: "",
    city: ""
  });

  // City search state
  const [cityResults, setCityResults] = useState<any[]>([]);
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  
  // Terms acceptance state
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  
  const { toast } = useToast();
  const navigate = useNavigate();

  /**
   * Reset modal state when it opens/closes
   */
  React.useEffect(() => {
    if (!isOpen) {
      setStep('select');
      setSelectedCard(0);
      setCustomerForm({ name: "", email: "", password: "", phone: "", city: "" });
      setLoading(false);
      setCityResults([]);
      setShowCityDropdown(false);
    }
  }, [isOpen]);

  /**
   * Navigate to next virtual card option
   */
  const nextCard = () => {
    setSelectedCard((prev) => (prev + 1) % virtualCards.length);
  };

  /**
   * Navigate to previous virtual card option
   */
  const prevCard = () => {
    setSelectedCard((prev) => (prev - 1 + virtualCards.length) % virtualCards.length);
  };

  /**
   * Handle input changes for customer form
   * @param {React.ChangeEvent<HTMLInputElement>} e - Input change event
   */
  const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCustomerForm(prev => ({ ...prev, [name]: value }));
    
    // City autocomplete functionality
    if (name === 'city' && value.length > 2) {
      try {
        const response = await fetch(
          `http://api.positionstack.com/v1/forward?access_key=80aa2c1d95e736f410af2dc38df31c37&query=${encodeURIComponent(value)}&limit=5`
        );
        const data = await response.json();
        if (data.data) {
          setCityResults(data.data);
          setShowCityDropdown(true);
        }
      } catch (error) {
        console.error('Error fetching city data:', error);
      }
    } else if (name === 'city') {
      setShowCityDropdown(false);
    }
  };

  /**
   * Select a city from the autocomplete dropdown
   * @param {any} city - Selected city object
   */
  const selectCity = (city: any) => {
    setCustomerForm(prev => ({ 
      ...prev, 
      city: `${city.name}, ${city.region}, ${city.country}` 
    }));
    setShowCityDropdown(false);
  };

  /**
   * Handle customer signup form submission
   * @param {React.FormEvent} e - Form submission event
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!customerForm.name || !customerForm.email || !customerForm.password) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    if (customerForm.password.length < 6) {
      toast({
        title: "Password Too Short",
        description: "Password must be at least 6 characters long.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    const selectedCardData = virtualCards[selectedCard];
    
    try {
      // Create customer account with Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email: customerForm.email,
        password: customerForm.password,
        options: {
          data: {
            signup_type: 'user',
            full_name: customerForm.name,
            phone: customerForm.phone,
            city: customerForm.city,
            selected_card: selectedCardData.id,
            card_price: selectedCardData.price
          },
          emailRedirectTo: `${window.location.origin}/dashboard`
        }
      });

      if (error) {
        throw error;
      }

      if (selectedCardData.price === 0) {
        // Free card - complete signup
        toast({
          title: "Account Created Successfully!",
          description: `Please check your email to verify your account. Your ${selectedCardData.name} will be activated once verified.`,
        });
        // Add a small delay to ensure user sees the success message
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        // Paid card - will need payment after email verification
        toast({
          title: "Account Created Successfully!",
          description: `Please check your email to verify your account. After verification, you'll be able to purchase your ${selectedCardData.name} ($${selectedCardData.price}).`,
        });
        // Here you would integrate with your payment system (Stripe, etc.) after email verification
        // Add a small delay to ensure user sees the success message
        setTimeout(() => {
          onClose();
        }, 1500);
      }
    } catch (error: any) {
      console.error('Customer signup error:', error);
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
                <CreditCard className="inline-block mr-2 h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                Customer Signup
              </DialogTitle>
            </DialogHeader>

        {step === 'select' && (
          <div className="space-y-6">
            <div className="text-center px-2">
              <h3 className="text-lg sm:text-xl font-semibold mb-2">Choose Your Virtual Card</h3>
              <p className="text-sm sm:text-base text-muted-foreground">Select the card that best fits your needs</p>
            </div>

            <div className="relative max-w-md mx-auto">
              <Card className="p-6 card-gradient card-shadow border-0">
                <div className="relative">
                  <img 
                    src={virtualCards[selectedCard].image}
                    alt={virtualCards[selectedCard].name}
                    className="w-full h-48 object-cover rounded-lg mb-4"
                  />
                  
                  {/* Navigation buttons */}
                  <div className="absolute top-1/2 -left-12 -translate-y-1/2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={prevCard}
                      className="h-10 w-10 bg-black/20 hover:bg-black/40 border-0 text-white backdrop-blur-sm"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </Button>
                  </div>
                  <div className="absolute top-1/2 -right-12 -translate-y-1/2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={nextCard}
                      className="h-10 w-10 bg-black/20 hover:bg-black/40 border-0 text-white backdrop-blur-sm"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
                
                {/* Card details */}
                <div className="text-center">
                  <h4 className="text-xl font-bold mb-2">
                    {virtualCards[selectedCard].name}
                  </h4>
                  <div className="text-2xl font-bold text-primary mb-4">
                    {virtualCards[selectedCard].price === 0 ? "Free" : `$${virtualCards[selectedCard].price}`}
                  </div>
                  <div className="space-y-2">
                    {virtualCards[selectedCard].features.map((feature, index) => (
                      <div key={index} className="flex items-center justify-center">
                        <Check className="w-4 h-4 text-primary mr-2" />
                        <span className="text-muted-foreground">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            </div>

            <div className="flex justify-center">
              <Button 
                onClick={() => setStep('details')}
                className="px-8"
                variant="hero"
              >
                Select This Card
              </Button>
            </div>
          </div>
        )}

        {step === 'details' && (
          <div className="space-y-6">
            <div className="text-center">
              <Badge variant="outline" className="mb-2">
                Selected: {virtualCards[selectedCard].name}
              </Badge>
              <h3 className="text-xl font-semibold mb-2">Complete Your Registration</h3>
              <p className="text-muted-foreground">Fill in your details to create your account</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 max-w-md mx-auto text-left">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  name="name"
                  value={customerForm.name}
                  onChange={handleInputChange}
                  placeholder="Enter your full name"
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
                  value={customerForm.email}
                  onChange={handleInputChange}
                  placeholder="Enter your email address"
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
                  value={customerForm.password}
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
                  value={customerForm.phone}
                  onChange={handleInputChange}
                  placeholder="Enter your phone number"
                  disabled={loading}
                />
              </div>
              
              <div className="space-y-2 relative">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  name="city"
                  value={customerForm.city}
                  onChange={handleInputChange}
                  placeholder="Enter your city"
                  disabled={loading}
                  onFocus={() => customerForm.city.length > 2 && setShowCityDropdown(true)}
                  onBlur={() => setTimeout(() => setShowCityDropdown(false), 200)}
                />
                {showCityDropdown && cityResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 bg-card border border-border rounded-md shadow-lg z-10 max-h-40 overflow-y-auto">
                    {cityResults.map((city: any, index) => (
                      <div
                        key={index}
                        className="p-2 hover:bg-muted cursor-pointer text-sm"
                        onMouseDown={() => selectCity(city)}
                      >
                        {city.name}, {city.region}, {city.country}
                      </div>
                    ))}
                  </div>
                )}
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
                  {virtualCards[selectedCard].price === 0 
                    ? "Create Account" 
                    : `Continue - $${virtualCards[selectedCard].price}`
                  }
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

export default CustomerSignupModal;