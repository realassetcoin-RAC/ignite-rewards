import { Card } from "@/components/ui/card";
import { UserPlus, ShoppingBag, Trophy, Lock } from "lucide-react";

const steps = [
  {
    icon: UserPlus,
    step: "01",
    title: "Sign Up Free",
    description: "Users can get started without any initial cost. The program is designed for seamless, free onboarding to encourage widespread adoption and participation."
  },
  {
    icon: ShoppingBag,
    step: "02", 
    title: "Shop & Earn",
    description: "Participants can engage in activities, such as shopping on an affiliated platform, to earn the governance token, $RAC. This system incentivizes engagement and provides a clear path to gaining influence within the DAO."
  },
  {
    icon: Lock,
    step: "03",
    title: "Lock Against a Program",
    description: "With their earned $RAC tokens, users can lock them within one of the program's offerings. This action demonstrates long-term commitment and grants them specific benefits, such as voting power or eligibility for passive income."
  },
  {
    icon: Trophy,
    step: "04",
    title: "Redeem Over Time to Unlock Value",
    description: "As tokens remain locked, users can progressively redeem or unlock value from their commitment. This can take the form of passive income distributions, fractional ownership of NFTs, or other rewards, ensuring a clear return on their long-term participation."
  }
];

const HowItWorksSection = () => {
  return (
    <section id="how-it-works" className="py-20 px-6 bg-reward-light">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold mb-6 text-foreground">
            How It <span className="text-primary">Works</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Getting started is simple. Follow these four easy steps to begin earning rewards today.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6">
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