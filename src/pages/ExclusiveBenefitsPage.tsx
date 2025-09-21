import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Star, 
  Crown, 
  Gift, 
  Shield, 
  Zap, 
  Users, 
  ArrowLeft,
  CheckCircle,
  Trophy,
  Diamond,
  Heart,
  Wallet,
  Coins,
  Lock,
  Eye,
  Clock,
  TrendingUp,
  Building2,
  Smartphone,
  QrCode,
  BarChart3,
  MessageSquare,
  Globe
} from 'lucide-react';
import { useSecureAuth } from '@/hooks/useSecureAuth';

const ExclusiveBenefitsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useSecureAuth();
  const [selectedCategory, setSelectedCategory] = useState<'nft' | 'merchant' | 'privacy'>('nft');

  const nftCardTiers = {
    pearl: {
      name: 'Pearl White',
      rarity: 'Common',
      icon: Star,
      color: 'from-gray-100 to-gray-300',
      price: 'Free',
      description: 'Your entry to the RAC Rewards ecosystem',
      features: [
        '1.0% earning ratio on spend',
        'Basic loyalty rewards',
        '30-day point vesting',
        'Privacy-first design',
        'Unique 8-character loyalty number'
      ],
      mintQuantity: 1000
    },
    lava: {
      name: 'Lava Orange',
      rarity: 'Less Common',
      icon: Zap,
      color: 'from-orange-400 to-red-500',
      price: '100 USDT',
      description: 'Enhanced earning potential with upgrade bonuses',
      features: [
        '1.5% earning ratio on spend',
        'Upgrade bonus available',
        'Evolution investment: $100',
        'Auto-staking: Forever',
        'Fractional investment eligible'
      ],
      mintQuantity: 500
    },
    pink: {
      name: 'Pink',
      rarity: 'Less Common',
      icon: Heart,
      color: 'from-pink-400 to-rose-500',
      price: '100 USDT',
      description: 'Premium features with enhanced benefits',
      features: [
        '1.5% earning ratio on spend',
        'Upgrade bonus available',
        'Evolution investment: $100',
        'Auto-staking: Forever',
        'Fractional investment eligible'
      ],
      mintQuantity: 500
    },
    silver: {
      name: 'Silver',
      rarity: 'Rare',
      icon: Trophy,
      color: 'from-gray-300 to-gray-500',
      price: '200 USDT',
      description: 'Rare tier with significant earning potential',
      features: [
        '2.0% earning ratio on spend',
        'Upgrade bonus available',
        'Evolution investment: $150',
        'Auto-staking: Forever',
        'Fractional investment eligible'
      ],
      mintQuantity: 1000
    },
    gold: {
      name: 'Gold',
      rarity: 'Rare',
      icon: Crown,
      color: 'from-yellow-400 to-yellow-600',
      price: '300 USDT',
      description: 'Premium tier with maximum benefits',
      features: [
        '2.5% earning ratio on spend',
        'Upgrade bonus available',
        'Evolution investment: $150',
        'Auto-staking: Forever',
        'Fractional investment eligible'
      ],
      mintQuantity: 1000
    },
    black: {
      name: 'Black',
      rarity: 'Very Rare',
      icon: Diamond,
      color: 'from-gray-800 to-black',
      price: '500 USDT',
      description: 'Ultimate tier with exclusive privileges',
      features: [
        '3.0% earning ratio on spend',
        'Upgrade bonus available',
        'Evolution investment: $200',
        'Auto-staking: Forever',
        'Fractional investment eligible'
      ],
      mintQuantity: 2500
    }
  };

  const merchantPlans = {
    free: {
      name: 'Free Trial',
      icon: Gift,
      color: 'from-green-500 to-emerald-500',
      price: '$0',
      description: '14-day full access trial',
      features: [
        'Full platform access for 14 days',
        'Up to 10 transactions',
        'Basic customer management',
        'Email support',
        'Basic analytics dashboard',
        'QR code generation',
        'Mobile app access'
      ],
      points: 100,
      transactions: 10
    },
    starter: {
      name: 'Starter',
      icon: Building2,
      color: 'from-blue-500 to-cyan-500',
      price: '$29.99/mo',
      description: 'Perfect for small businesses',
      features: [
        'Basic loyalty program setup',
        'Up to 100 transactions per month',
        'Customer database management',
        'Email support (24-48 hour response)',
        'Basic analytics and reporting',
        'QR code generation',
        'Mobile app for customers',
        'Basic email marketing tools',
        'Social media integration',
        'Up to 2 staff accounts'
      ],
      points: 1000,
      transactions: 100
    },
    growth: {
      name: 'Growth',
      icon: TrendingUp,
      color: 'from-purple-500 to-pink-500',
      price: '$79.99/mo',
      description: 'Ideal for growing businesses',
      features: [
        'Advanced loyalty features',
        'Up to 500 transactions per month',
        'Priority support',
        'API access',
        'Advanced analytics',
        'Custom branding',
        'Integration with popular tools',
        'Up to 5 staff accounts',
        'Advanced email marketing',
        'Customer segmentation'
      ],
      points: 5000,
      transactions: 500
    },
    professional: {
      name: 'Professional',
      icon: Crown,
      color: 'from-yellow-500 to-orange-500',
      price: '$199.99/mo',
      description: 'For established businesses',
      features: [
        'Enterprise features',
        'Up to 1,500 transactions per month',
        '24/7 support',
        'White-label options',
        'Advanced reporting',
        'Custom integrations',
        'Dedicated account manager',
        'Up to 10 staff accounts',
        'Advanced automation',
        'Multi-location support'
      ],
      points: 15000,
      transactions: 1500
    },
    enterprise: {
      name: 'Enterprise',
      icon: Diamond,
      color: 'from-red-500 to-pink-500',
      price: '$499.99/mo',
      description: 'For large enterprises',
      features: [
        'Custom solutions',
        'Unlimited transactions',
        'Dedicated support',
        'Full customization',
        'Enterprise integrations',
        'Custom development',
        'Dedicated infrastructure',
        'Unlimited staff accounts',
        'Advanced security features',
        'Compliance support'
      ],
      points: 50000,
      transactions: 5000
    }
  };

  const privacyFeatures = [
    {
      icon: Shield,
      title: 'Privacy-First Design',
      description: 'No phone numbers, no personal data collection. Your privacy is protected while you earn rewards.',
      color: 'text-green-500'
    },
    {
      icon: Lock,
      title: '30-Day Point Vesting',
      description: 'All loyalty points vest after 30 days, protecting against merchant reversals and ensuring fair rewards.',
      color: 'text-blue-500'
    },
    {
      icon: Eye,
      title: 'Zero-Knowledge Architecture',
      description: 'Advanced encryption ensures your spending patterns and personal data remain completely private.',
      color: 'text-purple-500'
    },
    {
      icon: Wallet,
      title: 'Custodial & Non-Custodial Options',
      description: 'Choose between platform-managed or self-custody NFT cards based on your preference.',
      color: 'text-orange-500'
    },
    {
      icon: Clock,
      title: '5-Minute Inactivity Logout',
      description: 'Automatic logout after 5 minutes of inactivity for maximum security and privacy protection.',
      color: 'text-red-500'
    },
    {
      icon: Globe,
      title: 'Global Spending',
      description: 'Earn rewards on purchases worldwide while maintaining complete privacy and security.',
      color: 'text-indigo-500'
    }
  ];

  const coreFeatures = [
    {
      icon: Coins,
      title: 'NFT-Based Loyalty Cards',
      description: 'Unique NFT loyalty cards with different rarities, earning ratios, and exclusive benefits.',
      color: 'text-yellow-500'
    },
    {
      icon: QrCode,
      title: 'QR Code Transactions',
      description: 'Three ways to earn: scan merchant QR codes, have merchants scan your code, or use ecommerce API.',
      color: 'text-blue-500'
    },
    {
      icon: Users,
      title: 'Referral System',
      description: 'Earn bonus points by referring friends with automatic settlement and campaign caps.',
      color: 'text-green-500'
    },
    {
      icon: BarChart3,
      title: 'Advanced Analytics',
      description: 'Comprehensive dashboard with spending insights, reward tracking, and merchant analytics.',
      color: 'text-purple-500'
    },
    {
      icon: MessageSquare,
      title: 'DAO Governance',
      description: 'Community-driven platform changes through decentralized voting and proposal system.',
      color: 'text-pink-500'
    },
    {
      icon: Smartphone,
      title: 'Mobile-First Experience',
      description: 'Seamless mobile app with wallet integration, transaction history, and real-time notifications.',
      color: 'text-indigo-500'
    }
  ];

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Enhanced Dynamic Background matching home page */}
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
      <div className="relative z-50 bg-background/80 backdrop-blur-md border-b border-border/50 sticky top-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <div className="flex items-center gap-2">
              <Coins className="w-5 h-5 text-purple-500" />
              <span className="font-semibold text-lg">RAC Rewards Benefits</span>
            </div>
            <div className="w-20" /> {/* Spacer for centering */}
          </div>
        </div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Shield className="w-4 h-4" />
            Privacy-First Loyalty
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
            Earn
            <span className="bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent block">
              Privately
            </span>
            <span className="block">Spend Globally</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            The world's first privacy-first loyalty program. No phone numbers, no personal data, 
            just pure rewards that vest in 30 days. Your privacy, your choice.
          </p>
        </div>

        {/* Category Tabs */}
        <div className="flex justify-center mb-12">
          <div className="bg-background/80 backdrop-blur-sm rounded-lg p-1 shadow-sm border border-border/50">
            <div className="flex gap-1">
              {[
                { key: 'nft', label: 'NFT Cards', icon: Coins },
                { key: 'merchant', label: 'Merchant Plans', icon: Building2 },
                { key: 'privacy', label: 'Privacy Features', icon: Shield }
              ].map(({ key, label, icon: Icon }) => (
                <Button
                  key={key}
                  variant={selectedCategory === key ? 'default' : 'ghost'}
                  onClick={() => setSelectedCategory(key as any)}
                  className="flex items-center gap-2"
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* NFT Card Tiers */}
        {selectedCategory === 'nft' && (
          <div className="mb-20">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-foreground mb-4">NFT Loyalty Cards</h2>
              <p className="text-lg text-muted-foreground">Choose your NFT card tier and unlock exclusive earning potential</p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Object.entries(nftCardTiers).map(([key, tier]) => {
                const IconComponent = tier.icon;
                return (
                  <Card key={key} className="group hover:shadow-lg transition-all duration-300 bg-background/80 backdrop-blur-sm border-border/50">
                    <CardHeader className="text-center pb-4">
                      <div className={`w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r ${tier.color} flex items-center justify-center`}>
                        <IconComponent className="w-8 h-8 text-white" />
                      </div>
                      <CardTitle className="text-xl">{tier.name}</CardTitle>
                      <Badge variant="outline" className="w-fit mx-auto">
                        {tier.rarity}
                      </Badge>
                      <CardDescription className="text-lg font-semibold text-foreground">
                        {tier.price}
                      </CardDescription>
                      <p className="text-sm text-muted-foreground">{tier.description}</p>
                    </CardHeader>
                    
                    <CardContent>
                      <ul className="space-y-2 mb-4">
                        {tier.features.map((feature, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                            <span className="text-sm">{feature}</span>
                          </li>
                        ))}
                      </ul>
                      
                      <div className="text-center text-xs text-muted-foreground mb-4">
                        Mint Quantity: {tier.mintQuantity.toLocaleString()}
                      </div>
                      
                      <Button 
                        className={`w-full bg-gradient-to-r ${tier.color} hover:opacity-90`}
                        onClick={() => {
                          if (user) {
                            navigate('/dashboard');
                          } else {
                            navigate('/');
                          }
                        }}
                      >
                        {user ? 'View in Dashboard' : 'Get Started'}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Merchant Plans */}
        {selectedCategory === 'merchant' && (
          <div className="mb-20">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-foreground mb-4">Merchant Subscription Plans</h2>
              <p className="text-lg text-muted-foreground">Join our network and grow your business with loyalty rewards</p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Object.entries(merchantPlans).map(([key, plan]) => {
                const IconComponent = plan.icon;
                return (
                  <Card key={key} className="group hover:shadow-lg transition-all duration-300 bg-background/80 backdrop-blur-sm border-border/50">
                    <CardHeader className="text-center pb-4">
                      <div className={`w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r ${plan.color} flex items-center justify-center`}>
                        <IconComponent className="w-8 h-8 text-white" />
                      </div>
                      <CardTitle className="text-xl">{plan.name}</CardTitle>
                      <CardDescription className="text-lg font-semibold text-foreground">
                        {plan.price}
                      </CardDescription>
                      <p className="text-sm text-muted-foreground">{plan.description}</p>
                    </CardHeader>
                    
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4 mb-4 text-center">
                        <div className="bg-blue-50 rounded-lg p-3">
                          <div className="text-2xl font-bold text-blue-600">{plan.points.toLocaleString()}</div>
                          <div className="text-xs text-blue-600">Monthly Points</div>
                        </div>
                        <div className="bg-green-50 rounded-lg p-3">
                          <div className="text-2xl font-bold text-green-600">{plan.transactions.toLocaleString()}</div>
                          <div className="text-xs text-green-600">Transactions</div>
                        </div>
                      </div>
                      
                      <ul className="space-y-2 mb-4">
                        {plan.features.slice(0, 5).map((feature, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                            <span className="text-sm">{feature}</span>
                          </li>
                        ))}
                        {plan.features.length > 5 && (
                          <li className="text-xs text-muted-foreground">
                            +{plan.features.length - 5} more features
                          </li>
                        )}
                      </ul>
                      
                      <Button 
                        className={`w-full bg-gradient-to-r ${plan.color} hover:opacity-90`}
                        onClick={() => navigate('/subscription-plans')}
                      >
                        View Plan Details
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Privacy Features */}
        {selectedCategory === 'privacy' && (
          <div className="mb-20">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-foreground mb-4">Privacy-First Features</h2>
              <p className="text-lg text-muted-foreground">Your privacy is our priority. Earn rewards without compromising your data.</p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {privacyFeatures.map((feature, index) => {
                const IconComponent = feature.icon;
                return (
                  <Card key={index} className="group hover:shadow-lg transition-all duration-300 bg-background/80 backdrop-blur-sm border-border/50">
                    <CardContent className="p-6">
                      <div className={`w-12 h-12 rounded-lg bg-gradient-to-r from-gray-100 to-gray-200 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                        <IconComponent className={`w-6 h-6 ${feature.color}`} />
                      </div>
                      <h3 className="text-xl font-semibold text-foreground mb-2">{feature.title}</h3>
                      <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Core Features */}
        <div className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">Core Platform Features</h2>
            <p className="text-lg text-muted-foreground">Everything you need for a complete loyalty rewards experience</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {coreFeatures.map((feature, index) => {
              const IconComponent = feature.icon;
              return (
                <Card key={index} className="group hover:shadow-lg transition-all duration-300 bg-background/80 backdrop-blur-sm border-border/50">
                  <CardContent className="p-6">
                    <div className={`w-12 h-12 rounded-lg bg-gradient-to-r from-gray-100 to-gray-200 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                      <IconComponent className={`w-6 h-6 ${feature.color}`} />
                    </div>
                    <h3 className="text-xl font-semibold text-foreground mb-2">{feature.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center bg-gradient-to-r from-slate-800 via-slate-700 to-slate-600 rounded-2xl p-12 text-white shadow-2xl border border-slate-500/20">
          <Coins className="w-16 h-16 mx-auto mb-6 text-amber-400" />
          <h2 className="text-3xl font-bold mb-4 text-white">Ready to Start Earning Privately?</h2>
          <p className="text-xl mb-8 text-slate-200 max-w-2xl mx-auto">
            Join the world's first privacy-first loyalty program. No personal data, just pure rewards.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              variant="secondary"
              onClick={() => navigate('/subscription-plans')}
              className="bg-amber-500 hover:bg-amber-600 text-white shadow-lg border-0"
            >
              <Building2 className="w-5 h-5 mr-2" />
              Merchant Plans
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              onClick={() => {
                // Navigate to home page with signup parameter to trigger modal
                navigate('/?signup=true');
              }}
              className="border-slate-300 text-white hover:bg-slate-600 hover:border-slate-400 shadow-lg"
            >
              <Wallet className="w-5 h-5 mr-2" />
              Start Free
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExclusiveBenefitsPage;
