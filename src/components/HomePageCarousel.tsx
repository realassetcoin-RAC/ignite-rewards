import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import {
  Wallet,
  TrendingUp,
  Globe,
  ArrowRight,
  CheckCircle,
  Star,
  Users,
  Shield,
  Zap,
  Building2,
  Coins,
  Gift
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
}

const HomePageCarousel: React.FC<HomePageCarouselProps> = ({
  onStartEarning,
  onJoinMerchant
}) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides: CarouselSlide[] = [
    {
      id: 'rewards',
      title: 'Start Earning Rewards',
      subtitle: 'Join as a Customer',
      description: 'Earn loyalty rewards from your everyday purchases and unlock exclusive benefits.',
      icon: Wallet,
      color: 'from-blue-500 to-purple-500',
      features: [
        'Earn points on every purchase',
        'Exclusive member discounts',
        'Priority customer support',
        'Early access to new features'
      ],
      ctaText: 'Free Signup',
      ctaAction: onStartEarning,
      badge: 'For Customers'
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
      badge: 'For Businesses'
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
      ctaAction: onStartEarning
    },
    {
      id: 'community',
      title: 'Join Our Community',
      subtitle: 'Connect & Grow',
      description: 'Be part of a thriving community of customers and merchants working together.',
      icon: Users,
      color: 'from-orange-500 to-red-500',
      features: [
        '50K+ active members',
        'Community events',
        'Networking opportunities',
        'Shared success stories'
      ],
      ctaText: 'Join Community',
      ctaAction: onStartEarning
    }
  ];

  return (
    <div className="w-full max-w-4xl mx-auto">
      <Carousel
        className="w-full"
        opts={{
          align: "center",
          loop: true,
          skipSnaps: false,
          dragFree: false,
        }}
        onSelect={(index) => setCurrentSlide(index || 0)}
      >
        <CarouselContent className="-ml-2 md:-ml-4">
          {slides.map((slide, index) => (
            <CarouselItem key={slide.id} className="pl-2 md:pl-4 basis-full">
              <div className="p-1">
                <Card className="group cursor-pointer border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-lg overflow-hidden h-full max-w-sm mx-auto">
                  <CardContent className="p-6 h-full flex flex-col">
                    {/* Header */}
                    <div className="text-center space-y-4 mb-6">
                      {slide.badge && (
                        <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                          {slide.badge}
                        </Badge>
                      )}
                      
                      <div className={`w-16 h-16 rounded-full bg-gradient-to-r ${slide.color} flex items-center justify-center shadow-lg mx-auto group-hover:scale-110 transition-transform`}>
                        <slide.icon className="w-8 h-8 text-white" />
                      </div>
                      
                      <div>
                        <h3 className="text-xl font-bold mb-1">{slide.title}</h3>
                        <p className="text-sm text-muted-foreground mb-3">{slide.subtitle}</p>
                        <p className="text-sm text-muted-foreground">{slide.description}</p>
                      </div>
                    </div>

                    {/* Features */}
                    <div className="space-y-2 flex-grow">
                      {slide.features.map((feature, featureIndex) => (
                        <div key={featureIndex} className="flex items-center text-sm">
                          <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>

                    {/* CTA Button */}
                    <Button 
                      className={`w-full mt-6 bg-gradient-to-r ${slide.color} hover:opacity-90 transition-all duration-300 transform hover:scale-105`}
                      onClick={slide.ctaAction}
                    >
                      {slide.ctaText}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="hidden md:flex -left-12" />
        <CarouselNext className="hidden md:flex -right-12" />
      </Carousel>

      {/* Slide Indicators */}
      <div className="flex justify-center space-x-2 mt-6">
        {slides.map((_, index) => (
          <button
            key={index}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              index === currentSlide 
                ? 'bg-primary w-8' 
                : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
            }`}
            onClick={() => setCurrentSlide(index)}
          />
        ))}
      </div>
    </div>
  );
};

export default HomePageCarousel;
