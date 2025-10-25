import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Wallet,
  ArrowRight,
  CheckCircle,
  Star,
  Building2,
} from 'lucide-react';

interface CarouselSlide {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  icon: React.ComponentType<any>;
  color: string;
  features: string[];
  ctaText: string;
  ctaAction: () => void;
  badge?: string;
}

interface HomePageCarouselProps {
  onStartEarning: () => void;
  onJoinMerchant: () => void;
  onLearnMoreBenefits: () => void;
}

const HomePageCarousel: React.FC<HomePageCarouselProps> = ({
  onStartEarning,
  onJoinMerchant,
  onLearnMoreBenefits
}) => {
  const slides: CarouselSlide[] = [
    {
      id: 'rewards',
      title: 'Start Earning Rewards',
      subtitle: 'Join as a Customer',
      description: 'Earn loyalty rewards from your everyday purchases and unlock exclusive benefits.',
      icon: Wallet,
      color: 'from-blue-500 to-purple-500',
      features: [
        'Your Privacy is Protected',
        'Earn points on every purchase',
        'Exclusive member discounts',
        'Early access to new features'
      ],
      ctaText: 'Free Signup',
      ctaAction: onStartEarning,
      badge: 'Customer Signup'
    },
    {
      id: 'merchant',
      title: 'Join as a Merchant',
      subtitle: 'Partner with Us',
      description: 'Grow your business with our loyalty network and reach thousands of engaged customers.',
      icon: Building2,
      color: 'from-green-500 to-emerald-500',
      features: [
        'Access to 50K+ active customers',
        'Custom loyalty programs',
        'Advanced analytics dashboard',
        'Marketing support & tools'
      ],
      ctaText: 'Signup as Merchant',
      ctaAction: onJoinMerchant,
      badge: 'Business Signup'
    },
    {
      id: 'benefits',
      title: 'Exclusive Benefits',
      subtitle: 'Premium Features',
      description: 'Unlock premium features and exclusive benefits with our advanced membership tiers.',
      icon: Star,
      color: 'from-purple-500 to-pink-500',
      features: [
        'Higher reward multipliers',
        'Exclusive partner offers',
        'VIP customer support',
        'Special event invitations'
      ],
      ctaText: 'Learn More',
      ctaAction: onLearnMoreBenefits || onStartEarning
    }
  ];

  return (
    <div className="w-full max-w-6xl mx-auto">
      {/* 3-CARD LAYOUT */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {slides.map((slide) => (
          <Card key={slide.id} className="group cursor-pointer border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-lg overflow-hidden w-full h-[28rem] bg-gradient-to-br from-background to-primary/5">
            <CardContent className="p-6 h-full flex flex-col justify-between relative">
              {/* Badge - Top Right Corner */}
              {slide.badge && (
                <Badge variant="secondary" className="absolute top-4 right-4 bg-primary/10 text-primary border-primary/20 text-xs">
                  {slide.badge}
                </Badge>
              )}
              
              <div className="flex flex-col pt-2">
                {/* Header */}
                <div className="text-center space-y-4 mb-6">
                  {/* Icon */}
                  <div className={`w-16 h-16 rounded-full bg-gradient-to-r ${slide.color} flex items-center justify-center shadow-lg mx-auto group-hover:scale-110 transition-transform`}>
                    <slide.icon className="w-8 h-8 text-white" />
                  </div>
                  
                  {/* Title and Description */}
                  <div>
                    <h3 className="text-xl font-bold mb-1 text-primary">{slide.title}</h3>
                    <p className="text-sm text-muted-foreground mb-3">{slide.subtitle}</p>
                    <p className="text-sm text-muted-foreground">{slide.description}</p>
                  </div>
                </div>

                {/* Features */}
                <div className="space-y-2">
                  {slide.features.map((feature, featureIndex) => (
                    <div key={featureIndex} className="flex items-center text-sm">
                      <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* CTA Button */}
              <Button 
                className={`w-full bg-gradient-to-r ${slide.color} hover:opacity-90 transition-all duration-300 transform hover:scale-105 ring-2 ring-primary/20`}
                onClick={slide.ctaAction}
              >
                {slide.ctaText}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default HomePageCarousel;