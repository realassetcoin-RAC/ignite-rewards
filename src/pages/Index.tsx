import HeroSection from "@/components/HeroSection";
import BenefitsSection from "@/components/BenefitsSection";
import HowItWorksSection from "@/components/HowItWorksSection";
import SignupSection from "@/components/SignupSection";
import Footer from "@/components/Footer";
import AdminAccess from "@/components/AdminAccess";

const Index = () => {
  return (
    <div className="min-h-screen">
      <header>
        <HeroSection />
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