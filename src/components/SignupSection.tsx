import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import CustomerSignupModal from "@/components/CustomerSignupModal";
import MerchantSignupModal from "@/components/MerchantSignupModal";
import { Users, Store, CreditCard, Building2 } from "lucide-react";

/**
 * Signup section component that provides entry points for customer and merchant registration
 * Now uses popup modals for the actual signup flows instead of inline forms
 * @returns {JSX.Element} The signup section component
 */
const SignupSection = () => {
  // Modal state management
  const [customerModalOpen, setCustomerModalOpen] = useState(false);
  const [merchantModalOpen, setMerchantModalOpen] = useState(false);

  return (
    <section id="signup" className="py-20 px-6 mb-16 bg-reward-light">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold mb-6 text-foreground">
            Join <span className="text-primary">PointBridge</span> Today
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Choose your path to start earning $RAC tokens and unlock the power of our decentralized rewards ecosystem.
          </p>
        </div>

        {/* Enhanced Signup Cards with Modal Triggers */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Customer Signup Card */}
          <Card className="p-8 cursor-pointer transition-all duration-300 border-2 border-border hover:border-primary/50 bg-card hover:bg-primary/5 card-shadow group">
            <div className="text-center space-y-6">
              <div className="w-20 h-20 mx-auto rounded-full bg-primary/10 group-hover:bg-primary/20 flex items-center justify-center transition-colors">
                <CreditCard className="w-10 h-10 text-primary" />
              </div>
              
              <div>
                <h3 className="text-2xl font-bold mb-3 text-foreground">Join as Customer</h3>
                <p className="text-muted-foreground mb-6 leading-relaxed">
                  Choose your virtual card, earn $RAC tokens, and unlock exclusive rewards 
                  from our partner merchants worldwide.
                </p>
              </div>
              
              <div className="space-y-3 text-sm text-muted-foreground">
                <div className="flex items-center justify-center gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <span>Free & Premium card options</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <span>Earn tokens with every purchase</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <span>Access exclusive merchant rewards</span>
                </div>
              </div>
              
              <Button 
                variant="hero" 
                size="lg" 
                className="w-full text-lg py-6 font-semibold"
                onClick={() => setCustomerModalOpen(true)}
              >
                Get Your Card
              </Button>
            </div>
          </Card>

          {/* Merchant Signup Card */}
          <Card className="p-8 cursor-pointer transition-all duration-300 border-2 border-border hover:border-primary/50 bg-card hover:bg-primary/5 card-shadow group">
            <div className="text-center space-y-6">
              <div className="w-20 h-20 mx-auto rounded-full bg-primary/10 group-hover:bg-primary/20 flex items-center justify-center transition-colors">
                <Building2 className="w-10 h-10 text-primary" />
              </div>
              
              <div>
                <h3 className="text-2xl font-bold mb-3 text-foreground">Partner with Us</h3>
                <p className="text-muted-foreground mb-6 leading-relaxed">
                  Join our merchant network, attract loyal customers, and grow your business 
                  with our innovative rewards platform.
                </p>
              </div>
              
              <div className="space-y-3 text-sm text-muted-foreground">
                <div className="flex items-center justify-center gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <span>Multiple subscription tiers</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <span>Advanced analytics & insights</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <span>Custom branding options</span>
                </div>
              </div>
              
              <Button 
                variant="outline" 
                size="lg" 
                className="w-full text-lg py-6 font-semibold border-primary/40 text-primary hover:bg-primary/10"
                onClick={() => setMerchantModalOpen(true)}
              >
                Start Partnership
              </Button>
            </div>
          </Card>
        </div>

        {/* Additional Information Section */}
        <div className="mt-16 text-center">
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Join thousands of customers and hundreds of merchants already earning and saving with PointBridge. 
            Our decentralized rewards ecosystem is transforming how loyalty programs work.
          </p>
        </div>

        {/* Signup Modals */}
        <CustomerSignupModal 
          isOpen={customerModalOpen} 
          onClose={() => setCustomerModalOpen(false)} 
        />
        <MerchantSignupModal 
          isOpen={merchantModalOpen} 
          onClose={() => setMerchantModalOpen(false)} 
        />
      </div>
    </section>
  );
};

export default SignupSection;