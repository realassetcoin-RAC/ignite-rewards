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
    <section id="how-it-works" className="relative py-20 px-6 overflow-hidden">
      {/* Enhanced Dynamic Background matching hero */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 via-primary/10 to-purple-500/20">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-background/85 to-background/95" />
        
        {/* Animated Background Elements */}
        <div className="absolute top-32 right-32 w-80 h-80 bg-gradient-to-r from-blue-500/15 to-primary/15 rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-1000 pointer-events-none"></div>
        <div className="absolute bottom-32 left-32 w-64 h-64 bg-gradient-to-r from-primary/15 to-purple-500/15 rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-3000 pointer-events-none"></div>
        
        {/* Floating Particles */}
        <div className="absolute top-1/3 right-1/4 w-1.5 h-1.5 bg-blue-500/40 rounded-full animate-bounce animation-delay-2000"></div>
        <div className="absolute bottom-1/4 left-1/4 w-1 h-1 bg-primary/50 rounded-full animate-bounce animation-delay-4000"></div>
        <div className="absolute top-2/3 right-1/3 w-2 h-2 bg-purple-500/35 rounded-full animate-bounce animation-delay-6000"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold mb-6 text-foreground">
            How It{" "}
            <span className="bg-gradient-to-r from-blue-500 via-primary to-purple-500 bg-clip-text text-transparent animate-gradient-x-reverse">
              Works
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Getting started is simple. Follow these four easy steps to begin earning rewards today.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6">
          {steps.map((step, index) => (
            <div key={index} className="relative">
              <Card className="group p-8 bg-gradient-to-br from-background/60 to-background/30 backdrop-blur-md border border-blue-500/20 hover:border-blue-500/40 text-center relative z-10 transition-all duration-500 transform hover:scale-105 hover:shadow-xl">
                <div className="mb-6">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-r from-blue-500 to-primary flex items-center justify-center shadow-lg group-hover:shadow-xl mx-auto mb-4 transition-all duration-300">
                    <step.icon className="w-10 h-10 text-white group-hover:animate-bounce" />
                  </div>
                  <div className="text-6xl font-bold bg-gradient-to-r from-blue-500/30 to-primary/30 bg-clip-text text-transparent absolute top-4 right-6">
                    {step.step}
                  </div>
                </div>
                
                <h3 className="text-2xl font-bold mb-4 text-foreground group-hover:bg-gradient-to-r group-hover:from-blue-500 group-hover:to-primary group-hover:bg-clip-text group-hover:text-transparent transition-all duration-300">
                  {step.title}
                </h3>
                
                <p className="text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              </Card>
              
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-1/2 -right-6 lg:-right-12 transform -translate-y-1/2 z-0">
                  <div className="w-8 lg:w-16 h-px bg-gradient-to-r from-blue-500 to-primary"></div>
                  <div className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-500 to-primary absolute right-0 top-1/2 transform translate-x-1/2 -translate-y-1/2 animate-pulse"></div>
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