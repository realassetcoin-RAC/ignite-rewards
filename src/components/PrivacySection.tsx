import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Shield, 
  EyeOff, 
  Lock, 
  Globe, 
  X, 
  CheckCircle,
  AlertTriangle,
  Users,
  Database,
  Mail,
  Phone
} from "lucide-react";

const privacyFeatures = [
  {
    icon: EyeOff,
    title: "No Personal Data Collection",
    description: "We don't collect phone numbers, email addresses, names, or any personal information. Your identity stays completely anonymous.",
    status: "protected"
  },
  {
    icon: Lock,
    title: "Anonymous Transactions",
    description: "All transactions are processed anonymously. We only track reward amounts, never your personal details or purchase history.",
    status: "protected"
  },
  {
    icon: Globe,
    title: "No Cross-Merchant Tracking",
    description: "Your shopping patterns aren't tracked across different merchants. Each transaction is isolated and private.",
    status: "protected"
  },
  {
    icon: Shield,
    title: "Zero-Knowledge Proofs",
    description: "Advanced cryptography ensures you can prove eligibility for rewards without revealing your identity.",
    status: "protected"
  }
];

const traditionalVsPrivacy = [
  {
    traditional: {
      icon: Phone,
      title: "Requires Phone Numbers",
      description: "Traditional loyalty programs demand your phone number for verification and marketing."
    },
    privacy: {
      icon: X,
      title: "No Phone Numbers",
      description: "We never ask for or store your phone number. Complete anonymity guaranteed."
    }
  },
  {
    traditional: {
      icon: Mail,
      title: "Collects Email Addresses",
      description: "Your email is collected and used for marketing, newsletters, and data sharing."
    },
    privacy: {
      icon: X,
      title: "No Email Collection",
      description: "No email addresses required or stored. No spam, no marketing emails."
    }
  },
  {
    traditional: {
      icon: Database,
      title: "Tracks Purchase History",
      description: "Every purchase is tracked, analyzed, and used for targeted advertising."
    },
    privacy: {
      icon: EyeOff,
      title: "No Purchase Tracking",
      description: "We only track reward amounts, never what you buy or where you shop."
    }
  },
  {
    traditional: {
      icon: Users,
      title: "Shares Data with Partners",
      description: "Your data is sold to third parties, advertisers, and marketing companies."
    },
    privacy: {
      icon: Lock,
      title: "No Data Sharing",
      description: "Your data never leaves our system. No third-party access, no data selling."
    }
  }
];

