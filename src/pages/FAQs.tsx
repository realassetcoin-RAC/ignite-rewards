import React, { useState, useEffect } from "react";
import { ChevronDown, ChevronUp, ArrowLeft, Sparkles, HelpCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Footer from "@/components/Footer";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const FAQs = () => {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const faqs = [
    {
      question: "What is PointBridge?",
      answer: "PointBridge is the world's first privacy-first loyalty program. Users earn notional rewards that vest over 30 days by shopping at partner merchants. No personal data is collected - no phone numbers, no email addresses, no tracking. Your privacy is protected while you earn rewards that never expire."
    },
    {
      question: "How do I earn rewards?",
      answer: "Simply scan your QR code at any partner merchant when making a purchase. You'll earn notional rewards immediately (visible in your dashboard) that vest over 30 days. No signup forms, no personal information required - just scan and earn. Your rewards are protected against cancellations during the vesting period."
    },
    {
      question: "What can I do with my rewards?",
      answer: "After your rewards vest (30 days), you can redeem them as cash, invest in fractional real-world assets, or use them at partner merchants with bonus benefits. For custodial users, you can also trade your NFT loyalty card. Your rewards never expire and accumulate forever."
    },
    {
      question: "How do I become a merchant partner?",
      answer: "To become a merchant partner, visit our Partners page and fill out the application form. We'll review your business and get in touch to discuss integration options, pricing, and how PointBridge can help grow your customer base."
    },
    {
      question: "Is PointBridge secure?",
      answer: "Yes, PointBridge uses blockchain technology to ensure all transactions are secure, transparent, and immutable. Since we don't collect personal information, there's no personal data to be compromised. Your rewards are protected by 30-day vesting, and all transactions are recorded on the blockchain for transparency."
    },
    {
      question: "Are there any fees for using PointBridge?",
      answer: "For customers, PointBridge is completely free to use. You can earn and redeem rewards without any fees. Merchant partners pay a small transaction fee for the loyalty program services, which is significantly lower than traditional loyalty programs. No hidden fees, no subscription costs."
    },
    {
      question: "Can I transfer my rewards to other users?",
      answer: "Yes, after your rewards vest (30 days), you can transfer them to other users. This allows you to gift rewards to friends and family or trade them with other community members. All transfers are recorded on the blockchain for transparency. Remember, we can't help recover lost rewards due to our privacy-first design."
    },
    {
      question: "How do I track my rewards and transactions?",
      answer: "Your dashboard shows your notional rewards (currently vesting), vested rewards (ready to claim), and transaction history. You can see exactly when your rewards will vest and track your earnings in real-time. All data is stored anonymously - no personal information is tracked or stored."
    },
    {
      question: "What happens if I lose access to my account?",
      answer: "Since we don't collect personal information like email addresses or phone numbers, we cannot recover lost accounts. This is by design to protect your privacy. Make sure to securely store your wallet seed phrase or private keys. If you lose access, you'll need to create a new account and start earning rewards again."
    },
    {
      question: "How do I keep my account secure?",
      answer: "Your account security is entirely in your hands. For custodial users: securely store your wallet seed phrase offline, never share your private keys, and use hardware wallets for large amounts. For non-custodial users: keep your app secure and don't share your device. Remember, we can't help recover lost accounts due to our privacy-first design."
    },
    {
      question: "How is PointBridge different from traditional loyalty programs?",
      answer: "Unlike traditional loyalty programs that lock you into a single business, PointBridge tokens work across our entire network of partners. Your rewards never expire, have real monetary value, and give you the freedom to choose how and where to use them. Most importantly, we don't collect any personal information, ensuring complete privacy."
    }
  ];

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
              Frequently Asked Questions
            </h1>
          </div>
          <p className={`text-xl text-white/80 ${
            isLoaded ? 'animate-fade-in-up animation-delay-400' : 'opacity-0'
          }`}>
            Everything you need to know about our privacy-first loyalty program and 30-day vesting system
          </p>
        </div>
      </section>

      {/* FAQ Content */}
      <section className="relative z-10 py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <Accordion type="single" collapsible className={`space-y-4 ${
            isLoaded ? 'animate-fade-in-up animation-delay-600' : 'opacity-0'
          }`}>
            {faqs.map((faq, index) => (
              <AccordionItem 
                key={index} 
                value={`item-${index}`}
                className="card-gradient border-primary/20 backdrop-blur-md rounded-lg px-6 hover:scale-[1.02] transition-all duration-300"
              >
                <AccordionTrigger className="hover:no-underline py-6 group">
                  <span className="text-left text-lg font-medium group-hover:text-primary transition-colors">
                    {faq.question}
                  </span>
                </AccordionTrigger>
                <AccordionContent className="pb-6 text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          {/* Contact Section */}
          <div className={`mt-16 text-center card-gradient border-primary/20 backdrop-blur-md rounded-lg p-8 ${
            isLoaded ? 'animate-fade-in-up animation-delay-800' : 'opacity-0'
          }`}>
            <h2 className="text-2xl font-bold mb-4 bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">Still have questions?</h2>
            <p className="text-muted-foreground mb-6">
              Our support team is here to help you with any questions or concerns you may have.
            </p>
            <Button size="lg" className="gap-2 group bg-gradient-to-r from-primary to-purple-500 hover:from-primary/90 hover:to-purple-500/90 transform hover:scale-105 transition-all duration-300">
              Contact Support
              <HelpCircle className="h-4 w-4 group-hover:animate-bounce" />
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default FAQs;