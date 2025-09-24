import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft, 
  Mail, 
  MessageSquare, 
  Send, 
  Clock, 
  Phone,
  Shield
} from "lucide-react";
import { Link } from "react-router-dom";
import Footer from "@/components/Footer";

const Contact = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
    type: "general"
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Simulate form submission
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Message Sent!",
        description: "Thank you for contacting us. We'll get back to you within 24 hours.",
      });

      // Reset form
      setFormData({
        name: "",
        email: "",
        subject: "",
        message: "",
        type: "general"
      });
      } catch {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const contactMethods = [
    {
      icon: Mail,
      title: "Email Support",
      description: "Get help via email",
      contact: "support@pointbridge.com",
      responseTime: "Within 24 hours",
      color: "from-blue-500 to-purple-500"
    },
    {
      icon: MessageSquare,
      title: "Live Chat",
      description: "Chat with our support team",
      contact: "Available 24/7",
      responseTime: "Instant response",
      color: "from-green-500 to-blue-500"
    },
    {
      icon: Phone,
      title: "Phone Support",
      description: "Speak with our team",
      contact: "+1 (555) 123-4567",
      responseTime: "Mon-Fri 9AM-6PM EST",
      color: "from-purple-500 to-pink-500"
    }
  ];

  const faqItems = [
    {
      question: "How quickly will I get a response?",
      answer: "We typically respond to all inquiries within 24 hours. For urgent issues, please use our live chat feature for instant support."
    },
    {
      question: "Do you provide support for account recovery?",
      answer: "Due to our privacy-first design, we cannot recover lost accounts. However, we can help you understand how to secure your account and prevent future issues."
    },
    {
      question: "Can I get help with technical issues?",
      answer: "Yes! Our technical support team can help with app issues, wallet problems, and general troubleshooting."
    },
    {
      question: "Is support available in multiple languages?",
      answer: "Currently, we provide support in English. We're working on expanding to other languages based on user demand."
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
              <MessageSquare className="h-6 w-6 text-primary-foreground" />
            </div>
            <h1 className={`text-4xl md:text-5xl font-bold ${
              isLoaded ? 'animate-fade-in-up animation-delay-200' : 'opacity-0'
            }`}>
              Contact Us
            </h1>
          </div>
          <p className={`text-xl text-white/80 ${
            isLoaded ? 'animate-fade-in-up animation-delay-400' : 'opacity-0'
          }`}>
            Get help with your privacy-first loyalty program. We're here to support you 24/7.
          </p>
        </div>
      </section>

      {/* Contact Methods */}
      <section className="relative z-10 py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            {contactMethods.map((method, index) => (
              <Card key={index} className={`group p-6 bg-gradient-to-br from-background/60 to-background/30 backdrop-blur-md border border-primary/20 hover:border-primary/40 transition-all duration-500 transform hover:scale-105 hover:shadow-xl ${
                isLoaded ? 'animate-fade-in-up' : 'opacity-0'
              }`} style={{ animationDelay: `${index * 200}ms` }}>
                <div className="text-center space-y-4">
                  <div className={`w-16 h-16 rounded-full bg-gradient-to-r ${method.color} flex items-center justify-center shadow-lg mx-auto group-hover:scale-110 transition-transform`}>
                    <method.icon className="w-8 h-8 text-white" />
                  </div>
                  
                  <div>
                    <h3 className="text-xl font-bold mb-2">{method.title}</h3>
                    <p className="text-muted-foreground mb-3">{method.description}</p>
                    <p className="font-semibold text-primary mb-2">{method.contact}</p>
                    <div className="flex items-center justify-center text-sm text-muted-foreground">
                      <Clock className="w-4 h-4 mr-1" />
                      {method.responseTime}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Contact Form */}
          <div className="grid lg:grid-cols-2 gap-12">
            <Card className={`p-8 bg-gradient-to-br from-background/60 to-background/30 backdrop-blur-md border border-primary/20 ${
              isLoaded ? 'animate-fade-in-up animation-delay-600' : 'opacity-0'
            }`}>
              <CardHeader>
                <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
                  Send us a Message
                </CardTitle>
                <p className="text-muted-foreground">
                  Fill out the form below and we'll get back to you as soon as possible.
                </p>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium mb-2">
                        Name
                      </label>
                      <Input
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="Your name"
                        required
                        className="bg-background/50 border-primary/30 focus:border-primary/50"
                      />
                    </div>
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium mb-2">
                        Email
                      </label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="your@email.com"
                        required
                        className="bg-background/50 border-primary/30 focus:border-primary/50"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="type" className="block text-sm font-medium mb-2">
                      Inquiry Type
                    </label>
                    <select
                      id="type"
                      name="type"
                      value={formData.type}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-background/50 border border-primary/30 rounded-md focus:border-primary/50 focus:outline-none"
                    >
                      <option value="general">General Inquiry</option>
                      <option value="technical">Technical Support</option>
                      <option value="account">Account Issue</option>
                      <option value="merchant">Merchant Partnership</option>
                      <option value="privacy">Privacy Question</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="subject" className="block text-sm font-medium mb-2">
                      Subject
                    </label>
                    <Input
                      id="subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleInputChange}
                      placeholder="Brief description of your inquiry"
                      required
                      className="bg-background/50 border-primary/30 focus:border-primary/50"
                    />
                  </div>

                  <div>
                    <label htmlFor="message" className="block text-sm font-medium mb-2">
                      Message
                    </label>
                    <Textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleInputChange}
                      placeholder="Please provide details about your inquiry..."
                      rows={5}
                      required
                      className="bg-background/50 border-primary/30 focus:border-primary/50"
                    />
                  </div>

                  <Button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="w-full bg-gradient-to-r from-primary to-purple-500 hover:from-primary/90 hover:to-purple-500/90 transform hover:scale-105 transition-all duration-300"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Send Message
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* FAQ Section */}
            <div className={`space-y-6 ${
              isLoaded ? 'animate-fade-in-up animation-delay-800' : 'opacity-0'
            }`}>
              <Card className="p-6 bg-gradient-to-br from-background/60 to-background/30 backdrop-blur-md border border-primary/20">
                <CardHeader>
                  <CardTitle className="text-xl font-bold bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
                    Quick Answers
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {faqItems.map((item, index) => (
                    <div key={index} className="border-l-2 border-primary/30 pl-4">
                      <h4 className="font-semibold text-sm mb-1">{item.question}</h4>
                      <p className="text-sm text-muted-foreground">{item.answer}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="p-6 bg-gradient-to-br from-background/60 to-background/30 backdrop-blur-md border border-primary/20">
                <CardHeader>
                  <CardTitle className="text-xl font-bold bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
                    Privacy Notice
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-start space-x-3">
                    <Shield className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-muted-foreground">
                        We respect your privacy. Any information you provide will only be used to respond to your inquiry and will not be shared with third parties.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Contact;
