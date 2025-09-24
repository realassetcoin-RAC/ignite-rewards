// Test the LoyaltyNFTService directly
import { LoyaltyNFTService } from './src/lib/loyaltyNFTService.js';

async function testLoyaltyService() {
  console.log('🔍 Testing LoyaltyNFTService...');
  
  try {
    // Test getting all NFT types
    console.log('📋 Testing getAllNFTTypes()...');
    const nftTypes = await LoyaltyNFTService.getAllNFTTypes();
    console.log('✅ NFT Types loaded:', nftTypes.length);
    console.log('📊 NFT Types:', nftTypes.map(nft => nft.nft_name));
    
    return true;
  } catch (error) {
    console.error('❌ LoyaltyNFTService test failed:', error.message);
    return false;
  }
}

testLoyaltyService();

