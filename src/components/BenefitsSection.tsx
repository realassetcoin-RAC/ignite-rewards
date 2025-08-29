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
    <section className="py-20 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold mb-6 text-foreground">
            Why Join Our <span className="text-primary">Loyalty Network?</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Discover the power of being a true stakeholder in our community. Our network is more than a simple rewards program; it's a way to unlock lasting value and influence.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {benefits.map((benefit, index) => (
            <Card key={index} className="p-8 card-gradient card-shadow transition-smooth hover:scale-105 border-0">
              <div className="mb-6">
                <div className="w-16 h-16 rounded-full hero-gradient flex items-center justify-center glow-shadow">
                  <benefit.icon className="w-8 h-8 text-white" />
                </div>
              </div>
              
              <h3 className="text-2xl font-bold mb-4 text-foreground">
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