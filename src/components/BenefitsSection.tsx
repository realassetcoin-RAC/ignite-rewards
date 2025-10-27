import { Card } from "@/components/ui/card";
import { Shield, Globe, Clock, Eye, Lock, Coins } from "lucide-react";

const benefits = [
  {
    icon: Shield,
    title: "Complete Privacy",
    description: "No phone numbers, no email addresses, no personal data collection. Your identity stays completely anonymous while you earn rewards."
  },
  {
    icon: Globe,
    title: "Global & Mobile",
    description: "Use your loyalty card anywhere in the world. No boundaries, no restrictions. Your rewards travel with you wherever you go."
  },
  {
    icon: Clock,
    title: "30-Day Vesting",
    description: "Earn notional rewards immediately, but they vest over 30 days. This protects against cancellations while giving you time to see your earnings grow."
  },
  {
    icon: Eye,
    title: "Points Never Expire",
    description: "Unlike traditional loyalty programs, your rewards never expire. They accumulate forever and can be claimed anytime after vesting."
  },
  {
    icon: Lock,
    title: "Saving Mindset",
    description: "For non-custodial users, rewards automatically invest in fractional real-world assets, building your wealth while you shop."
  },
  {
    icon: Coins,
    title: "Redeem as Cash",
    description: "Convert your vested rewards to cash, invest in assets, or use at partner merchants. Multiple redemption options with bonus benefits."
  }
];

const BenefitsSection = () => {
  return (
    <section id="benefits" className="relative py-20 px-6 overflow-hidden">
      {/* Enhanced Dynamic Background matching hero */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-purple-500/10 to-blue-500/20">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-background/80 to-background/95" />
        
        {/* Animated Background Elements */}
        <div className="absolute top-20 left-20 w-72 h-72 bg-gradient-to-r from-primary/15 to-purple-500/15 rounded-full mix-blend-multiply filter blur-xl animate-pulse pointer-events-none"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-gradient-to-r from-purple-500/15 to-blue-500/15 rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-2000 pointer-events-none"></div>
        
        {/* Floating Particles */}
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-primary/30 rounded-full animate-bounce animation-delay-1000"></div>
        <div className="absolute top-1/3 right-1/3 w-1 h-1 bg-purple-500/40 rounded-full animate-bounce animation-delay-3000"></div>
        <div className="absolute bottom-1/3 left-1/3 w-1.5 h-1.5 bg-blue-500/35 rounded-full animate-bounce animation-delay-5000"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold mb-6 text-foreground">
            Why Choose{" "}
            <span className="bg-gradient-to-r from-primary via-purple-500 to-blue-500 bg-clip-text text-transparent animate-gradient-x">
              Privacy-First Loyalty?
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            The world's first truly private loyalty program. No data collection, no tracking, no spam. 
            Just pure rewards that vest in 30 days and never expire.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {benefits.map((benefit, index) => (
            <Card key={index} className="group p-8 bg-gradient-to-br from-background/60 to-background/30 backdrop-blur-md border border-primary/20 hover:border-primary/40 transition-all duration-500 transform hover:scale-105 hover:shadow-xl">
              <div className="flex items-center space-x-6 mb-6">
                <div className="w-16 h-16 rounded-full bg-gradient-to-r from-primary to-purple-500 flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 flex-shrink-0">
                  <benefit.icon className="w-8 h-8 text-white group-hover:animate-pulse" />
                </div>
                
                <h3 className="text-2xl font-bold text-foreground group-hover:bg-gradient-to-r group-hover:from-primary group-hover:to-purple-500 group-hover:bg-clip-text group-hover:text-transparent transition-all duration-300">
                  {benefit.title}
                </h3>
              </div>
              
              <p className="text-muted-foreground leading-relaxed">
                {benefit.description}
              </p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BenefitsSection;