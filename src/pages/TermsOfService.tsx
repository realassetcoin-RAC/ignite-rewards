import React from "react";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Footer from "@/components/Footer";

const TermsOfService = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="container mx-auto px-4 py-6">
        <Link to="/">
          <Button variant="ghost" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Button>
        </Link>
      </div>

      {/* Hero Section */}
      <section className="hero-gradient text-white py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Terms of Service
          </h1>
          <p className="text-xl text-white/80">
            Last Updated: January 2025
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto prose prose-lg dark:prose-invert">
          <h2 className="text-2xl font-bold mb-4">1. Acceptance of Terms</h2>
          <p className="text-muted-foreground mb-6">
            By accessing and using PointBridge ("the Service"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service. These Terms of Service apply to all users of the Service, including without limitation users who are browsers, vendors, customers, merchants, and/or contributors of content.
          </p>

          <h2 className="text-2xl font-bold mb-4">2. Description of Service</h2>
          <p className="text-muted-foreground mb-6">
            PointBridge is a decentralized rewards ecosystem that connects businesses with customers through blockchain-powered loyalty programs. The Service allows users to earn, manage, and redeem $RAC tokens across our network of partner merchants. We reserve the right to modify, suspend, or discontinue the Service at any time without notice.
          </p>

          <h2 className="text-2xl font-bold mb-4">3. User Accounts</h2>
          <p className="text-muted-foreground mb-4">
            To use certain features of the Service, you must create an account. You agree to:
          </p>
          <ul className="list-disc pl-6 text-muted-foreground mb-6">
            <li>Provide accurate, current, and complete information during registration</li>
            <li>Maintain and promptly update your account information</li>
            <li>Maintain the security of your password and accept all risks of unauthorized access</li>
            <li>Notify us immediately if you discover or suspect any security breaches</li>
            <li>Take responsibility for all activities that occur under your account</li>
          </ul>

          <h2 className="text-2xl font-bold mb-4">4. $RAC Token Terms</h2>
          <p className="text-muted-foreground mb-4">
            The $RAC token is a utility token used within the PointBridge ecosystem. By using $RAC tokens, you acknowledge that:
          </p>
          <ul className="list-disc pl-6 text-muted-foreground mb-6">
            <li>$RAC tokens are not securities or investment products</li>
            <li>The value of $RAC tokens may fluctuate</li>
            <li>PointBridge does not guarantee any specific value or exchange rate</li>
            <li>Tokens may be subject to network fees and transaction costs</li>
            <li>Lost or stolen tokens cannot be recovered by PointBridge</li>
          </ul>

          <h2 className="text-2xl font-bold mb-4">5. User Conduct</h2>
          <p className="text-muted-foreground mb-4">
            You agree not to use the Service to:
          </p>
          <ul className="list-disc pl-6 text-muted-foreground mb-6">
            <li>Violate any laws or regulations</li>
            <li>Infringe upon the rights of others</li>
            <li>Distribute malware or engage in phishing</li>
            <li>Attempt to gain unauthorized access to the Service or other accounts</li>
            <li>Engage in any form of market manipulation or fraudulent activities</li>
            <li>Use automated systems or bots without our express permission</li>
            <li>Interfere with or disrupt the Service or servers</li>
          </ul>

          <h2 className="text-2xl font-bold mb-4">6. Merchant Partners</h2>
          <p className="text-muted-foreground mb-6">
            If you are a merchant partner, you additionally agree to:
          </p>
          <ul className="list-disc pl-6 text-muted-foreground mb-6">
            <li>Honor all valid $RAC token redemptions according to your published terms</li>
            <li>Maintain accurate reward offerings and availability</li>
            <li>Pay all applicable fees as outlined in your merchant agreement</li>
            <li>Comply with all applicable laws and regulations in your jurisdiction</li>
            <li>Not discriminate against customers using $RAC tokens</li>
          </ul>

          <h2 className="text-2xl font-bold mb-4">7. Privacy and Data Protection</h2>
          <p className="text-muted-foreground mb-6">
            Your use of the Service is also governed by our Privacy Policy. By using the Service, you consent to the collection and use of your information as outlined in our Privacy Policy. We are committed to protecting your personal data and maintaining compliance with applicable data protection regulations.
          </p>

          <h2 className="text-2xl font-bold mb-4">8. Intellectual Property</h2>
          <p className="text-muted-foreground mb-6">
            The Service and its original content, features, and functionality are and will remain the exclusive property of PointBridge and its licensors. The Service is protected by copyright, trademark, and other laws. Our trademarks and trade dress may not be used in connection with any product or service without our prior written consent.
          </p>

          <h2 className="text-2xl font-bold mb-4">9. Disclaimers and Limitations of Liability</h2>
          <p className="text-muted-foreground mb-6">
            THE SERVICE IS PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS. POINTBRIDGE DISCLAIMS ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
          </p>
          <p className="text-muted-foreground mb-6">
            IN NO EVENT SHALL POINTBRIDGE BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING WITHOUT LIMITATION, LOSS OF PROFITS, DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES.
          </p>

          <h2 className="text-2xl font-bold mb-4">10. Indemnification</h2>
          <p className="text-muted-foreground mb-6">
            You agree to defend, indemnify, and hold harmless PointBridge and its affiliates, officers, directors, employees, and agents from any claims, liabilities, damages, judgments, awards, losses, costs, expenses, or fees arising out of or relating to your violation of these Terms of Service or your use of the Service.
          </p>

          <h2 className="text-2xl font-bold mb-4">11. Termination</h2>
          <p className="text-muted-foreground mb-6">
            We may terminate or suspend your account and bar access to the Service immediately, without prior notice or liability, under our sole discretion, for any reason whatsoever, including without limitation if you breach the Terms of Service. Upon termination, your right to use the Service will cease immediately.
          </p>

          <h2 className="text-2xl font-bold mb-4">12. Governing Law</h2>
          <p className="text-muted-foreground mb-6">
            These Terms of Service shall be governed and construed in accordance with the laws of the jurisdiction in which PointBridge operates, without regard to its conflict of law provisions. Any disputes arising from these terms shall be resolved through binding arbitration.
          </p>

          <h2 className="text-2xl font-bold mb-4">13. Changes to Terms</h2>
          <p className="text-muted-foreground mb-6">
            We reserve the right to modify or replace these Terms of Service at any time. If a revision is material, we will provide at least 30 days notice prior to any new terms taking effect. Your continued use of the Service after such modifications constitutes acceptance of the updated terms.
          </p>

          <h2 className="text-2xl font-bold mb-4">14. Contact Information</h2>
          <p className="text-muted-foreground mb-6">
            If you have any questions about these Terms of Service, please contact us at:
          </p>
          <p className="text-muted-foreground mb-6">
            PointBridge Support<br />
            Email: legal@pointbridge.com<br />
            Website: www.pointbridge.com/contact
          </p>

          <div className="mt-12 p-6 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground text-center">
              By using PointBridge, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default TermsOfService;