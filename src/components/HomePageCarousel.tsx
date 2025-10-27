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
  Building2
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
  const [api, setApi] = useState<any>(null);
  const [current, setCurrent] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const currentRef = useRef(0);

  // Update ref when current changes
  useEffect(() => {
    currentRef.current = current;
  }, [current]);

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
      id: 'nft',
      title: 'NFT Rewards',
      subtitle: 'Digital Collectibles',
      description: 'Earn unique NFT rewards and digital collectibles as part of your loyalty journey.',
      icon: Star,
      color: 'from-orange-500 to-red-500',
      features: [
        'Exclusive NFT collections',
        'Rare digital rewards',
        'Tradable on marketplace',
        'Limited edition drops'
      ],
      ctaText: 'Explore NFTs',
      ctaAction: onStartEarning,
      badge: 'Coming Soon'
    }
  ];

  // Auto-play functionality
  useEffect(() => {
    if (!api || !isPlaying) return;
    
    const interval = setInterval(() => {
      if (api) {
        const nextSlide = (currentRef.current + 1) % slides.length;
        api.scrollTo(nextSlide);
      }
    }, 4000); // Change slide every 4 seconds

    return () => {
      clearInterval(interval);
    };
  }, [api, isPlaying]);

  // Track current slide
  useEffect(() => {
    if (!api) return;
    
    const onSelect = () => {
      setCurrent(api.selectedScrollSnap());
    };

    api.on('select', onSelect);
    onSelect(); // Set initial state

    return () => {
      api.off('select', onSelect);
    };
  }, [api]);

  return (
    <div className="w-full max-w-6xl mx-auto">
      <div 
        className="relative"
        onMouseEnter={() => setIsPlaying(false)}
        onMouseLeave={() => setIsPlaying(true)}
      >
        <Carousel
          setApi={setApi}
          opts={{
            align: "start",
            loop: true,
            skipSnaps: false,
            dragFree: false,
            containScroll: "trimSnaps",
            slidesToScroll: 1,
          }}
          className="w-full"
        >
          <CarouselContent className="-ml-2 md:-ml-4">
            {slides.map((slide) => (
              <CarouselItem key={slide.id} className="pl-2 md:pl-4 basis-full md:basis-1/2 lg:basis-1/3">
                <Card className="group cursor-pointer border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-lg overflow-hidden w-full h-[28rem] bg-gradient-to-br from-background to-primary/5 hover:shadow-xl">
                  <CardContent className="p-6 h-full flex flex-col justify-between relative">
                    {slide.badge && (
                      <Badge variant="secondary" className="absolute top-4 right-4 bg-primary/10 text-primary border-primary/20 text-xs">
                        {slide.badge}
                      </Badge>
                    )}
                    <div className="flex flex-col pt-2">
                      <div className="text-center space-y-4 mb-6">
                        <div className={`w-16 h-16 rounded-full bg-gradient-to-r ${slide.color} flex items-center justify-center shadow-lg mx-auto group-hover:scale-110 transition-transform`}>
                          <slide.icon className="w-8 h-8 text-white" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold mb-1">{slide.title}</h3>
                          <p className="text-sm text-muted-foreground mb-3">{slide.subtitle}</p>
                          <p className="text-sm text-muted-foreground">{slide.description}</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        {slide.features.map((feature, featureIndex) => (
                          <div key={featureIndex} className="flex items-center text-sm">
                            <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                            <span>{feature}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <Button
                      className={`w-full bg-gradient-to-r ${slide.color} hover:opacity-90 transition-all duration-300 transform hover:scale-105`}
                      onClick={slide.ctaAction}
                    >
                      {slide.ctaText}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </CardContent>
                </Card>
              </CarouselItem>
            ))}
          </CarouselContent>
          
          {/* Navigation arrows inside carousel component */}
          <CarouselPrevious className="absolute -left-12 top-1/2 -translate-y-1/2 z-10 bg-background/90 hover:bg-background border-2 shadow-lg" />
          <CarouselNext className="absolute -right-12 top-1/2 -translate-y-1/2 z-10 bg-background/90 hover:bg-background border-2 shadow-lg" />
        </Carousel>
      </div>
      
      {/* Dots indicator */}
      <div className="flex justify-center mt-6 space-x-2">
        {slides.map((_, index) => (
          <button
            key={index}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              current === index ? 'bg-primary w-8' : 'bg-muted-foreground/30'
            }`}
            onClick={() => api?.scrollTo(index)}
          />
        ))}
      </div>
    </div>
  );
};

export default HomePageCarousel;