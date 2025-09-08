import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useSecureAuth } from "@/hooks/useSecureAuth";
import { 
  Mail, 
  MessageCircle, 
  Clock, 
  Shield, 
  Users, 
  Zap,
  ArrowLeft,
  Sparkles
} from "lucide-react";
import { Link } from "react-router-dom";
import ContactChatbot from "@/components/ContactChatbot";

const ContactUs = () => {
  const { user } = useSecureAuth();
  const { toast } = useToast();
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const handleEmailClick = () => {
    const email = "realassetcoin@gmail.com";
    const subject = "Support Request";
    const body = user 
      ? `Hello,\n\nI need assistance with the following:\n\n[Please describe your issue here]\n\nUser: ${user.email}\n\nThank you!`
      : `Hello,\n\nI need assistance with the following:\n\n[Please describe your issue here]\n\nThank you!`;
    
    const mailtoLink = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailtoLink, '_blank');
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px]"></div>
      <div className="absolute top-20 left-20 w-32 h-32 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-2xl rotate-45 animate-float pointer-events-none"></div>
      <div className="absolute top-40 right-32 w-24 h-24 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-full animate-float-delayed pointer-events-none"></div>
      <div className="absolute bottom-32 left-1/4 w-20 h-20 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-lg rotate-12 animate-float-slow pointer-events-none"></div>
      <div className="absolute top-1/2 right-1/4 w-16 h-16 bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-full animate-float-delayed-2 pointer-events-none"></div>
      
      {/* Ambient Light Effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-purple-500/10 to-transparent rounded-full blur-3xl animate-pulse pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-r from-blue-500/10 to-transparent rounded-full blur-3xl animate-pulse animation-delay-2000 pointer-events-none"></div>

      {/* Header */}
      <header className="relative z-10 border-b bg-black/20 backdrop-blur-xl border-white/10">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/25">
                    <Sparkles className="h-6 w-6 text-white" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-pink-500 to-red-500 rounded-full animate-pulse"></div>
                </div>
                <div>
                  <h1 className={`text-3xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent ${
                    isLoaded ? 'animate-fade-in-up' : 'opacity-0'
                  }`}>
                    Contact Us
                  </h1>
                  <p className="text-sm text-gray-400">We're here to help you succeed</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button 
                variant="outline" 
                size="sm" 
                asChild
                className={`group bg-white/5 backdrop-blur-sm hover:bg-white/10 border-white/20 hover:border-white/30 text-white hover:text-white transform hover:scale-105 transition-all duration-300 ${
                  isLoaded ? 'animate-fade-in-up animation-delay-200' : 'opacity-0'
                }`}
              >
                <Link to="/" className="flex items-center">
                  <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                  Back to Home
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 container mx-auto px-6 py-8 space-y-8">
        {/* Welcome Section */}
        <div className={`text-center space-y-4 ${
          isLoaded ? 'animate-fade-in-up animation-delay-400' : 'opacity-0'
        }`}>
          <h2 className="text-4xl font-bold bg-gradient-to-r from-white via-purple-200 to-blue-200 bg-clip-text text-transparent">
            Get in Touch
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Have a question or need support? Our AI-powered assistant is available 24/7 to help you, 
            or reach out to us directly via email.
          </p>
        </div>

        {/* Contact Options */}
        <div className={`grid grid-cols-1 lg:grid-cols-2 gap-8 ${
          isLoaded ? 'animate-fade-in-up animation-delay-600' : 'opacity-0'
        }`}>
          {/* Email Contact Card */}
          <Card className="bg-white/5 backdrop-blur-xl border-white/10 hover:bg-white/10 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/25">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl shadow-lg shadow-blue-500/25">
                  <Mail className="h-6 w-6 text-white" />
                </div>
                <Badge className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-0">
                  Direct Contact
                </Badge>
              </div>
              <CardTitle className="text-lg font-semibold text-white">
                Email Support
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-400 text-sm">
                Send us an email directly for personalized support and detailed assistance.
              </p>
              
              <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium">realassetcoin@gmail.com</p>
                    <p className="text-sm text-gray-400">Click to compose email</p>
                  </div>
                  <Button 
                    onClick={handleEmailClick}
                    className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white border-0"
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    Send Email
                  </Button>
                </div>
              </div>

              <div className="space-y-2 text-sm text-gray-400">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>Response time: Within 24 hours</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  <span>Secure and confidential</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* AI Chatbot Card */}
          <Card className="bg-white/5 backdrop-blur-xl border-white/10 hover:bg-white/10 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-emerald-500/25">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl shadow-lg shadow-emerald-500/25">
                  <MessageCircle className="h-6 w-6 text-white" />
                </div>
                <Badge className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-0">
                  AI Assistant
                </Badge>
              </div>
              <CardTitle className="text-lg font-semibold text-white">
                AI-Powered Chatbot
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-400 text-sm">
                Get instant help with our intelligent assistant. Available 24/7 to answer questions 
                and guide you through any issues.
              </p>

              <div className="space-y-2 text-sm text-gray-400">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  <span>Instant responses</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>Available 24/7</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  <span>Smart issue routing</span>
                </div>
              </div>

              <div className="pt-2">
                <ContactChatbot />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Support Information */}
        <div className={`grid grid-cols-1 md:grid-cols-3 gap-6 ${
          isLoaded ? 'animate-fade-in-up animation-delay-800' : 'opacity-0'
        }`}>
          <Card className="bg-white/5 backdrop-blur-xl border-white/10 hover:bg-white/10 transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg">
                  <Clock className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Response Time</p>
                  <p className="text-xl font-bold text-white">24/7 Support</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/5 backdrop-blur-xl border-white/10 hover:bg-white/10 transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg">
                  <Shield className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Security</p>
                  <p className="text-xl font-bold text-white">Fully Secure</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/5 backdrop-blur-xl border-white/10 hover:bg-white/10 transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg">
                  <Users className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Expert Team</p>
                  <p className="text-xl font-bold text-white">Always Ready</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* FAQ Section */}
        <div className={`${
          isLoaded ? 'animate-fade-in-up animation-delay-1000' : 'opacity-0'
        }`}>
          <Card className="bg-white/5 backdrop-blur-xl border-white/10">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-white flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg">
                  <MessageCircle className="h-6 w-6 text-white" />
                </div>
                <span>Frequently Asked Questions</span>
              </CardTitle>
              <CardDescription className="text-gray-400">
                Quick answers to common questions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                  <h3 className="text-white font-medium mb-2">How quickly will I get a response?</h3>
                  <p className="text-gray-400 text-sm">
                    Our AI chatbot provides instant responses 24/7. For email support, we typically respond within 24 hours.
                  </p>
                </div>
                
                <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                  <h3 className="text-white font-medium mb-2">What types of issues can you help with?</h3>
                  <p className="text-gray-400 text-sm">
                    We can assist with technical issues, billing questions, feature requests, and general inquiries about our platform.
                  </p>
                </div>
                
                <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                  <h3 className="text-white font-medium mb-2">Is my information secure?</h3>
                  <p className="text-gray-400 text-sm">
                    Yes, all communications are encrypted and secure. We follow industry best practices for data protection.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default ContactUs;
