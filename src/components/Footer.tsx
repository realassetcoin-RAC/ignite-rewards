const Footer = () => {
  return (
    <footer className="hero-gradient text-white py-12 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <h3 className="text-2xl font-bold mb-4 text-reward-gold">
              Loyalty Network
            </h3>
            <p className="text-white/80 mb-6 max-w-md">
              Join our growing community of smart shoppers who earn rewards on every purchase. 
              Start saving and earning today!
            </p>
            <div className="flex space-x-4">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors cursor-pointer">
                <span className="text-sm font-bold">f</span>
              </div>
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors cursor-pointer">
                <span className="text-sm font-bold">t</span>
              </div>
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors cursor-pointer">
                <span className="text-sm font-bold">in</span>
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-white/80">
              <li><a href="#" className="hover:text-reward-gold transition-colors">How It Works</a></li>
              <li><a href="#" className="hover:text-reward-gold transition-colors">Benefits</a></li>
              <li><a href="#" className="hover:text-reward-gold transition-colors">Partners</a></li>
              <li><a href="#" className="hover:text-reward-gold transition-colors">FAQs</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Support</h4>
            <ul className="space-y-2 text-white/80">
              <li><a href="#" className="hover:text-reward-gold transition-colors">Contact Us</a></li>
              <li><a href="#" className="hover:text-reward-gold transition-colors">Help Center</a></li>
              <li><a href="#" className="hover:text-reward-gold transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-reward-gold transition-colors">Terms of Service</a></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-white/20 mt-8 pt-8 text-center text-white/60">
          <p>&copy; 2024 Loyalty Network. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;