const PrivacySection = () => {
  return (
    <section id="privacy" className="relative py-20 px-6 overflow-hidden">
      {/* Enhanced Dynamic Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-green-500/20 via-blue-500/10 to-purple-500/20">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-background/85 to-background/95" />
        
        {/* Animated Background Elements */}
        <div className="absolute top-20 left-20 w-72 h-72 bg-gradient-to-r from-green-500/15 to-blue-500/15 rounded-full mix-blend-multiply filter blur-xl animate-pulse pointer-events-none"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-gradient-to-r from-blue-500/15 to-purple-500/15 rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-2000 pointer-events-none"></div>
        
        {/* Floating Particles */}
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-green-500/30 rounded-full animate-bounce animation-delay-1000"></div>
        <div className="absolute top-1/3 right-1/3 w-1 h-1 bg-blue-500/40 rounded-full animate-bounce animation-delay-3000"></div>
        <div className="absolute bottom-1/3 left-1/3 w-1.5 h-1.5 bg-purple-500/35 rounded-full animate-bounce animation-delay-5000"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <Badge variant="secondary" className="mb-4 bg-green-500/10 text-green-600 border-green-500/20">
            <Shield className="h-3 w-3 mr-1" />
            Privacy by Design
          </Badge>
          <h2 className="text-4xl lg:text-5xl font-bold mb-6 text-foreground">
            Your Privacy is{" "}
            <span className="bg-gradient-to-r from-green-500 via-blue-500 to-purple-500 bg-clip-text text-transparent animate-gradient-x">
              Sacred
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Unlike traditional loyalty programs that collect and sell your data, we built our system 
            with privacy at its core. No personal information, no tracking, no data sharing.
          </p>
        </div>

        {/* Privacy Features */}
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          {privacyFeatures.map((feature, index) => (
            <Card key={index} className="group p-8 bg-gradient-to-br from-background/60 to-background/30 backdrop-blur-md border border-green-500/20 hover:border-green-500/40 transition-all duration-500 transform hover:scale-105 hover:shadow-xl">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-green-500 to-blue-500 flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 flex-shrink-0">
                  <feature.icon className="w-6 h-6 text-white group-hover:animate-pulse" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-3 text-foreground group-hover:bg-gradient-to-r group-hover:from-green-500 group-hover:to-blue-500 group-hover:bg-clip-text group-hover:text-transparent transition-all duration-300">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>
                <Badge variant="secondary" className="bg-green-500/10 text-green-600 border-green-500/20">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Protected
                </Badge>
              </div>
            </Card>
          ))}
        </div>

        {/* Traditional vs Privacy Comparison */}
        <div className="mb-16">
          <h3 className="text-3xl font-bold text-center mb-12 text-foreground">
            Traditional vs{" "}
            <span className="bg-gradient-to-r from-green-500 to-blue-500 bg-clip-text text-transparent">
              Privacy-First
            </span>
          </h3>
          
          <div className="space-y-8">
            {traditionalVsPrivacy.map((comparison, index) => (
              <div key={index} className="grid md:grid-cols-2 gap-6">
                {/* Traditional */}
                <Card className="p-6 bg-gradient-to-br from-red-500/10 to-red-500/5 border border-red-500/20">
                  <div className="flex items-start space-x-4">
                    <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
                      <comparison.traditional.icon className="w-5 h-5 text-red-500" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-lg font-semibold mb-2 text-red-600">
                        {comparison.traditional.title}
                      </h4>
                      <p className="text-muted-foreground text-sm">
                        {comparison.traditional.description}
                      </p>
                    </div>
                    <Badge variant="destructive" className="bg-red-500/10 text-red-600 border-red-500/20">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Traditional
                    </Badge>
                  </div>
                </Card>

                {/* Privacy-First */}
                <Card className="p-6 bg-gradient-to-br from-green-500/10 to-green-500/5 border border-green-500/20">
                  <div className="flex items-start space-x-4">
                    <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                      <comparison.privacy.icon className="w-5 h-5 text-green-500" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-lg font-semibold mb-2 text-green-600">
                        {comparison.privacy.title}
                      </h4>
                      <p className="text-muted-foreground text-sm">
                        {comparison.privacy.description}
                      </p>
                    </div>
                    <Badge variant="secondary" className="bg-green-500/10 text-green-600 border-green-500/20">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Privacy-First
                    </Badge>
                  </div>
                </Card>
              </div>
            ))}
          </div>
        </div>

        {/* Privacy Promise */}
        <Card className="p-8 bg-gradient-to-br from-green-500/10 to-blue-500/10 border border-green-500/30 text-center">
          <div className="max-w-3xl mx-auto">
            <div className="w-16 h-16 rounded-full bg-gradient-to-r from-green-500 to-blue-500 flex items-center justify-center shadow-lg mx-auto mb-6">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold mb-4 text-foreground">
              Our Privacy Promise
            </h3>
            <p className="text-lg text-muted-foreground mb-6">
              We promise to never collect, store, or share your personal information. 
              Your privacy is not just protected - it's our core principle.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Badge variant="secondary" className="bg-green-500/10 text-green-600 border-green-500/20">
                <CheckCircle className="h-3 w-3 mr-1" />
                No Data Collection
              </Badge>
              <Badge variant="secondary" className="bg-green-500/10 text-green-600 border-green-500/20">
                <CheckCircle className="h-3 w-3 mr-1" />
                No Tracking
              </Badge>
              <Badge variant="secondary" className="bg-green-500/10 text-green-600 border-green-500/20">
                <CheckCircle className="h-3 w-3 mr-1" />
                No Data Sharing
              </Badge>
              <Badge variant="secondary" className="bg-green-500/10 text-green-600 border-green-500/20">
                <CheckCircle className="h-3 w-3 mr-1" />
                Complete Anonymity
              </Badge>
            </div>
          </div>
        </Card>
      </div>
    </section>
  );
};

export default PrivacySection;
