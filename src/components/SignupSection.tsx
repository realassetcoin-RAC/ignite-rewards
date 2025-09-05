import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import CustomerSignupModal from "./CustomerSignupModal";
import MerchantSignupModal from "./MerchantSignupModal";
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
    <section id="signup" className="relative py-20 px-6 mb-16 overflow-hidden">
      {/* Enhanced Dynamic Background matching hero */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 via-blue-500/10 to-primary/20">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-background/80 to-background/95" />
        
        {/* Animated Background Elements */}
        <div className="absolute top-20 left-20 w-96 h-96 bg-gradient-to-r from-purple-500/15 to-blue-500/15 rounded-full mix-blend-multiply filter blur-xl animate-pulse pointer-events-none"></div>
        <div className="absolute bottom-20 right-20 w-80 h-80 bg-gradient-to-r from-blue-500/15 to-primary/15 rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-2000 pointer-events-none"></div>
        
        {/* Floating Particles */}
        <div className="absolute top-1/4 right-1/4 w-2 h-2 bg-purple-500/40 rounded-full animate-bounce animation-delay-1000"></div>
        <div className="absolute bottom-1/3 left-1/3 w-1.5 h-1.5 bg-blue-500/35 rounded-full animate-bounce animation-delay-3000"></div>
        <div className="absolute top-2/3 right-1/3 w-1 h-1 bg-primary/45 rounded-full animate-bounce animation-delay-5000"></div>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold mb-6 text-foreground">
            Join{" "}
            <span className="bg-gradient-to-r from-purple-500 via-blue-500 to-primary bg-clip-text text-transparent animate-gradient-x">
              PointBridge
            </span>{" "}
            Today
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Choose your path to start earning $RAC tokens and unlock the power of our decentralized rewards ecosystem.
          </p>
        </div>

        {/* Enhanced Signup Cards with Modal Triggers */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Customer Signup Card */}
          <Card className="group p-8 cursor-pointer bg-gradient-to-br from-background/60 to-background/30 backdrop-blur-md border border-primary/20 hover:border-primary/50 transition-all duration-500 transform hover:scale-105 hover:shadow-xl">
            <div className="text-center space-y-6">
              <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-r from-primary to-purple-500 flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300">
                <CreditCard className="w-10 h-10 text-white group-hover:animate-pulse" />
              </div>
              
              <div>
                <h3 className="text-2xl font-bold mb-3 text-foreground group-hover:bg-gradient-to-r group-hover:from-primary group-hover:to-purple-500 group-hover:bg-clip-text group-hover:text-transparent transition-all duration-300">Join as Customer</h3>
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
                size="lg" 
                className="w-full text-lg py-6 font-semibold bg-gradient-to-r from-primary to-purple-500 hover:from-primary/90 hover:to-purple-500/90 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                onClick={() => setCustomerModalOpen(true)}
              >
                Get Your Card
              </Button>
            </div>
          </Card>

          {/* Merchant Signup Card */}
          <Card className="group p-8 cursor-pointer bg-gradient-to-br from-background/60 to-background/30 backdrop-blur-md border border-blue-500/20 hover:border-blue-500/50 transition-all duration-500 transform hover:scale-105 hover:shadow-xl">
            <div className="text-center space-y-6">
              <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-r from-blue-500 to-primary flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300">
                <Building2 className="w-10 h-10 text-white group-hover:animate-pulse" />
              </div>
              
              <div>
                <h3 className="text-2xl font-bold mb-3 text-foreground group-hover:bg-gradient-to-r group-hover:from-blue-500 group-hover:to-primary group-hover:bg-clip-text group-hover:text-transparent transition-all duration-300">Partner with Us</h3>
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
                className="w-full text-lg py-6 font-semibold border-blue-500/50 text-blue-500 hover:bg-gradient-to-r hover:from-blue-500/10 hover:to-primary/10 hover:border-blue-500/70 transition-all duration-300 transform hover:scale-105"
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