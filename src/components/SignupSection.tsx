import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { 
  Building2, 
  CreditCard, 
  ChevronLeft, 
  ChevronRight, 
  Star,
  Check,
  Users,
  Store
} from "lucide-react";

// Virtual card options
const virtualCards = [
  {
    id: "basic",
    name: "Basic Card",
    price: 0,
    image: "/src/assets/rac-card.jpg",
    features: ["Standard rewards", "Basic design"]
  },
  {
    id: "premium",
    name: "Premium Card",
    price: 9.99,
    image: "/src/assets/rac-nft-card.jpg",
    features: ["Enhanced rewards", "Premium design", "NFT collectible"]
  }
];

// Merchant subscription plans
const merchantPlans = [
  {
    id: "starter",
    name: "Starter",
    price: 29,
    period: "month",
    features: [
      "Up to 100 customers",
      "Basic analytics",
      "Email support",
      "Standard integration"
    ]
  },
  {
    id: "professional",
    name: "Professional", 
    price: 99,
    period: "month",
    popular: true,
    features: [
      "Up to 1,000 customers",
      "Advanced analytics",
      "Priority support",
      "Custom branding",
      "API access"
    ]
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: 299,
    period: "month",
    features: [
      "Unlimited customers",
      "Full analytics suite",
      "24/7 dedicated support",
      "White-label solution",
      "Advanced API",
      "Custom integrations"
    ]
  }
];

