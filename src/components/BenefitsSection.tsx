import { Card } from "@/components/ui/card";
import { Gift, Star, Crown, Zap, Heart, Award } from "lucide-react";

const benefits = [
  {
    icon: Gift,
    title: "Instant Rewards",
    description: "Earn points on every purchase and redeem them instantly for discounts, products, and exclusive experiences."
  },
  {
    icon: Star,
    title: "Exclusive Deals",
    description: "Access member-only promotions, early bird specials, and limited-time offers before anyone else."
  },
  {
    icon: Crown,
    title: "VIP Treatment",
    description: "Enjoy priority customer service, faster checkout, and personalized recommendations just for you."
  },
  {
    icon: Zap,
    title: "Bonus Points",
    description: "Double and triple point events, birthday bonuses, and surprise reward multipliers throughout the year."
  },
  {
    icon: Heart,
    title: "Partner Network",
    description: "Earn and spend rewards across hundreds of partner stores, restaurants, and service providers."
  },
  {
    icon: Award,
    title: "Tier Benefits",
    description: "Level up to unlock premium perks including free shipping, extended returns, and exclusive products."
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
            Discover the incredible benefits waiting for you as a member of our exclusive rewards community.
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