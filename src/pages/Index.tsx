import EnhancedHeroSection from "@/components/EnhancedHeroSection";
import BenefitsSection from "@/components/BenefitsSection";
import HowItWorksSection from "@/components/HowItWorksSection";
import SignupSection from "@/components/SignupSection";
import Footer from "@/components/Footer";
import AdminAccess from "@/components/AdminAccess";

const Index = () => {
  return (
    <div className="min-h-screen">
      <header>
        <EnhancedHeroSection />
      </header>
      <main>
        <BenefitsSection />
        <HowItWorksSection />
        <SignupSection />
      </main>
      <Footer />
      <AdminAccess />
    </div>
  );
};

export default Index;