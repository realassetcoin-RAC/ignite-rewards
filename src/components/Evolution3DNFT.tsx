import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Sparkles, 
  Zap, 
  Crown, 
  Star, 
  Gift,
  Eye,
  Download,
  Share2,
  Trophy,
  Target,
  TrendingUp
} from 'lucide-react';

interface Evolution3DNFT {
  id: string;
  user_id: string;
  original_nft_id: string;
  evolution_type: string;
  nft_name: string;
  description: string;
  rarity: string;
  evolution_level: number;
  investment_required: number;
  current_investment: number;
  is_evolved: boolean;
  evolved_at?: string;
  image_url: string;
  animation_url: string; // 3D model or animation URL
  metadata: {
    attributes: Array<{
      trait_type: string;
      value: string | number;
    }>;
    properties: {
      evolution_stage: string;
      special_effects: string[];
      rarity_multiplier: number;
    };
  };
  created_at: string;
}

interface Evolution3DNFTProps {
  userId: string;
  userInvestment: number;
  onEvolutionComplete: () => void;
}

export const Evolution3DNFT: React.FC<Evolution3DNFTProps> = ({
  userId,
  userInvestment,
  onEvolutionComplete
}) => {
  const { toast } = useToast();
  const [evolutionNFT, setEvolutionNFT] = useState<Evolution3DNFT | null>(null);
  const [loading, setLoading] = useState(true);
  const [evolving, setEvolving] = useState(false);
  const [show3DViewer, setShow3DViewer] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    loadEvolutionNFT();
  }, [userId]);

  const loadEvolutionNFT = async () => {
    try {
      const { data, error } = await supabase
        .from('evolution_3d_nfts')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      setEvolutionNFT(data);
    } catch (error) {
      console.error('Error loading evolution NFT:', error);
      toast({
        title: "Failed to Load Evolution NFT",
        description: "Could not load your evolution NFT data.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEvolution = async () => {
    if (!evolutionNFT) {
      toast({
        title: "No Evolution NFT Found",
        description: "You don't have an evolution NFT to evolve.",
        variant: "destructive"
      });
      return;
    }

    if (userInvestment < evolutionNFT.investment_required) {
      toast({
        title: "Insufficient Investment",
        description: `You need at least $${evolutionNFT.investment_required.toLocaleString()} invested to evolve your NFT.`,
        variant: "destructive"
      });
      return;
    }

    setEvolving(true);

    try {
      // Generate new 3D NFT with enhanced properties
      const evolvedNFT = await generateEvolved3DNFT(evolutionNFT);
      
      // Update the evolution NFT
      const { error: updateError } = await supabase
        .from('evolution_3d_nfts')
        .update({
          evolution_level: evolutionNFT.evolution_level + 1,
          is_evolved: true,
          evolved_at: new Date().toISOString(),
          metadata: evolvedNFT.metadata,
          animation_url: evolvedNFT.animation_url
        })
        .eq('id', evolutionNFT.id);

      if (updateError) {
        throw updateError;
      }

      toast({
        title: "Evolution Complete!",
        description: `Your NFT has evolved to level ${evolutionNFT.evolution_level + 1}!`,
        variant: "default"
      });

      onEvolutionComplete();
      loadEvolutionNFT();

    } catch (error) {
      console.error('Evolution error:', error);
      toast({
        title: "Evolution Failed",
        description: "Failed to evolve your NFT. Please try again.",
        variant: "destructive"
      });
    } finally {
      setEvolving(false);
    }
  };

  const generateEvolved3DNFT = async (currentNFT: Evolution3DNFT): Promise<Partial<Evolution3DNFT>> => {
    // Simulate 3D NFT generation with enhanced properties
    const newLevel = currentNFT.evolution_level + 1;
    const rarityMultiplier = getRarityMultiplier(currentNFT.rarity);
    
    const enhancedAttributes = [
      ...currentNFT.metadata.attributes,
      {
        trait_type: "Evolution Level",
        value: newLevel
      },
      {
        trait_type: "Power Level",
        value: Math.min(100, currentNFT.metadata.attributes.find(a => a.trait_type === "Power Level")?.value as number + 10 || 10)
      },
      {
        trait_type: "Special Ability",
        value: getSpecialAbility(newLevel)
      }
    ];

    const specialEffects = [
      ...currentNFT.metadata.properties.special_effects,
      getNewSpecialEffect(newLevel)
    ];

    return {
      metadata: {
        attributes: enhancedAttributes,
        properties: {
          evolution_stage: getEvolutionStage(newLevel),
          special_effects: specialEffects,
          rarity_multiplier: rarityMultiplier * (1 + newLevel * 0.1)
        }
      },
      animation_url: generate3DModelURL(newLevel, currentNFT.rarity)
    };
  };

  const getRarityMultiplier = (rarity: string): number => {
    switch (rarity.toLowerCase()) {
      case 'common': return 1.0;
      case 'less common': return 1.2;
      case 'rare': return 1.5;
      case 'very rare': return 2.0;
      default: return 1.0;
    }
  };

  const getSpecialAbility = (level: number): string => {
    const abilities = [
      'Energy Boost', 'Speed Enhancement', 'Power Surge', 'Shield Generation',
      'Time Manipulation', 'Reality Warping', 'Cosmic Awareness', 'Quantum Leap'
    ];
    return abilities[Math.min(level - 1, abilities.length - 1)];
  };

  const getNewSpecialEffect = (level: number): string => {
    const effects = [
      'Glowing Aura', 'Particle Trails', 'Holographic Overlay', 'Energy Waves',
      'Cosmic Sparkles', 'Reality Distortion', 'Quantum Fluctuations', 'Dimensional Rift'
    ];
    return effects[Math.min(level - 1, effects.length - 1)];
  };

  const getEvolutionStage = (level: number): string => {
    if (level <= 3) return 'Basic Evolution';
    if (level <= 6) return 'Advanced Evolution';
    if (level <= 9) return 'Master Evolution';
    return 'Legendary Evolution';
  };

  const generate3DModelURL = (level: number, rarity: string): string => {
    // In a real implementation, this would generate or select a 3D model
    // For now, we'll use placeholder URLs
    const baseURL = 'https://models.readyplayer.me/';
    const rarityCode = rarity.toLowerCase().replace(' ', '-');
    return `${baseURL}${rarityCode}-level-${level}.glb`;
  };

  const render3DModel = () => {
    // This would integrate with a 3D library like Three.js
    // For now, we'll show a placeholder
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Draw a simple 3D-like representation
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw a 3D-like shape
        ctx.fillStyle = '#8B5CF6';
        ctx.beginPath();
        ctx.arc(canvas.width / 2, canvas.height / 2, 80, 0, 2 * Math.PI);
        ctx.fill();
        
        // Add some 3D effects
        ctx.fillStyle = '#A78BFA';
        ctx.beginPath();
        ctx.arc(canvas.width / 2 - 20, canvas.height / 2 - 20, 60, 0, 2 * Math.PI);
        ctx.fill();
        
        // Add sparkles
        ctx.fillStyle = '#FDE047';
        for (let i = 0; i < 5; i++) {
          const x = Math.random() * canvas.width;
          const y = Math.random() * canvas.height;
          ctx.beginPath();
          ctx.arc(x, y, 3, 0, 2 * Math.PI);
          ctx.fill();
        }
      }
    }
  };

  useEffect(() => {
    if (show3DViewer && canvasRef.current) {
      render3DModel();
    }
  }, [show3DViewer, evolutionNFT]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-2">Loading evolution NFT...</span>
      </div>
    );
  }

  if (!evolutionNFT) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Sparkles className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">No Evolution NFT Found</h3>
          <p className="text-muted-foreground">
            You need to meet the minimum investment requirements to unlock your evolution NFT.
          </p>
        </CardContent>
      </Card>
    );
  }

  const evolutionProgress = (userInvestment / evolutionNFT.investment_required) * 100;
  const canEvolve = userInvestment >= evolutionNFT.investment_required && !evolutionNFT.is_evolved;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Evolution 3D NFT</h2>
        <p className="text-muted-foreground">
          Your evolved NFT with enhanced 3D properties and special effects.
        </p>
      </div>

      <Card className="border-primary bg-gradient-to-br from-primary/5 to-purple-500/5">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-primary" />
                {evolutionNFT.nft_name}
              </CardTitle>
              <CardDescription>{evolutionNFT.description}</CardDescription>
            </div>
            <Badge variant="outline" className="bg-primary/10">
              Level {evolutionNFT.evolution_level}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 3D NFT Display */}
          <div className="relative">
            <div className="aspect-square bg-gradient-to-br from-primary/20 to-purple-500/20 rounded-lg overflow-hidden">
              {show3DViewer ? (
                <canvas
                  ref={canvasRef}
                  width={400}
                  height={400}
                  className="w-full h-full"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <img
                    src={evolutionNFT.image_url}
                    alt={evolutionNFT.nft_name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                    <Button
                      variant="secondary"
                      onClick={() => setShow3DViewer(true)}
                      className="backdrop-blur-sm"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View 3D Model
                    </Button>
                  </div>
                </div>
              )}
            </div>
            
            {show3DViewer && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShow3DViewer(false)}
                className="absolute top-2 right-2"
              >
                <Eye className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Evolution Progress */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Evolution Progress</span>
              <span className="text-sm text-muted-foreground">
                ${userInvestment.toLocaleString()} / ${evolutionNFT.investment_required.toLocaleString()}
              </span>
            </div>
            <Progress value={Math.min(evolutionProgress, 100)} className="h-2" />
            <div className="text-xs text-muted-foreground">
              {canEvolve ? 'Ready to evolve!' : `${Math.round(evolutionProgress)}% complete`}
            </div>
          </div>

          {/* NFT Attributes */}
          <div className="space-y-3">
            <h4 className="font-semibold">Attributes</h4>
            <div className="grid grid-cols-2 gap-2">
              {evolutionNFT.metadata.attributes.map((attr, index) => (
                <div key={index} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{attr.trait_type}:</span>
                  <span className="font-medium">{attr.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Special Effects */}
          <div className="space-y-3">
            <h4 className="font-semibold">Special Effects</h4>
            <div className="flex flex-wrap gap-2">
              {evolutionNFT.metadata.properties.special_effects.map((effect, index) => (
                <Badge key={index} variant="secondary" className="bg-purple-100 text-purple-800">
                  <Sparkles className="h-3 w-3 mr-1" />
                  {effect}
                </Badge>
              ))}
            </div>
          </div>

          {/* Evolution Button */}
          <div className="pt-4">
            <Button
              onClick={handleEvolution}
              disabled={!canEvolve || evolving}
              className="w-full"
              size="lg"
            >
              {evolving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Evolving...
                </>
              ) : canEvolve ? (
                <>
                  <Zap className="h-4 w-4 mr-2" />
                  Evolve NFT
                </>
              ) : (
                <>
                  <Target className="h-4 w-4 mr-2" />
                  Continue Investing
                </>
              )}
            </Button>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="flex-1">
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
            <Button variant="outline" size="sm" className="flex-1">
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
