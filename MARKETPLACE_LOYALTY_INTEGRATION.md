# Marketplace & Loyalty Platform Integration

## Overview

The marketplace feature integrates with your existing loyalty platform's NFT system instead of creating duplicate NFT management. This ensures a single source of truth for NFT ownership while providing marketplace-specific benefits.

## Architecture

### 🎯 Single Source of Truth
- **NFT Ownership**: Managed by the loyalty platform (`user_loyalty_cards` table)
- **Marketplace Benefits**: Mapped in the marketplace system (`nft_card_tiers` table)
- **Integration**: Marketplace queries loyalty platform for NFT ownership

### 🔄 Data Flow
```
Loyalty Platform → Marketplace Integration → User Benefits
     ↓                    ↓                      ↓
user_loyalty_cards → nftCardIntegration.ts → Investment Multipliers
```

## Database Schema

### Loyalty Platform Tables (Existing)
```sql
-- Your existing loyalty NFT system
user_loyalty_cards (
  id,
  user_id,
  loyalty_number,
  card_type,        -- Maps to marketplace tiers
  tier,            -- Alternative tier field
  is_active,
  created_at
)
```

### Marketplace Tables (New)
```sql
-- Marketplace benefit mappings
nft_card_tiers (
  tier_name,                    -- Maps to loyalty platform card_type/tier
  display_name,                 -- User-friendly name
  description,                  -- Benefit description
  investment_multiplier,        -- 1.0x to 1.75x multiplier
  can_access_premium_listings,  -- Premium access flag
  can_access_early_listings     -- Early access flag
)
```

## NFT Tier Mapping

### Current Tier Structure
| Loyalty Platform | Marketplace Display | Multiplier | Premium Access | Early Access |
|------------------|-------------------|------------|----------------|--------------|
| `basic`          | Basic             | 1.00x      | ❌             | ❌           |
| `standard`       | Standard          | 1.10x      | ❌             | ❌           |
| `premium`        | Premium           | 1.25x      | ✅             | ❌           |
| `premium_plus`   | Premium+          | 1.35x      | ✅             | ❌           |
| `vip`            | VIP               | 1.50x      | ✅             | ✅           |
| `vip_plus`       | VIP+              | 1.75x      | ✅             | ✅           |

## Integration Code

### Core Integration Function
```typescript
// src/lib/nftCardIntegration.ts
export async function checkUserNFTCardStatus(userId: string): Promise<NFTCardCheckResult> {
  // Query loyalty platform's NFT ownership
  const { data: userNfts } = await supabase
    .from('user_loyalty_cards')
    .select('id, loyalty_number, card_type, tier, is_active, created_at')
    .eq('user_id', userId)
    .eq('is_active', true);

  // Map to marketplace benefits
  const ownedNfts = userNfts.map(nft => ({
    id: nft.id,
    tier: nft.tier || nft.card_type || 'basic',
    multiplier: MARKETPLACE_BENEFITS[nft.tier]?.multiplier || 1.0,
    // ... other benefits
  }));

  // Return highest benefits
  return {
    success: true,
    status: {
      hasNftCard: ownedNfts.length > 0,
      ownedNfts,
      multiplier: Math.max(...ownedNfts.map(nft => nft.multiplier)),
      // ... other status
    }
  };
}
```

### Benefit Calculation
```typescript
// Calculate effective investment with NFT multiplier
export function calculateEffectiveInvestment(
  baseAmount: number,
  nftMultiplier: number
): number {
  return baseAmount * nftMultiplier;
}

// Calculate tokens received with multiplier
export function calculateTokensWithMultiplier(
  investmentAmount: number,
  tokenPrice: number,
  nftMultiplier: number
): number {
  const effectiveAmount = calculateEffectiveInvestment(investmentAmount, nftMultiplier);
  return Math.floor(effectiveAmount / tokenPrice);
}
```

## Component Integration

### Investment Modal
```typescript
// src/components/marketplace/InvestmentModal.tsx
const InvestmentModal = ({ listing, isOpen, onClose }) => {
  const [nftStatus, setNftStatus] = useState<UserNFTCardStatus | null>(null);
  
  // Load NFT status from loyalty platform
  useEffect(() => {
    if (isOpen) {
      loadNFTStatus();
    }
  }, [isOpen]);

  const loadNFTStatus = async () => {
    const userId = getCurrentUserId(); // From auth context
    const result = await checkUserNFTCardStatus(userId);
    if (result.success) {
      setNftStatus(result.status);
    }
  };

  // Calculate benefits
  const nftMultiplier = nftStatus?.multiplier || 1.0;
  const effectiveAmount = calculateEffectiveInvestment(investmentAmount, nftMultiplier);
  const tokensReceived = calculateTokensWithMultiplier(investmentAmount, listing.token_price, nftMultiplier);

  return (
    <div>
      {/* NFT Benefits Display */}
      {nftStatus && nftMultiplier > 1 && (
        <Card>
          <CardContent>
            <p>{nftStatus.highestTier} Benefits</p>
            <p>You get a {formatNFTMultiplier(nftMultiplier)} investment multiplier!</p>
            {/* Show owned NFTs */}
            {nftStatus.ownedNfts.map(nft => (
              <Badge key={nft.id}>{nft.displayName}</Badge>
            ))}
          </CardContent>
        </Card>
      )}
      
      {/* Investment Summary */}
      <div>
        <p>Your Investment: {formatCurrency(investmentAmount)}</p>
        {nftMultiplier > 1 && (
          <p>NFT Multiplier ({nftMultiplier}x): +{formatCurrency(effectiveAmount - investmentAmount)}</p>
        )}
        <p>Tokens Received: {tokensReceived}</p>
      </div>
    </div>
  );
};
```

