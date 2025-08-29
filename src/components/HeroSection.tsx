import { Button } from "@/components/ui/button";
import heroImage from "@/assets/hero-rewards.jpg";
import pointbridgeLogo from "@/assets/pointbridge-logo.png";

const HeroSection = () => {
  return (
    <section className="relative overflow-hidden">
      <div 
        className="absolute inset-0 opacity-10 bg-cover bg-center"
        style={{ backgroundImage: `url(${heroImage})` }}
      />
      <div className="hero-gradient absolute inset-0 opacity-90" />
      
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-16 lg:py-24">
        <div className="text-center text-white">
          <div className="flex items-center justify-center mb-8">
            <div className="bg-black/20 backdrop-blur-sm rounded-2xl p-4 mr-4">
              <img 
                src={pointbridgeLogo} 
                alt="PointBridge Logo" 
                className="h-12 lg:h-16"
              />
            </div>
            <h1 className="text-4xl lg:text-6xl font-bold leading-tight">
              <span className="text-primary">Point</span>Bridge
            </h1>
          </div>
          
          <h2 className="text-2xl lg:text-4xl font-bold mb-6 leading-tight">
            The Future of Value
            <span className="block text-primary">Is Here</span>
          </h2>
          
          <p className="text-xl lg:text-2xl mb-8 max-w-4xl mx-auto opacity-90 leading-relaxed">
            Join our decentralized rewards ecosystem where your engagement earns $RAC tokens, 
            unlock passive income opportunities, and become a stakeholder in the future of loyalty programs.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button variant="hero" size="lg" className="text-lg px-8 py-4 h-auto">
              Start Earning $RAC
            </Button>
            <Button variant="outline" size="lg" className="text-lg px-8 py-4 h-auto border-primary/30 text-primary hover:bg-primary/10">
              Learn More
            </Button>
          </div>
          
          <div className="mt-12 grid grid-cols-3 gap-8 max-w-2xl mx-auto">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">50K+</div>
              <div className="text-sm opacity-80">Active Stakeholders</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">$2M+</div>
              <div className="text-sm opacity-80">$RAC Tokens Earned</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">500+</div>
              <div className="text-sm opacity-80">Partner Merchants</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;