import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Mail, User, Phone, MapPin, CreditCard, Store } from "lucide-react";
import racCardImage from "@/assets/rac-nft-card.jpg";

const SignupSection = () => {
  const [customerFormData, setCustomerFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    city: ""
  });
  
  const [merchantFormData, setMerchantFormData] = useState({
    businessName: "",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    city: "",
    businessType: ""
  });
  
  const { toast } = useToast();

  const handleCustomerInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomerFormData({
      ...customerFormData,
      [e.target.name]: e.target.value
    });
  };

  const handleMerchantInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMerchantFormData({
      ...merchantFormData,
      [e.target.name]: e.target.value
    });
  };

  const handleCustomerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!customerFormData.firstName || !customerFormData.lastName || !customerFormData.email) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(customerFormData.email)) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }

    // Success simulation
    toast({
      title: "Welcome to RAC Loyalty Network! 🎉",
      description: "Your free account has been created successfully. Check your email for next steps.",
    });

    // Reset form
    setCustomerFormData({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      city: ""
    });
  };

  const handleMerchantSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!merchantFormData.businessName || !merchantFormData.firstName || !merchantFormData.lastName || !merchantFormData.email) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(merchantFormData.email)) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }

    // Redirect to Stripe checkout for merchant subscription
    toast({
      title: "Redirecting to Payment...",
      description: "Setting up your merchant subscription.",
    });
    
    // TODO: Implement Stripe checkout for merchant subscription
    // This will be implemented once Stripe is configured
  };

  return (
    <section className="py-20 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl lg:text-5xl font-bold mb-6 text-foreground">
            Join the <span className="text-primary">RAC Network</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Choose your path: Customers earn rewards for free, Merchants unlock premium tools with subscription plans.
          </p>
        </div>
        
        <div className="grid lg:grid-cols-2 gap-8 items-start">
          {/* RAC Card Display */}
          <div className="flex justify-center lg:justify-end">
            <div className="relative">
              <img 
                src={racCardImage} 
                alt="RAC Loyalty Card" 
                className="w-full max-w-md rounded-2xl shadow-2xl glow-shadow"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-2xl"></div>
            </div>
          </div>
          
          {/* Signup Forms */}
          <div className="space-y-6">
            <Card className="p-8 card-gradient card-shadow border-0">
              <Tabs defaultValue="customer" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-8 h-12">
                  <TabsTrigger value="customer" className="flex items-center gap-2 text-sm">
                    <CreditCard className="w-4 h-4" />
                    Customer
                  </TabsTrigger>
                  <TabsTrigger value="merchant" className="flex items-center gap-2 text-sm">
                    <Store className="w-4 h-4" />
                    Merchant
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="customer">
                  <form onSubmit={handleCustomerSubmit} className="space-y-6">
                    <div className="text-center mb-6">
                      <h3 className="text-2xl font-bold text-foreground mb-2">Free Customer Account</h3>
                      <p className="text-muted-foreground">Start earning rewards on every purchase</p>
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="customerFirstName" className="text-base font-semibold flex items-center gap-2">
                          <User className="w-4 h-4" />
                          First Name *
                        </Label>
                        <Input
                          id="customerFirstName"
                          name="firstName"
                          value={customerFormData.firstName}
                          onChange={handleCustomerInputChange}
                          placeholder="Enter your first name"
                          className="h-12 text-base"
                          required
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="customerLastName" className="text-base font-semibold flex items-center gap-2">
                          <User className="w-4 h-4" />
                          Last Name *
                        </Label>
                        <Input
                          id="customerLastName"
                          name="lastName"
                          value={customerFormData.lastName}
                          onChange={handleCustomerInputChange}
                          placeholder="Enter your last name"
                          className="h-12 text-base"
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="customerEmail" className="text-base font-semibold flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        Email Address *
                      </Label>
                      <Input
                        id="customerEmail"
                        name="email"
                        type="email"
                        value={customerFormData.email}
                        onChange={handleCustomerInputChange}
                        placeholder="Enter your email address"
                        className="h-12 text-base"
                        required
                      />
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="customerPhone" className="text-base font-semibold flex items-center gap-2">
                          <Phone className="w-4 h-4" />
                          Phone Number
                        </Label>
                        <Input
                          id="customerPhone"
                          name="phone"
                          type="tel"
                          value={customerFormData.phone}
                          onChange={handleCustomerInputChange}
                          placeholder="(555) 123-4567"
                          className="h-12 text-base"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="customerCity" className="text-base font-semibold flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          City
                        </Label>
                        <Input
                          id="customerCity"
                          name="city"
                          value={customerFormData.city}
                          onChange={handleCustomerInputChange}
                          placeholder="Enter your city"
                          className="h-12 text-base"
                        />
                      </div>
                    </div>
                    
                    <div className="text-center pt-6">
                      <Button type="submit" variant="reward" size="lg" className="text-lg px-12 py-4 h-auto w-full">
                        Join Free - Start Earning Rewards!
                      </Button>
                    </div>
                  </form>
                </TabsContent>
                
                <TabsContent value="merchant">
                  <form onSubmit={handleMerchantSubmit} className="space-y-6">
                    <div className="text-center mb-6">
                      <h3 className="text-2xl font-bold text-foreground mb-2">Merchant Subscription</h3>
                      <p className="text-muted-foreground">Access premium tools and analytics</p>
                      <div className="inline-block bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-semibold mt-2">
                        Starting at $29/month
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="businessName" className="text-base font-semibold flex items-center gap-2">
                        <Store className="w-4 h-4" />
                        Business Name *
                      </Label>
                      <Input
                        id="businessName"
                        name="businessName"
                        value={merchantFormData.businessName}
                        onChange={handleMerchantInputChange}
                        placeholder="Enter your business name"
                        className="h-12 text-base"
                        required
                      />
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="merchantFirstName" className="text-base font-semibold flex items-center gap-2">
                          <User className="w-4 h-4" />
                          First Name *
                        </Label>
                        <Input
                          id="merchantFirstName"
                          name="firstName"
                          value={merchantFormData.firstName}
                          onChange={handleMerchantInputChange}
                          placeholder="Enter your first name"
                          className="h-12 text-base"
                          required
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="merchantLastName" className="text-base font-semibold flex items-center gap-2">
                          <User className="w-4 h-4" />
                          Last Name *
                        </Label>
                        <Input
                          id="merchantLastName"
                          name="lastName"
                          value={merchantFormData.lastName}
                          onChange={handleMerchantInputChange}
                          placeholder="Enter your last name"
                          className="h-12 text-base"
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="merchantEmail" className="text-base font-semibold flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        Email Address *
                      </Label>
                      <Input
                        id="merchantEmail"
                        name="email"
                        type="email"
                        value={merchantFormData.email}
                        onChange={handleMerchantInputChange}
                        placeholder="Enter your email address"
                        className="h-12 text-base"
                        required
                      />
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="merchantPhone" className="text-base font-semibold flex items-center gap-2">
                          <Phone className="w-4 h-4" />
                          Phone Number
                        </Label>
                        <Input
                          id="merchantPhone"
                          name="phone"
                          type="tel"
                          value={merchantFormData.phone}
                          onChange={handleMerchantInputChange}
                          placeholder="(555) 123-4567"
                          className="h-12 text-base"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="businessType" className="text-base font-semibold flex items-center gap-2">
                          <Store className="w-4 h-4" />
                          Business Type
                        </Label>
                        <Input
                          id="businessType"
                          name="businessType"
                          value={merchantFormData.businessType}
                          onChange={handleMerchantInputChange}
                          placeholder="e.g. Restaurant, Retail, Service"
                          className="h-12 text-base"
                        />
                      </div>
                    </div>
                    
                    <div className="text-center pt-6">
                      <Button type="submit" variant="hero" size="lg" className="text-lg px-12 py-4 h-auto w-full">
                        Start Merchant Subscription
                      </Button>
                    </div>
                  </form>
                </TabsContent>
              </Tabs>
              
              <p className="text-sm text-muted-foreground mt-6 text-center">
                By signing up, you agree to our Terms of Service and Privacy Policy.
              </p>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SignupSection;