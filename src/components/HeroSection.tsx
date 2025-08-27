import { Button } from "@/components/ui/button";
import heroImage from "@/assets/hero-rewards.jpg";

const HeroSection = () => {
  return (
    <section className="relative overflow-hidden">
      <div 
        className="absolute inset-0 opacity-10 bg-cover bg-center"
        style={{ backgroundImage: `url(${heroImage})` }}
      />
      <div className="hero-gradient absolute inset-0 opacity-90" />
      
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-24 lg:py-32">
        <div className="text-center text-white">
          <h1 className="text-5xl lg:text-7xl font-bold mb-6 leading-tight">
            Earn Rewards
            <span className="block text-reward-gold">Every Step</span>
          </h1>
          
          <p className="text-xl lg:text-2xl mb-8 max-w-3xl mx-auto opacity-90 leading-relaxed">
            Join our exclusive loyalty network and unlock amazing rewards, exclusive deals, 
            and VIP experiences. It's completely free to start earning today!
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button variant="reward" size="lg" className="text-lg px-8 py-4 h-auto">
              Join Free Now
            </Button>
            <Button variant="outline" size="lg" className="text-lg px-8 py-4 h-auto border-white/30 text-white hover:bg-white/10">
              Learn More
            </Button>
          </div>
          
          <div className="mt-12 grid grid-cols-3 gap-8 max-w-2xl mx-auto">
            <div className="text-center">
              <div className="text-3xl font-bold text-reward-gold">50K+</div>
              <div className="text-sm opacity-80">Active Members</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-reward-gold">$2M+</div>
              <div className="text-sm opacity-80">Rewards Earned</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-reward-gold">500+</div>
              <div className="text-sm opacity-80">Partner Stores</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;