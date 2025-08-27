import { Card } from "@/components/ui/card";
import { UserPlus, ShoppingBag, Trophy } from "lucide-react";

const steps = [
  {
    icon: UserPlus,
    step: "01",
    title: "Sign Up Free",
    description: "Create your account in under 2 minutes. No hidden fees, no credit card required. Just your email and you're in!"
  },
  {
    icon: ShoppingBag,
    step: "02", 
    title: "Shop & Earn",
    description: "Make purchases at any of our 500+ partner locations or online. Every dollar spent earns you valuable reward points automatically."
  },
  {
    icon: Trophy,
    step: "03",
    title: "Redeem Rewards",
    description: "Use your points for discounts, free products, exclusive experiences, or cash back. The choice is yours!"
  }
];

const HowItWorksSection = () => {
  return (
    <section className="py-20 px-6 bg-reward-light">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold mb-6 text-foreground">
            How It <span className="text-primary">Works</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Getting started is simple. Follow these three easy steps to begin earning rewards today.
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
          {steps.map((step, index) => (
            <div key={index} className="relative">
              <Card className="p-8 card-gradient card-shadow border-0 text-center relative z-10">
                <div className="mb-6">
                  <div className="w-20 h-20 rounded-full hero-gradient flex items-center justify-center glow-shadow mx-auto mb-4">
                    <step.icon className="w-10 h-10 text-white" />
                  </div>
                  <div className="text-6xl font-bold text-primary/20 absolute top-4 right-6">
                    {step.step}
                  </div>
                </div>
                
                <h3 className="text-2xl font-bold mb-4 text-foreground">
                  {step.title}
                </h3>
                
                <p className="text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              </Card>
              
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-1/2 -right-6 lg:-right-12 transform -translate-y-1/2 z-0">
                  <div className="w-8 lg:w-16 h-px accent-gradient"></div>
                  <div className="w-3 h-3 rounded-full bg-primary absolute right-0 top-1/2 transform translate-x-1/2 -translate-y-1/2"></div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;