import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  Shield, 
  Eye, 
  EyeOff, 
  Lock, 
  Globe, 
  Clock, 
  Coins, 
  CheckCircle,
  ArrowRight,
  Download,
  QrCode,
  Smartphone
} from "lucide-react";

interface PrivacyFirstSignupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PrivacyFirstSignupModal: React.FC<PrivacyFirstSignupModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedType, setSelectedType] = useState<'custodial' | 'non-custodial' | null>(null);
  const { toast } = useToast();

  const steps = [
    {
      id: 1,
      title: "Choose Your Privacy Level",
      description: "Select how you want to interact with our loyalty system"
    },
    {
      id: 2,
      title: "Get Your Anonymous Card",
      description: "Download the app and get your privacy-first loyalty card"
    },
    {
      id: 3,
      title: "Start Earning",
      description: "Begin earning notional rewards that vest in 30 days"
    }
  ];

  const userTypes = [
    {
      type: 'custodial' as const,
      title: "Crypto-Savvy User",
      subtitle: "Full Control & Privacy",
      icon: Lock,
      description: "For users familiar with blockchain and crypto",
      features: [
        "Own your NFT loyalty card",
        "Full control over rewards",
        "Can trade/sell your NFT",
        "Direct wallet integration",
        "Higher reward rates"
      ],
      color: "from-blue-500 to-purple-500"
    },
    {
      type: 'non-custodial' as const,
      title: "Traditional User",
      subtitle: "Simple & Private",
      icon: Shield,
      description: "For users who want simplicity without crypto knowledge",
      features: [
        "No crypto knowledge needed",
        "Automatic investment in real assets",
        "Forced savings mindset",
        "Traditional user experience",
        "Fractional ownership of assets"
      ],
      color: "from-green-500 to-blue-500"
    }
  ];

  const handleTypeSelection = (type: 'custodial' | 'non-custodial') => {
    setSelectedType(type);
    setCurrentStep(2);
  };

  const handleDownload = () => {
    toast({
      title: "App Download",
      description: "Redirecting to app store...",
    });
    // In a real implementation, this would redirect to the app store
    setCurrentStep(3);
  };

  const handleStartEarning = () => {
    toast({
      title: "Welcome to Privacy-First Loyalty!",
      description: "Your anonymous loyalty card is ready. Start earning rewards today!",
    });
    onClose();
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold mb-2">Choose Your Privacy Level</h3>
        <p className="text-muted-foreground">
          Both options provide complete privacy - no personal data collection
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {userTypes.map((userType) => (
          <Card 
            key={userType.type}
            className="group cursor-pointer border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-lg"
            onClick={() => handleTypeSelection(userType.type)}
          >
            <CardContent className="p-6">
              <div className="text-center space-y-4">
                <div className={`w-16 h-16 rounded-full bg-gradient-to-r ${userType.color} flex items-center justify-center shadow-lg mx-auto group-hover:scale-110 transition-transform`}>
                  <userType.icon className="w-8 h-8 text-white" />
                </div>
                
                <div>
                  <h4 className="text-xl font-bold mb-1">{userType.title}</h4>
                  <p className="text-sm text-muted-foreground mb-3">{userType.subtitle}</p>
                  <p className="text-sm text-muted-foreground">{userType.description}</p>
                </div>

                <div className="space-y-2">
                  {userType.features.map((feature, index) => (
                    <div key={index} className="flex items-center text-sm">
                      <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>

                <Button 
                  className="w-full bg-gradient-to-r from-primary to-purple-500 hover:from-primary/90 hover:to-purple-500/90 transform hover:scale-105 transition-all duration-300"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleTypeSelection(userType.type);
                  }}
                >
                  Choose This Option
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <Shield className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-semibold text-green-700 mb-1">Privacy Guaranteed</h4>
            <p className="text-sm text-green-600">
              Both options provide complete anonymity. No phone numbers, no email addresses, 
              no personal data collection. Your privacy is our core principle.
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold mb-2">Get Your Anonymous Card</h3>
        <p className="text-muted-foreground">
          Download our app and get your privacy-first loyalty card instantly
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="p-6">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center shadow-lg mx-auto">
              <Download className="w-8 h-8 text-white" />
            </div>
            <h4 className="text-xl font-bold">Download App</h4>
            <p className="text-muted-foreground">
              Get our mobile app from the App Store or Google Play
            </p>
            <Button 
              className="w-full bg-gradient-to-r from-primary to-purple-500 hover:from-primary/90 hover:to-purple-500/90 transform hover:scale-105 transition-all duration-300"
              onClick={handleDownload}
            >
              Download Now
            </Button>
          </div>
        </Card>

        <Card className="p-6">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-r from-green-500 to-blue-500 flex items-center justify-center shadow-lg mx-auto">
              <QrCode className="w-8 h-8 text-white" />
            </div>
            <h4 className="text-xl font-bold">Get Your Card</h4>
            <p className="text-muted-foreground">
              Instantly receive your anonymous loyalty card with QR code
            </p>
            <div className="bg-gray-100 rounded-lg p-4">
              <div className="w-24 h-24 bg-gray-300 rounded mx-auto flex items-center justify-center">
                <QrCode className="w-12 h-12 text-gray-500" />
              </div>
            </div>
          </div>
        </Card>
      </div>

      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <Smartphone className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-semibold text-blue-700 mb-1">Mobile & Global</h4>
            <p className="text-sm text-blue-600">
              Your loyalty card works anywhere in the world. No boundaries, no restrictions. 
              Just scan and earn rewards.
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold mb-2">Start Earning Rewards</h3>
        <p className="text-muted-foreground">
          Your privacy-first loyalty card is ready. Here's how it works:
        </p>
      </div>

      <div className="space-y-4">
        <Card className="p-6">
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-green-500 to-blue-500 flex items-center justify-center shadow-lg flex-shrink-0">
              <Globe className="w-6 h-6 text-white" />
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-2">Shop Anywhere</h4>
              <p className="text-muted-foreground">
                Scan your QR code at any merchant worldwide. No boundaries, no restrictions.
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center shadow-lg flex-shrink-0">
              <Eye className="w-6 h-6 text-white" />
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-2">Earn Notional Rewards</h4>
              <p className="text-muted-foreground">
                See your rewards immediately in your dashboard. They're notional until they vest.
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center shadow-lg flex-shrink-0">
              <Clock className="w-6 h-6 text-white" />
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-2">30-Day Vesting</h4>
              <p className="text-muted-foreground">
                Your rewards vest over 30 days. This protects against cancellations while you see them grow.
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-pink-500 to-red-500 flex items-center justify-center shadow-lg flex-shrink-0">
              <Coins className="w-6 h-6 text-white" />
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-2">Claim & Redeem</h4>
              <p className="text-muted-foreground">
                After 30 days, claim your rewards as cash, invest in assets, or use at partner merchants.
              </p>
            </div>
          </div>
        </Card>
      </div>

      <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <Shield className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-semibold text-green-700 mb-1">Complete Privacy</h4>
            <p className="text-sm text-green-600">
              No personal data collection, no tracking, no spam. Your identity stays completely anonymous.
            </p>
          </div>
        </div>
      </div>

      <Button 
        className="w-full bg-gradient-to-r from-primary to-purple-500 hover:from-primary/90 hover:to-purple-500/90 transform hover:scale-105 transition-all duration-300"
        onClick={handleStartEarning}
      >
        Start Earning Rewards
        <ArrowRight className="w-4 h-4 ml-2" />
      </Button>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <Shield className="w-6 h-6 text-green-500" />
              <span>Privacy-First Loyalty Program</span>
            </div>
            <p className="text-sm text-muted-foreground font-normal">
              No personal data collection • Complete anonymity • 30-day vesting
            </p>
          </DialogTitle>
        </DialogHeader>

        {/* Progress Steps */}
        <div className="flex items-center justify-center space-x-4 mb-8">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                currentStep >= step.id 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-muted text-muted-foreground'
              }`}>
                {step.id}
              </div>
              {index < steps.length - 1 && (
                <div className={`w-8 h-px mx-2 ${
                  currentStep > step.id ? 'bg-primary' : 'bg-muted'
                }`} />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}

        {/* Navigation */}
        {currentStep > 1 && (
          <div className="flex justify-between pt-4 border-t">
            <Button 
              variant="outline" 
              onClick={() => setCurrentStep(currentStep - 1)}
            >
              Back
            </Button>
            <div className="text-sm text-muted-foreground">
              Step {currentStep} of {steps.length}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PrivacyFirstSignupModal;
