import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Eye, Lock, Database, UserCheck, FileText } from "lucide-react";

const Privacy = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-foreground">Privacy Policy</h1>
            <Button variant="outline" size="sm" asChild>
              <a href="/">Back to Home</a>
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="space-y-8">
          {/* Introduction */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Our Commitment to Privacy
              </CardTitle>
              <CardDescription>
                Last updated: {new Date().toLocaleDateString()}
              </CardDescription>
            </CardHeader>
            <CardContent className="prose prose-sm max-w-none">
              <p>
                At PointBridge, we are committed to protecting your privacy and ensuring the security of your personal information. 
                This Privacy Policy explains how we collect, use, and protect your data when you use our Web3 loyalty platform.
              </p>
            </CardContent>
          </Card>

          {/* Information We Collect */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Information We Collect
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <h4 className="font-medium">Personal Information</h4>
                <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                  <li>• Email address and full name</li>
                  <li>• Phone number (optional)</li>
                  <li>• Loyalty card information</li>
                  <li>• Transaction history and rewards data</li>
                </ul>
              </div>
              
              <div className="space-y-3">
                <h4 className="font-medium">Web3 and Blockchain Data</h4>
                <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                  <li>• Solana wallet addresses</li>
                  <li>• Encrypted seed phrases (stored securely)</li>
                  <li>• NFT and token holdings</li>
                  <li>• Blockchain transaction records</li>
                </ul>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium">Usage Information</h4>
                <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                  <li>• Device information and IP address</li>
                  <li>• Browser type and version</li>
                  <li>• Usage patterns and preferences</li>
                  <li>• Referral activity and codes</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* How We Use Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                How We Use Your Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Service Delivery</h4>
                  <p className="text-sm text-muted-foreground">
                    We use your information to provide loyalty services, process transactions, 
                    manage your rewards, and maintain your digital wallet.
                  </p>
                </div>

                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Communication</h4>
                  <p className="text-sm text-muted-foreground">
                    We may send you important updates about your account, new features, 
                    and promotional offers from our partner merchants.
                  </p>
                </div>

                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Security and Compliance</h4>
                  <p className="text-sm text-muted-foreground">
                    We use your data to prevent fraud, ensure platform security, 
                    and comply with legal and regulatory requirements.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Data Protection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                How We Protect Your Data
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Encryption</h4>
                  <p className="text-sm text-muted-foreground">
                    All sensitive data, including seed phrases, is encrypted using industry-standard AES-256 encryption.
                  </p>
                </div>

                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Secure Storage</h4>
                  <p className="text-sm text-muted-foreground">
                    Data is stored in secure, SOC 2 compliant data centers with advanced physical and digital security measures.
                  </p>
                </div>

                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Access Controls</h4>
                  <p className="text-sm text-muted-foreground">
                    Strict access controls ensure only authorized personnel can access user data, and all access is logged.
                  </p>
                </div>

                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Regular Audits</h4>
                  <p className="text-sm text-muted-foreground">
                    We conduct regular security audits and penetration testing to identify and address vulnerabilities.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* User Rights */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCheck className="h-5 w-5" />
                Your Rights and Choices
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <h4 className="font-medium">Data Access and Portability</h4>
                <p className="text-sm text-muted-foreground">
                  You can request a copy of all personal data we hold about you, and we'll provide it in a portable format.
                </p>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium">Data Correction</h4>
                <p className="text-sm text-muted-foreground">
                  You can update your personal information at any time through your dashboard or by contacting our support team.
                </p>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium">Data Deletion</h4>
                <p className="text-sm text-muted-foreground">
                  You can request deletion of your personal data, subject to legal and contractual obligations. 
                  Note that blockchain transactions cannot be deleted due to their immutable nature.
                </p>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium">Marketing Preferences</h4>
                <p className="text-sm text-muted-foreground">
                  You can opt out of marketing communications at any time by updating your preferences or clicking unsubscribe links.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Third Party Sharing */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Third-Party Sharing
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                We do not sell, trade, or rent your personal information to third parties. We may share data only in these limited circumstances:
              </p>
              
              <ul className="text-sm text-muted-foreground space-y-2 ml-4">
                <li>• <strong>Service Providers:</strong> With trusted partners who help us provide our services (payment processors, cloud storage, etc.)</li>
                <li>• <strong>Merchant Partners:</strong> Limited transaction data necessary to process rewards and verify purchases</li>
                <li>• <strong>Legal Requirements:</strong> When required by law, regulation, or court order</li>
                <li>• <strong>Business Transfers:</strong> In the event of a merger, acquisition, or sale of our business</li>
              </ul>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle>Contact Us</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                If you have any questions about this Privacy Policy or our data practices, please contact us:
              </p>
              
              <div className="space-y-2 text-sm">
                <p><strong>Email:</strong> privacy@pointbridge.com</p>
                <p><strong>Address:</strong> PointBridge Privacy Office, 123 Blockchain St, Web3 City, WC 12345</p>
                <p><strong>Response Time:</strong> We will respond to privacy inquiries within 30 days</p>
              </div>
            </CardContent>
          </Card>

          {/* Updates */}
          <Card>
            <CardHeader>
              <CardTitle>Policy Updates</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                We may update this Privacy Policy from time to time to reflect changes in our practices or legal requirements. 
                We will notify users of significant changes via email or platform notifications. The "Last Updated" date at the top 
                of this policy indicates when the most recent changes were made.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Privacy;