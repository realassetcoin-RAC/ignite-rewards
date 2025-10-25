import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  ArrowLeft, 
  Search, 
  HelpCircle, 
  BookOpen, 
  Shield, 
  Smartphone,
  Clock,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { Link } from "react-router-dom";
import Footer from "@/components/Footer";

const HelpCenter = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedItems, setExpandedItems] = useState<number[]>([]);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const toggleExpanded = (index: number) => {
    setExpandedItems(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  const helpCategories = [
    {
      icon: Shield,
      title: "Getting Started",
      description: "Learn how to set up your privacy-first loyalty account",
      color: "from-blue-500 to-purple-500",
      articles: [
        {
          title: "How to create an anonymous account",
          content: "Simply download our app and follow the setup process. No personal information required - no phone numbers, no email addresses. Your account is completely anonymous from day one."
        },
        {
          title: "Understanding custodial vs non-custodial",
          content: "Custodial users have full control over their NFT loyalty card and can trade it. Non-custodial users get a simple experience with automatic investment in real-world assets. Both provide complete privacy."
        },
        {
          title: "Setting up your wallet",
          content: "For custodial users, you'll need a Solana wallet. The app can generate one for you or you can import an existing wallet. Always store your seed phrase securely offline."
        }
      ]
    },
    {
      icon: Smartphone,
      title: "Using the App",
      description: "Master the features of your loyalty program",
      color: "from-green-500 to-blue-500",
      articles: [
        {
          title: "How to scan QR codes at merchants",
          content: "Simply open the app, tap the QR code scanner, and scan the merchant's QR code when making a purchase. Your notional rewards will appear immediately in your dashboard."
        },
        {
          title: "Understanding your dashboard",
          content: "Your dashboard shows notional rewards (currently vesting), vested rewards (ready to claim), and transaction history. You can see exactly when rewards will vest."
        },
        {
          title: "Tracking your rewards",
          content: "All rewards are tracked anonymously. You can see your total earned, currently vesting, and ready to claim amounts. Rewards never expire and accumulate forever."
        }
      ]
    },
    {
      icon: Clock,
      title: "Rewards & Vesting",
      description: "Everything about earning and claiming rewards",
      color: "from-purple-500 to-pink-500",
      articles: [
        {
          title: "How the 30-day vesting works",
          content: "When you make a purchase, you earn notional rewards immediately. These vest over 30 days to protect against cancellations. After 30 days, rewards become real tokens you can claim."
        },
        {
          title: "What happens if I cancel a purchase?",
          content: "If you cancel within the vesting period, your notional rewards simply won't vest. No complex reversals needed - the system automatically handles this."
        },
        {
          title: "How to claim vested rewards",
          content: "After 30 days, your rewards become available to claim. You can redeem them as cash, invest in fractional assets, or use at partner merchants with bonus benefits."
        }
      ]
    },
    {
      icon: Shield,
      title: "Privacy & Security",
      description: "Protecting your privacy and account security",
      color: "from-pink-500 to-red-500",
      articles: [
        {
          title: "Why we can't recover lost accounts",
          content: "Since we don't collect personal information, we cannot recover lost accounts. This is by design to protect your privacy. You must secure your own access."
        },
        {
          title: "How to keep your account secure",
          content: "For custodial users: store your seed phrase offline, never share private keys, use hardware wallets for large amounts. For non-custodial users: keep your app secure and don't share your device."
        },
        {
          title: "What data we don't collect",
          content: "We don't collect phone numbers, email addresses, names, addresses, or any personal information. All transactions are anonymous and no cross-merchant tracking occurs."
        }
      ]
    }
  ];

  const quickLinks = [
    {
      title: "Download the App",
      description: "Get started with our mobile app",
      icon: Smartphone,
      link: "#download",
      color: "from-blue-500 to-purple-500"
    },
    {
      title: "Contact Support",
      description: "Get help from our support team",
      icon: HelpCircle,
      link: "/contact",
      color: "from-green-500 to-blue-500"
    },
    {
      title: "Privacy Policy",
      description: "Read our privacy commitment",
      icon: Shield,
      link: "/privacy",
      color: "from-purple-500 to-pink-500"
    },
    {
      title: "Terms of Service",
      description: "Review our terms and conditions",
      icon: BookOpen,
      link: "/terms",
      color: "from-pink-500 to-red-500"
    }
  ];

  const filteredCategories = helpCategories.filter(category =>
    category.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    category.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    category.articles.some(article => 
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.content.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  return (
    <div className="min-h-screen hero-gradient relative overflow-hidden">
      {/* Enhanced Dynamic Background matching homepage */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-purple-500/20 to-blue-500/30">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-background/70 to-background/90" />
        
        {/* Animated Background Elements */}
        <div className="absolute top-20 left-20 w-72 h-72 bg-gradient-to-r from-primary/20 to-purple-500/20 rounded-full mix-blend-multiply filter blur-xl animate-pulse pointer-events-none"></div>
        <div className="absolute top-40 right-20 w-96 h-96 bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-2000 pointer-events-none"></div>
        <div className="absolute -bottom-20 left-40 w-80 h-80 bg-gradient-to-r from-blue-500/20 to-primary/20 rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-4000 pointer-events-none"></div>
        
        {/* Floating Particles */}
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-primary/40 rounded-full animate-bounce animation-delay-1000"></div>
        <div className="absolute top-1/3 right-1/3 w-1 h-1 bg-purple-500/60 rounded-full animate-bounce animation-delay-3000"></div>
        <div className="absolute bottom-1/3 left-1/3 w-1.5 h-1.5 bg-blue-500/50 rounded-full animate-bounce animation-delay-5000"></div>
        <div className="absolute top-2/3 right-1/4 w-1 h-1 bg-primary/70 rounded-full animate-bounce animation-delay-7000"></div>
      </div>

      {/* Header */}
      <div className="relative z-10 container mx-auto px-4 py-6">
        <div className="flex justify-end">
          <Link to="/">
            <Button 
              variant="ghost" 
              className={`gap-2 group bg-background/60 backdrop-blur-md hover:bg-background/80 border-primary/30 hover:border-primary/50 transform hover:scale-105 transition-all duration-300 ${
                isLoaded ? 'animate-fade-in-up' : 'opacity-0'
              }`}
            >
              <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
              Back to Home
            </Button>
          </Link>
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative z-10 text-white py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex items-center justify-center mb-6">
            <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center mr-4">
              <HelpCircle className="h-6 w-6 text-primary-foreground" />
            </div>
            <h1 className={`text-4xl md:text-5xl font-bold ${
              isLoaded ? 'animate-fade-in-up animation-delay-200' : 'opacity-0'
            }`}>
              Help Center
            </h1>
          </div>
          <p className={`text-xl text-white/80 mb-8 ${
            isLoaded ? 'animate-fade-in-up animation-delay-400' : 'opacity-0'
          }`}>
            Find answers to common questions about our privacy-first loyalty program
          </p>
          
          {/* Search Bar */}
          <div className={`max-w-2xl mx-auto ${
            isLoaded ? 'animate-fade-in-up animation-delay-600' : 'opacity-0'
          }`}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <Input
                type="text"
                placeholder="Search for help articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-3 bg-background/50 border-primary/30 focus:border-primary/50 text-lg"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Quick Links */}
      <section className="relative z-10 py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className={`text-3xl font-bold text-center mb-12 ${
            isLoaded ? 'animate-fade-in-up animation-delay-800' : 'opacity-0'
          }`}>
            Quick Links
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {quickLinks.map((link, index) => (
              <Card key={index} className={`group p-6 bg-gradient-to-br from-background/60 to-background/30 backdrop-blur-md border border-primary/20 hover:border-primary/40 transition-all duration-500 transform hover:scale-105 hover:shadow-xl cursor-pointer ${
                isLoaded ? 'animate-fade-in-up' : 'opacity-0'
              }`} style={{ animationDelay: `${index * 100}ms` }}>
                <div className="text-center space-y-4">
                  <div className={`w-12 h-12 rounded-full bg-gradient-to-r ${link.color} flex items-center justify-center shadow-lg mx-auto group-hover:scale-110 transition-transform`}>
                    <link.icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2">{link.title}</h3>
                    <p className="text-sm text-muted-foreground">{link.description}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Help Categories */}
      <section className="relative z-10 py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className={`text-3xl font-bold text-center mb-12 ${
            isLoaded ? 'animate-fade-in-up' : 'opacity-0'
          }`}>
            Help Categories
          </h2>
          <div className="space-y-8">
            {filteredCategories.map((category, categoryIndex) => (
              <Card key={categoryIndex} className={`bg-gradient-to-br from-background/60 to-background/30 backdrop-blur-md border border-primary/20 ${
                isLoaded ? 'animate-fade-in-up' : 'opacity-0'
              }`} style={{ animationDelay: `${categoryIndex * 200}ms` }}>
                <CardHeader>
                  <div className="flex items-center space-x-4">
                    <div className={`w-12 h-12 rounded-full bg-gradient-to-r ${category.color} flex items-center justify-center shadow-lg`}>
                      <category.icon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
                        {category.title}
                      </CardTitle>
                      <p className="text-muted-foreground">{category.description}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {category.articles.map((article, articleIndex) => {
                      const globalIndex = categoryIndex * 10 + articleIndex;
                      const isExpanded = expandedItems.includes(globalIndex);
                      
                      return (
                        <div key={articleIndex} className="border border-primary/20 rounded-lg">
                          <button
                            onClick={() => toggleExpanded(globalIndex)}
                            className="w-full p-4 text-left flex items-center justify-between hover:bg-primary/5 transition-colors"
                          >
                            <h3 className="font-semibold text-lg">{article.title}</h3>
                            {isExpanded ? (
                              <ChevronUp className="w-5 h-5 text-primary" />
                            ) : (
                              <ChevronDown className="w-5 h-5 text-primary" />
                            )}
                          </button>
                          {isExpanded && (
                            <div className="px-4 pb-4">
                              <p className="text-muted-foreground leading-relaxed">
                                {article.content}
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Still Need Help Section */}
      <section className="relative z-10 py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <Card className={`p-8 bg-gradient-to-br from-background/60 to-background/30 backdrop-blur-md border border-primary/20 text-center ${
            isLoaded ? 'animate-fade-in-up' : 'opacity-0'
          }`}>
            <CardHeader>
              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
                Still Need Help?
              </CardTitle>
              <p className="text-muted-foreground">
                Can't find what you're looking for? Our support team is here to help.
              </p>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild className="bg-gradient-to-r from-primary to-purple-500 hover:from-primary/90 hover:to-purple-500/90 transform hover:scale-105 transition-all duration-300">
                  <Link to="/contact">
                    <HelpCircle className="w-4 h-4 mr-2" />
                    Contact Support
                  </Link>
                </Button>
                <Button asChild variant="outline" className="bg-gradient-to-r from-primary to-purple-500 hover:from-primary/90 hover:to-purple-500/90 transform hover:scale-105 transition-all duration-300 text-white border-0">
                  <Link to="/faqs" onClick={() => window.scrollTo(0, 0)}>
                    <BookOpen className="w-4 h-4 mr-2" />
                    View FAQs
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default HelpCenter;
