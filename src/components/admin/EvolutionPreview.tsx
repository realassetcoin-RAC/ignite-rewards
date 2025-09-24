/**
 * ✅ IMPLEMENT REQUIREMENT: Evolution system preview component for admin dashboard
 * Shows both standard and evolved NFT versions with file format validation
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Image as ImageIcon, FileImage } from 'lucide-react';

interface EvolutionPreviewProps {
  standardImageUrl: string;
  evolutionImageUrl?: string;
  cardName: string;
  rarity: string;
}

const EvolutionPreview: React.FC<EvolutionPreviewProps> = ({
  standardImageUrl,
  evolutionImageUrl,
  cardName,
  rarity
}) => {
  const getFileFormat = (url: string) => {
    const match = url.match(/\.([a-zA-Z0-9]+)(\?.*)?$/);
    return match ? match[1].toLowerCase() : 'unknown';
  };

  const isValidStandardFormat = (url: string) => {
    const format = getFileFormat(url);
    return ['jpg', 'jpeg', 'png'].includes(format);
  };

  const isValidEvolutionFormat = (url: string) => {
    const format = getFileFormat(url);
    return format === 'gif';
  };

  const rarityColors = {
    'Common': 'bg-gray-500',
    'Rare': 'bg-blue-500',
    'Epic': 'bg-purple-500',
    'Legendary': 'bg-yellow-500',
    'Mythic': 'bg-red-500'
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Standard NFT Preview */}
      <Card className="overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <ImageIcon className="w-5 h-5" />
              Standard Version
            </CardTitle>
            <Badge variant="outline" className={`text-white ${rarityColors[rarity as keyof typeof rarityColors] || 'bg-gray-500'}`}>
              {rarity}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {standardImageUrl ? (
            <>
              <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg overflow-hidden">
                <img 
                  src={standardImageUrl} 
                  alt={`${cardName} - Standard`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    target.nextElementSibling?.classList.remove('hidden');
                  }}
                />
                <div className="hidden flex items-center justify-center h-full text-gray-500">
                  <div className="text-center">
                    <FileImage className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Image not available</p>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Format:</span>
                  <Badge variant={isValidStandardFormat(standardImageUrl) ? "default" : "destructive"}>
                    .{getFileFormat(standardImageUrl)}
                  </Badge>
                </div>
                {!isValidStandardFormat(standardImageUrl) && (
                  <p className="text-xs text-red-600">
                    ⚠️ Invalid format. Use .jpg, .jpeg, or .png for standard cards
                  </p>
                )}
              </div>
            </>
          ) : (
            <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
              <div className="text-center text-gray-500">
                <FileImage className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No standard image URL provided</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Evolution NFT Preview */}
      <Card className="overflow-hidden border-2 border-dashed border-purple-300 bg-gradient-to-br from-purple-50 to-pink-50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-600" />
              Evolution Version (3D)
            </CardTitle>
            <Badge variant="secondary" className="bg-purple-100 text-purple-700">
              Animated
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {evolutionImageUrl && evolutionImageUrl.trim() ? (
            <>
              <div className="aspect-video bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg overflow-hidden relative">
                <img 
                  src={evolutionImageUrl} 
                  alt={`${cardName} - Evolution`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    target.nextElementSibling?.classList.remove('hidden');
                  }}
                />
                <div className="hidden flex items-center justify-center h-full text-purple-500">
                  <div className="text-center">
                    <Sparkles className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Evolution image not available</p>
                  </div>
                </div>
                {/* Animated indicator */}
                <div className="absolute top-2 right-2">
                  <Badge variant="secondary" className="bg-purple-600 text-white text-xs">
                    3D GIF
                  </Badge>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Format:</span>
                  <Badge variant={isValidEvolutionFormat(evolutionImageUrl) ? "default" : "destructive"}>
                    .{getFileFormat(evolutionImageUrl)}
                  </Badge>
                </div>
                {!isValidEvolutionFormat(evolutionImageUrl) && (
                  <p className="text-xs text-red-600">
                    ⚠️ Invalid format. Use .gif for 3D animated evolution cards
                  </p>
                )}
                <div className="bg-purple-100 p-3 rounded-lg">
                  <h4 className="text-sm font-medium text-purple-900 mb-1">Evolution Benefits:</h4>
                  <ul className="text-xs text-purple-700 space-y-1">
                    <li>• Enhanced earning ratios</li>
                    <li>• 3D animated visual effects</li>
                    <li>• Exclusive evolution wallet</li>
                    <li>• Premium staking access</li>
                  </ul>
                </div>
              </div>
            </>
          ) : (
            <div className="aspect-video bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg flex items-center justify-center">
              <div className="text-center text-purple-500">
                <Sparkles className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No evolution image URL provided</p>
                <p className="text-xs text-purple-400 mt-1">Add a .gif URL to enable evolution</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EvolutionPreview;
