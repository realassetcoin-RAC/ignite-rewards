import { Twitter, Send, Linkedin, Facebook, Youtube } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="relative bg-gradient-to-br from-background via-background/95 to-background/90 text-white py-12 px-6 overflow-hidden">
      {/* Enhanced Dynamic Background matching hero */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-purple-500/20 to-blue-500/30">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-background/70 to-background/90" />
        
        {/* Animated Background Elements */}
        <div className="absolute top-10 left-10 w-64 h-64 bg-gradient-to-r from-primary/20 to-purple-500/20 rounded-full mix-blend-multiply filter blur-xl animate-pulse pointer-events-none"></div>
        <div className="absolute bottom-10 right-10 w-80 h-80 bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-2000 pointer-events-none"></div>
        
        {/* Floating Particles */}
        <div className="absolute top-1/4 left-1/4 w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce animation-delay-1000"></div>
        <div className="absolute top-1/3 right-1/3 w-1 h-1 bg-purple-500/50 rounded-full animate-bounce animation-delay-3000"></div>
        <div className="absolute bottom-1/3 left-1/3 w-2 h-2 bg-blue-500/35 rounded-full animate-bounce animation-delay-5000"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto">
        <div className="grid md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <h3 className="text-2xl font-bold mb-4 bg-gradient-to-r from-primary via-purple-500 to-blue-500 bg-clip-text text-transparent">
              PointBridge
            </h3>
            <p className="text-foreground/80 mb-6 max-w-md">
              Join our decentralized rewards ecosystem where your engagement earns $RAC tokens. The Future of Value Is Here!
            </p>
            <div className="flex space-x-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-primary/20 to-purple-500/20 hover:from-primary/30 hover:to-purple-500/30 flex items-center justify-center transition-all duration-300 cursor-pointer transform hover:scale-110 hover:shadow-lg">
                <Twitter className="w-5 h-5 text-primary" />
              </div>
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500/20 to-blue-500/20 hover:from-purple-500/30 hover:to-blue-500/30 flex items-center justify-center transition-all duration-300 cursor-pointer transform hover:scale-110 hover:shadow-lg">
                <Send className="w-5 h-5 text-purple-500" />
              </div>
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500/20 to-primary/20 hover:from-blue-500/30 hover:to-primary/30 flex items-center justify-center transition-all duration-300 cursor-pointer transform hover:scale-110 hover:shadow-lg">
                <Linkedin className="w-5 h-5 text-blue-500" />
              </div>
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-primary/20 to-blue-500/20 hover:from-primary/30 hover:to-blue-500/30 flex items-center justify-center transition-all duration-300 cursor-pointer transform hover:scale-110 hover:shadow-lg">
                <Facebook className="w-5 h-5 text-primary" />
              </div>
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500/20 to-purple-500/20 hover:from-blue-500/30 hover:to-purple-500/30 flex items-center justify-center transition-all duration-300 cursor-pointer transform hover:scale-110 hover:shadow-lg">
                <Youtube className="w-5 h-5 text-blue-500" />
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4 text-foreground">Quick Links</h4>
            <ul className="space-y-2 text-muted-foreground">
              <li><a href="#how-it-works" className="hover:bg-gradient-to-r hover:from-primary hover:to-purple-500 hover:bg-clip-text hover:text-transparent transition-all duration-300">How It Works</a></li>
              <li><a href="#benefits" className="hover:bg-gradient-to-r hover:from-primary hover:to-purple-500 hover:bg-clip-text hover:text-transparent transition-all duration-300">Why Join Our Loyalty Network</a></li>
              <li><Link to="/partners" className="hover:bg-gradient-to-r hover:from-blue-500 hover:to-primary hover:bg-clip-text hover:text-transparent transition-all duration-300">Partners</Link></li>
              <li><Link to="/faqs" className="hover:bg-gradient-to-r hover:from-purple-500 hover:to-blue-500 hover:bg-clip-text hover:text-transparent transition-all duration-300">FAQs</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4 text-foreground">Support</h4>
            <ul className="space-y-2 text-muted-foreground">
              <li><a href="#" className="hover:bg-gradient-to-r hover:from-primary hover:to-blue-500 hover:bg-clip-text hover:text-transparent transition-all duration-300">Contact Us</a></li>
              <li><a href="#" className="hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-500 hover:bg-clip-text hover:text-transparent transition-all duration-300">Help Center</a></li>
              <li><Link to="/privacy" className="hover:bg-gradient-to-r hover:from-purple-500 hover:to-primary hover:bg-clip-text hover:text-transparent transition-all duration-300">Privacy Policy</Link></li>
              <li><Link to="/terms" className="hover:bg-gradient-to-r hover:from-primary hover:to-purple-500 hover:bg-clip-text hover:text-transparent transition-all duration-300">Terms of Service</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-primary/20 mt-8 pt-8 text-center text-muted-foreground">
          <p>&copy; 2025 PointBridge. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;