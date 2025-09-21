import React, { useState, useEffect, useRef } from 'react';
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
  ArrowRight,
  CheckCircle,
  Star,
  Users,
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
  onLearnMoreBenefits?: () => void;
}

const HomePageCarousel: React.FC<HomePageCarouselProps> = ({
  onStartEarning,
  onJoinMerchant,
  onLearnMoreBenefits
}) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [api, setApi] = useState<any>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Auto-play configuration
  const AUTO_PLAY_INTERVAL = 4000; // 4 seconds

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

  // Auto-play functionality
  const startAutoPlay = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    intervalRef.current = setInterval(() => {
      if (!isHovered && api) {
        api.scrollNext();
      }
    }, AUTO_PLAY_INTERVAL);
  };

  const stopAutoPlay = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  // Listen to carousel API changes to update current slide
  useEffect(() => {
    if (!api) {
      return;
    }

    const onSelect = () => {
      setCurrentSlide(api.selectedScrollSnap());
    };

    api.on('select', onSelect);
    onSelect(); // Set initial state

    return () => {
      api.off('select', onSelect);
    };
  }, [api]);

  // Start auto-play on mount and when dependencies change
  useEffect(() => {
    if (api) {
      startAutoPlay();
    }
    return () => stopAutoPlay();
  }, [api, isHovered]);

  // Cleanup on unmount
  useEffect(() => {
    return () => stopAutoPlay();
  }, []);

  return (
    <div className="w-full max-w-6xl mx-auto">
      <Carousel
        className="w-full"
        setApi={setApi}
        opts={{
          align: "center",
          loop: true,
          skipSnaps: false,
          dragFree: false,
          slidesToScroll: 1,
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <CarouselContent className="-ml-2 md:-ml-4">
          {slides.map((slide, index) => {
            // For 3-card display, center is the middle card
            const isCenter = index === currentSlide;
            return (
              <CarouselItem key={slide.id} className="pl-2 md:pl-4 basis-full md:basis-1/2 lg:basis-1/3">
                <div className="p-1">
                  <Card className={`group cursor-pointer border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-lg overflow-hidden w-full h-[28rem] ${
                    isCenter 
                      ? 'shadow-xl border-primary/30 bg-gradient-to-br from-background to-primary/5' 
                      : ''
                  }`}>
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
                        {/* Icon - Consistent positioning */}
                        <div className={`w-16 h-16 rounded-full bg-gradient-to-r ${slide.color} flex items-center justify-center shadow-lg mx-auto group-hover:scale-110 transition-transform ${
                          isCenter ? 'scale-110' : ''
                        }`}>
                          <slide.icon className="w-8 h-8 text-white" />
                        </div>
                        
                        {/* Title and Description */}
                        <div>
                          <h3 className={`text-xl font-bold mb-1 ${isCenter ? 'text-primary' : ''}`}>{slide.title}</h3>
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
                      className={`w-full bg-gradient-to-r ${slide.color} hover:opacity-90 transition-all duration-300 transform hover:scale-105 ${
                        isCenter ? 'ring-2 ring-primary/20' : ''
                      }`}
                      onClick={slide.ctaAction}
                    >
                      {slide.ctaText}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </CarouselItem>
            );
          })}
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
            onClick={() => {
              if (api) {
                api.scrollTo(index);
              }
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default HomePageCarousel;
