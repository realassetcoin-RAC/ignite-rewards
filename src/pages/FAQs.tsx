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
      answer: "PointBridge is a decentralized rewards ecosystem that connects businesses with customers through blockchain-powered loyalty programs. Users earn $RAC tokens by engaging with partner businesses, which can be redeemed for various rewards and benefits."
    },
    {
      question: "How do I earn $RAC tokens?",
      answer: "You can earn $RAC tokens by making purchases at partner merchants, completing specific actions like referrals, participating in promotional events, and engaging with the PointBridge ecosystem. Each partner business has its own reward structure."
    },
    {
      question: "What can I do with my $RAC tokens?",
      answer: "RAC tokens can be redeemed for discounts, exclusive products, and services at any partner merchant within the PointBridge network. You can also trade them, stake them for additional rewards, or hold them as they may increase in value."
    },
    {
      question: "How do I become a merchant partner?",
      answer: "To become a merchant partner, visit our Partners page and fill out the application form. We'll review your business and get in touch to discuss integration options, pricing, and how PointBridge can help grow your customer base."
    },
    {
      question: "Is PointBridge secure?",
      answer: "Yes, PointBridge uses blockchain technology to ensure all transactions are secure, transparent, and immutable. Your tokens are stored in a secure wallet, and all data is encrypted. We follow industry best practices for security and privacy."
    },
    {
      question: "Are there any fees for using PointBridge?",
      answer: "For customers, PointBridge is free to use. You can earn and redeem tokens without any fees. Merchant partners pay a small transaction fee for the loyalty program services, which is significantly lower than traditional loyalty programs."
    },
    {
      question: "Can I transfer my tokens to other users?",
      answer: "Yes, $RAC tokens can be transferred between PointBridge users. This allows you to gift tokens to friends and family or trade them with other community members. All transfers are recorded on the blockchain for transparency."
    },
    {
      question: "How do I track my rewards and transactions?",
      answer: "Your dashboard provides a complete overview of your token balance, transaction history, and available rewards. You can see detailed analytics of your earnings, spending, and the current value of your tokens in real-time."
    },
    {
      question: "What happens if I lose access to my account?",
      answer: "We have account recovery procedures in place. If you lose access to your account, contact our support team with your registered email and identification. We'll help you regain access to your account and tokens securely."
    },
    {
      question: "How is PointBridge different from traditional loyalty programs?",
      answer: "Unlike traditional loyalty programs that lock you into a single business, PointBridge tokens work across our entire network of partners. Your rewards never expire, have real monetary value, and give you the freedom to choose how and where to use them."
    }
  ];

  return (
    <div className="min-h-screen hero-gradient relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute top-20 left-20 w-72 h-72 bg-gradient-to-r from-primary/20 to-purple-500/20 rounded-full mix-blend-multiply filter blur-xl animate-pulse pointer-events-none"></div>
      <div className="absolute top-40 right-20 w-96 h-96 bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-2000 pointer-events-none"></div>
      <div className="absolute -bottom-20 left-40 w-80 h-80 bg-gradient-to-r from-blue-500/20 to-primary/20 rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-4000 pointer-events-none"></div>
      
      {/* Floating Particles */}
      <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-primary/40 rounded-full animate-bounce animation-delay-1000"></div>
      <div className="absolute top-1/3 right-1/3 w-1 h-1 bg-purple-500/60 rounded-full animate-bounce animation-delay-3000"></div>
      <div className="absolute bottom-1/3 left-1/3 w-1.5 h-1.5 bg-blue-500/50 rounded-full animate-bounce animation-delay-5000"></div>

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
            Everything you need to know about PointBridge and the $RAC token ecosystem
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