import { Card } from "@/components/ui/card";
import { Users, DollarSign, Vote, Gem, Network } from "lucide-react";

const benefits = [
  {
    icon: Users,
    title: "Become a Stakeholder",
    description: "Earn $RAC tokens for your engagement and participation, transforming your purchases into a direct stake in our ecosystem."
  },
  {
    icon: DollarSign,
    title: "Unlock Passive Income",
    description: "By locking your $RAC tokens, you can participate in a variety of programs and earn passive income over time, providing a clear return on your long-term commitment."
  },
  {
    icon: Vote,
    title: "Shape the Future",
    description: "Your locked tokens give you voting power on new proposals, empowering you to help shape the direction and decisions of our DAO."
  },
  {
    icon: Gem,
    title: "Invest in Exclusive Assets",
    description: "Gain the opportunity to invest in unique custodial and non-custodial NFTs, earning passive income or fractional ownership of valuable assets."
  },
  {
    icon: Network,
    title: "Collaborate & Grow",
    description: "Join a network of like-minded individuals, and collectively build and grow the value of our community."
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
            Why Join Our{" "}
            <span className="bg-gradient-to-r from-primary via-purple-500 to-blue-500 bg-clip-text text-transparent animate-gradient-x">
              Loyalty Network?
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Discover the power of being a true stakeholder in our community. Our network is more than a simple rewards program; it's a way to unlock lasting value and influence.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {benefits.map((benefit, index) => (
            <Card key={index} className="group p-8 bg-gradient-to-br from-background/60 to-background/30 backdrop-blur-md border border-primary/20 hover:border-primary/40 transition-all duration-500 transform hover:scale-105 hover:shadow-xl">
              <div className="mb-6">
                <div className="w-16 h-16 rounded-full bg-gradient-to-r from-primary to-purple-500 flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300">
                  <benefit.icon className="w-8 h-8 text-white group-hover:animate-pulse" />
                </div>
              </div>
              
              <h3 className="text-2xl font-bold mb-4 text-foreground group-hover:bg-gradient-to-r group-hover:from-primary group-hover:to-purple-500 group-hover:bg-clip-text group-hover:text-transparent transition-all duration-300">
                {benefit.title}
              </h3>
              
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