## Access Control

### Listing Access
```typescript
export function canUserAccessListing(
  userStatus: UserNFTCardStatus,
  listing: MarketplaceListing
): { canAccess: boolean; reason?: string } {
  // Check premium access requirement
  if (listing.requires_premium_access && !userStatus.canAccessPremiumListings) {
    return {
      canAccess: false,
      reason: 'This listing requires a premium NFT card'
    };
  }

  // Check early access requirement
  if (listing.early_access_only && !userStatus.canAccessEarlyListings) {
    return {
      canAccess: false,
      reason: 'This listing is currently in early access period'
    };
  }

  return { canAccess: true };
}
```

## Configuration

### Adding New NFT Tiers
1. **Add to loyalty platform** (your existing system)
2. **Map benefits in marketplace**:
   ```sql
   INSERT INTO public.nft_card_tiers (
     tier_name, 
     display_name, 
     description, 
     investment_multiplier, 
     can_access_premium_listings, 
     can_access_early_listings
   ) VALUES (
     'new_tier', 
     'New Tier', 
     'Description', 
     1.30, 
     true, 
     false
   );
   ```
3. **Update benefit mapping** in `nftCardIntegration.ts`:
   ```typescript
   const MARKETPLACE_BENEFITS = {
     // ... existing tiers
     'new_tier': { multiplier: 1.30, premiumAccess: true, earlyAccess: false },
   };
   ```

### Syncing with Loyalty Platform
```typescript
// Check if marketplace benefits are synced with loyalty platform
export async function syncLoyaltyNFTsWithMarketplace(): Promise<{ success: boolean; message: string }> {
  // Get all unique NFT tiers from loyalty platform
  const { data: loyaltyTiers } = await supabase
    .from('user_loyalty_cards')
    .select('DISTINCT card_type, tier')
    .eq('is_active', true);

  // Get existing marketplace benefits
  const { data: marketplaceTiers } = await supabase
    .from('nft_card_tiers')
    .select('tier_name');

  // Check for missing mappings
  const existingTiers = marketplaceTiers?.map(t => t.tier_name) || [];
  const loyaltyTierNames = loyaltyTiers?.map(t => t.tier || t.card_type).filter(Boolean) || [];
  const missingTiers = loyaltyTierNames.filter(tier => !existingTiers.includes(tier));

  if (missingTiers.length > 0) {
    return {
      success: false,
      message: `Missing marketplace benefits for loyalty tiers: ${missingTiers.join(', ')}`
    };
  }

  return {
    success: true,
    message: 'Loyalty NFT tiers are properly synced with marketplace benefits'
  };
}
```

## Benefits

### ✅ Advantages
- **Single Source of Truth**: NFT ownership managed in one place
- **No Data Duplication**: Avoids sync issues between systems
- **Flexible Mapping**: Easy to adjust marketplace benefits
- **Scalable**: Easy to add new NFT tiers and benefits
- **Consistent**: Users see same NFT status across platforms

### 🔧 Maintenance
- **Loyalty Platform Changes**: Update marketplace benefit mappings
- **New NFT Tiers**: Add to both loyalty platform and marketplace mapping
- **Benefit Changes**: Update marketplace mapping only
- **Sync Issues**: Use sync function to detect mismatches

## Testing

### Test Scenarios
1. **User with no NFTs**: Should see standard 1.0x multiplier
2. **User with basic NFT**: Should see 1.0x multiplier, no premium access
3. **User with premium NFT**: Should see 1.25x multiplier, premium access
4. **User with VIP NFT**: Should see 1.50x multiplier, premium + early access
5. **User with multiple NFTs**: Should get benefits from highest tier
6. **Premium listing access**: Should check user's premium access capability
7. **Early access listing**: Should check user's early access capability

### Test Data
```sql
-- Test user with different NFT tiers
INSERT INTO user_loyalty_cards (user_id, card_type, tier, is_active) VALUES
('test_user_1', 'basic', 'basic', true),
('test_user_2', 'premium', 'premium', true),
('test_user_3', 'vip', 'vip', true);
```

## Migration Notes

### From Previous Implementation
- ✅ **Removed**: Duplicate NFT tier creation in marketplace
- ✅ **Updated**: NFT integration to read from loyalty platform
- ✅ **Enhanced**: Benefit calculation with proper multiplier logic
- ✅ **Improved**: UI to show owned NFTs and benefits clearly

### Database Changes
- **No breaking changes** to existing loyalty platform
- **Added** marketplace benefit mapping table
- **Updated** comments to clarify integration approach

This integration ensures the marketplace leverages your existing loyalty NFT system while providing enhanced investment benefits based on user's NFT ownership! 🎯