const SignupSection = () => {
  const { toast } = useToast();
  const [signupType, setSignupType] = useState<'customer' | 'merchant'>('customer');
  const [selectedCard, setSelectedCard] = useState(0);
  const [selectedPlan, setSelectedPlan] = useState(0);
  
  const [customerForm, setCustomerForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: ""
  });

  const [merchantForm, setMerchantForm] = useState({
    businessName: "",
    contactName: "",
    email: "",
    phone: "",
    website: "",
    industry: "",
    address: ""
  });

  const handleCustomerInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCustomerForm(prev => ({ ...prev, [name]: value }));
  };

  const handleMerchantInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setMerchantForm(prev => ({ ...prev, [name]: value }));
  };

  const handleCustomerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!customerForm.name || !customerForm.email) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    const selectedCardData = virtualCards[selectedCard];
    
    if (selectedCardData.price === 0) {
      // Free card - just sign up
      toast({
        title: "Welcome to PointBridge!",
        description: `${customerForm.name}, your account has been created with the ${selectedCardData.name}.`,
      });
    } else {
      // Paid card - proceed to checkout
      toast({
        title: "Proceeding to Checkout",
        description: `Redirecting to payment for ${selectedCardData.name} ($${selectedCardData.price})`,
      });
      // Here you would integrate with your payment system
    }
  };

  const handleMerchantSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!merchantForm.businessName || !merchantForm.contactName || !merchantForm.email) {
      toast({
        title: "Missing Information", 
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    const plan = merchantPlans[selectedPlan];
    
    toast({
      title: "Proceeding to Checkout",
      description: `Redirecting to subscription setup for ${plan?.name} plan ($${plan?.price}/month)`,
    });
    // Here you would integrate with Stripe for subscription
  };

  const nextCard = () => {
    setSelectedCard((prev) => (prev + 1) % virtualCards.length);
  };

  const prevCard = () => {
    setSelectedCard((prev) => (prev - 1 + virtualCards.length) % virtualCards.length);
  };

  const nextPlan = () => {
    setSelectedPlan((prev) => (prev + 1) % merchantPlans.length);
  };

  const prevPlan = () => {
    setSelectedPlan((prev) => (prev - 1 + merchantPlans.length) % merchantPlans.length);
  };

  return (
    <section className="py-20 px-6 bg-reward-light">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold mb-6 text-foreground">
            Join <span className="text-primary">PointBridge</span> Today
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Choose your path to start earning $RAC tokens and unlock the power of our decentralized rewards ecosystem.
          </p>
        </div>

        {/* Signup Type Selection Cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <Card 
            className={`p-6 cursor-pointer transition-all duration-300 border-2 ${
              signupType === 'customer' 
                ? 'border-primary bg-primary/5 card-shadow' 
                : 'border-border hover:border-primary/50 bg-card'
            }`}
            onClick={() => setSignupType('customer')}
          >
            <div className="text-center">
              <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
                signupType === 'customer' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              }`}>
                <Users className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-foreground">Customer Signup</h3>
              <p className="text-muted-foreground">
                Join as a customer to earn rewards and access exclusive benefits with your virtual card
              </p>
            </div>
          </Card>

          <Card 
            className={`p-6 cursor-pointer transition-all duration-300 border-2 ${
              signupType === 'merchant' 
                ? 'border-primary bg-primary/5 card-shadow' 
                : 'border-border hover:border-primary/50 bg-card'
            }`}
            onClick={() => setSignupType('merchant')}
          >
            <div className="text-center">
              <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
                signupType === 'merchant' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              }`}>
                <Store className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-foreground">Merchant Signup</h3>
              <p className="text-muted-foreground">
                Partner with us as a merchant to offer rewards to your customers and grow your business
              </p>
            </div>
          </Card>
        </div>

        {/* Customer Signup Content */}
        {signupType === 'customer' && (
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Virtual Card Selection */}
            <div className="space-y-6">
              <div>
                <h3 className="text-2xl font-bold mb-4 text-foreground">Choose Your Virtual Card</h3>
                <div className="relative">
                  <Card className="p-6 card-gradient card-shadow border-0">
                    <div className="relative">
                      <img 
                        src={virtualCards[selectedCard].image}
                        alt={virtualCards[selectedCard].name}
                        className="w-full h-48 object-cover rounded-lg mb-4"
                      />
                      <div className="absolute top-1/2 -left-4 -translate-y-1/2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={prevCard}
                          className="h-10 w-10 bg-black/20 hover:bg-black/40 border-0 text-white"
                        >
                          <ChevronLeft className="h-5 w-5" />
                        </Button>
                      </div>
                      <div className="absolute top-1/2 -right-4 -translate-y-1/2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={nextCard}
                          className="h-10 w-10 bg-black/20 hover:bg-black/40 border-0 text-white"
                        >
                          <ChevronRight className="h-5 w-5" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="text-center">
                      <h4 className="text-xl font-bold text-foreground mb-2">
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
              </div>
            </div>

            {/* Customer Form */}
            <div className="space-y-6">
              <Card className="p-6 card-gradient card-shadow border-0">
                <CardHeader className="px-0 pt-0">
                  <CardTitle>Customer Details</CardTitle>
                  <CardDescription>
                    Fill in your information to create your PointBridge account
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-0 pb-0">
                  <form onSubmit={handleCustomerSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name *</Label>
                      <Input
                        id="name"
                        name="name"
                        value={customerForm.name}
                        onChange={handleCustomerInputChange}
                        placeholder="Enter your full name"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address *</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={customerForm.email}
                        onChange={handleCustomerInputChange}
                        placeholder="Enter your email address"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        value={customerForm.phone}
                        onChange={handleCustomerInputChange}
                        placeholder="Enter your phone number"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="address">Address</Label>
                      <Input
                        id="address"
                        name="address"
                        value={customerForm.address}
                        onChange={handleCustomerInputChange}
                        placeholder="Enter your address"
                      />
                    </div>
                    
                    <Button type="submit" className="w-full mt-6" variant="hero">
                      {virtualCards[selectedCard].price === 0 
                        ? "Create Account" 
                        : `Proceed to Checkout - $${virtualCards[selectedCard].price}`
                      }
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Merchant Signup Content */}
        {signupType === 'merchant' && (
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Subscription Plans */}
            <div className="space-y-6">
              <div>
                <h3 className="text-2xl font-bold mb-4 text-foreground">Choose Your Plan</h3>
                <div className="relative">
                  <Card className="p-6 card-gradient card-shadow border-0">
                    <div className="relative">
                      <div className="absolute top-1/2 -left-4 -translate-y-1/2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={prevPlan}
                          className="h-10 w-10 bg-black/20 hover:bg-black/40 border-0 text-white"
                        >
                          <ChevronLeft className="h-5 w-5" />
                        </Button>
                      </div>
                      <div className="absolute top-1/2 -right-4 -translate-y-1/2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={nextPlan}
                          className="h-10 w-10 bg-black/20 hover:bg-black/40 border-0 text-white"
                        >
                          <ChevronRight className="h-5 w-5" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-2 mb-4">
                        <h4 className="text-2xl font-bold text-foreground">{merchantPlans[selectedPlan].name}</h4>
                        {merchantPlans[selectedPlan].popular && (
                          <Badge className="bg-primary text-primary-foreground">
                            <Star className="w-3 h-3 mr-1" />
                            Popular
                          </Badge>
                        )}
                      </div>
                      <div className="text-3xl font-bold text-primary mb-6">
                        ${merchantPlans[selectedPlan].price}<span className="text-lg text-muted-foreground">/{merchantPlans[selectedPlan].period}</span>
                      </div>
                      
                      <div className="space-y-3">
                        {merchantPlans[selectedPlan].features.map((feature, index) => (
                          <div key={index} className="flex items-center justify-center">
                            <Check className="w-4 h-4 text-primary mr-2 flex-shrink-0" />
                            <span className="text-muted-foreground">{feature}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </Card>
                </div>
              </div>
            </div>

            {/* Merchant Form */}
            <div className="space-y-6">
              <Card className="p-6 card-gradient card-shadow border-0">
                <CardHeader className="px-0 pt-0">
                  <CardTitle>Business Details</CardTitle>
                  <CardDescription>
                    Tell us about your business to get started with PointBridge
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-0 pb-0">
                  <form onSubmit={handleMerchantSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="businessName">Business Name *</Label>
                      <Input
                        id="businessName"
                        name="businessName"
                        value={merchantForm.businessName}
                        onChange={handleMerchantInputChange}
                        placeholder="Enter your business name"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="contactName">Contact Name *</Label>
                      <Input
                        id="contactName"
                        name="contactName"
                        value={merchantForm.contactName}
                        onChange={handleMerchantInputChange}
                        placeholder="Enter contact person's name"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="merchantEmail">Email Address *</Label>
                      <Input
                        id="merchantEmail"
                        name="email"
                        type="email"
                        value={merchantForm.email}
                        onChange={handleMerchantInputChange}
                        placeholder="Enter business email address"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="merchantPhone">Phone Number</Label>
                      <Input
                        id="merchantPhone"
                        name="phone"
                        type="tel"
                        value={merchantForm.phone}
                        onChange={handleMerchantInputChange}
                        placeholder="Enter business phone number"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="website">Website</Label>
                      <Input
                        id="website"
                        name="website"
                        value={merchantForm.website}
                        onChange={handleMerchantInputChange}
                        placeholder="Enter your website URL"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="industry">Industry</Label>
                      <Input
                        id="industry"
                        name="industry"
                        value={merchantForm.industry}
                        onChange={handleMerchantInputChange}
                        placeholder="Enter your industry"
                      />
                    </div>
                    
                    <Button type="submit" className="w-full mt-6" variant="hero">
                      Subscribe to {merchantPlans[selectedPlan].name} - ${merchantPlans[selectedPlan].price}/month
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default SignupSection;