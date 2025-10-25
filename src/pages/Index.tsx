import EnhancedHeroSection from "@/components/EnhancedHeroSection";
import BenefitsSection from "@/components/BenefitsSection";
import HowItWorksSection from "@/components/HowItWorksSection";
import PrivacySection from "@/components/PrivacySection";
import Footer from "@/components/Footer";
import AdminAccess from "@/components/AdminAccess";
import FloatingMenubar from "@/components/FloatingMenubar";

const Index = () => {
  return (
    <div className="min-h-screen">
      <FloatingMenubar />
      <header>
        <EnhancedHeroSection />
      </header>
      <main>
        <BenefitsSection />
        <HowItWorksSection />
        <PrivacySection />
      </main>
      <Footer />
      <AdminAccess />
    </div>
  );
};

export default Index;