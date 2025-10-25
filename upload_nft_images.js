// Upload NFT Images Script
// This script uploads the standard loyalty custodial NFTs to Supabase storage and updates the database

import { createClient } from '@supabase/supabase-js';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

// Supabase configuration
const supabaseUrl = 'https://wndswqvqogeblksrujpg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InduZHN3cXZxb2dlYmxrc3J1anBnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzMzEyMTAsImV4cCI6MjA3MTkwNzIxMH0.eOXJEo3XheuB2AK3NlRotSKqPMueqkgPUa896TM-hfA';

const supabase = createClient(supabaseUrl, supabaseKey);

// NFT file mapping
const nftFiles = {
  'Black.png': 'Black',
  'Gold.png': 'Gold', 
  'Lava Orange.png': 'Lava Orange',
  'Pearl White.png': 'Pearl White',
  'Pink.png': 'Pink',
  'Silver.png': 'Silver'
};

// Rarity mapping
const rarityMapping = {
  'Black': 'Very Rare',
  'Gold': 'Very Rare',
  'Lava Orange': 'Rare',
  'Pearl White': 'Common',
  'Pink': 'Less Common',
  'Silver': 'Less Common'
};

// Price mapping (in USDT)
const priceMapping = {
  'Black': 1000.00,
  'Gold': 1000.00,
  'Lava Orange': 500.00,
  'Pearl White': 0.00,
  'Pink': 100.00,
  'Silver': 100.00
};

async function uploadNFTImages() {
  console.log('🚀 Starting NFT Image Upload Process...\n');

  const nftPath = 'D:\\RAC\\NFT\\Current\\';
  
  try {
    // Check if directory exists
    const files = readdirSync(nftPath);
    console.log('📁 Found files in NFT directory:', files);

    const uploadResults = {};

    // Upload each NFT image
    for (const [filename, cardType] of Object.entries(nftFiles)) {
      if (files.includes(filename)) {
        console.log(`\n📤 Uploading ${filename} (${cardType})...`);
        
        try {
          const filePath = join(nftPath, filename);
          const fileBuffer = readFileSync(filePath);
          
          // Generate unique filename
          const timestamp = Date.now();
          const randomId = Math.random().toString(36).substring(2, 8);
          const fileExt = filename.split('.').pop();
          const newFileName = `loyalty-${cardType.toLowerCase().replace(' ', '-')}-${timestamp}-${randomId}.${fileExt}`;
          const storagePath = `nft-images/${newFileName}`;

          // Upload to Supabase Storage
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('public-assets')
            .upload(storagePath, fileBuffer, {
              cacheControl: '3600',
              upsert: false
            });

          if (uploadError) {
            console.error(`❌ Upload failed for ${filename}:`, uploadError.message);
            continue;
          }

          // Get public URL
          const { data: urlData } = supabase.storage
            .from('public-assets')
            .getPublicUrl(storagePath);

          uploadResults[cardType] = {
            filename,
            storagePath,
            publicUrl: urlData.publicUrl,
            rarity: rarityMapping[cardType],
            price: priceMapping[cardType]
          };

          console.log(`✅ Successfully uploaded ${filename}`);
          console.log(`   📍 Storage path: ${storagePath}`);
          console.log(`   🔗 Public URL: ${urlData.publicUrl}`);

        } catch (error) {
          console.error(`❌ Error uploading ${filename}:`, error.message);
        }
      } else {
        console.log(`⚠️  File not found: ${filename}`);
      }
    }

    // Update database with new image URLs
    console.log('\n🔄 Updating database with new image URLs...');
    
    for (const [cardType, result] of Object.entries(uploadResults)) {
      try {
        // Check if NFT type exists
        const { data: existingNFT, error: checkError } = await supabase
          .from('nft_types')
          .select('id, nft_name, image_url')
          .eq('nft_name', cardType)
          .single();

        if (checkError && checkError.code !== 'PGRST116') {
          console.error(`❌ Error checking NFT type ${cardType}:`, checkError.message);
          continue;
        }

        if (existingNFT) {
          // Update existing NFT type
          const { data: updateData, error: updateError } = await supabase
            .from('nft_types')
            .update({
              image_url: result.publicUrl,
              rarity: result.rarity,
              buy_price_usdt: result.price,
              updated_at: new Date().toISOString()
            })
            .eq('id', existingNFT.id)
            .select();

          if (updateError) {
            console.error(`❌ Error updating NFT type ${cardType}:`, updateError.message);
          } else {
            console.log(`✅ Updated NFT type: ${cardType}`);
            console.log(`   🖼️  New image URL: ${result.publicUrl}`);
          }
        } else {
          // Create new NFT type
          const { data: insertData, error: insertError } = await supabase
            .from('nft_types')
            .insert({
              nft_name: cardType,
              display_name: `${cardType} Card`,
              description: `RAC Rewards ${cardType} loyalty card with ${result.rarity} rarity`,
              image_url: result.publicUrl,
              rarity: result.rarity,
              buy_price_usdt: result.price,
              earn_on_spend_ratio: 0.0100,
              upgrade_bonus_ratio: 0.00,
              evolution_min_investment: 100.00,
              evolution_earnings_ratio: 0.0025,
              is_upgradeable: true,
              is_evolvable: true,
              is_fractional_eligible: false,
              is_custodial: true,
              is_active: true
            })
            .select();

          if (insertError) {
            console.error(`❌ Error creating NFT type ${cardType}:`, insertError.message);
          } else {
            console.log(`✅ Created new NFT type: ${cardType}`);
            console.log(`   🖼️  Image URL: ${result.publicUrl}`);
          }
        }

      } catch (error) {
        console.error(`❌ Error processing ${cardType}:`, error.message);
      }
    }

    // Verify uploads
    console.log('\n🔍 Verifying uploads...');
    const { data: allNFTs, error: verifyError } = await supabase
      .from('nft_types')
      .select('nft_name, display_name, image_url, rarity, buy_price_usdt')
      .order('nft_name');

    if (verifyError) {
      console.error('❌ Error verifying uploads:', verifyError.message);
    } else {
      console.log('✅ Current NFT types in database:');
      allNFTs.forEach(nft => {
        console.log(`   📋 ${nft.nft_name} (${nft.rarity}) - $${nft.buy_price_usdt}`);
        console.log(`      🖼️  ${nft.image_url ? '✅ Image uploaded' : '❌ No image'}`);
      });
    }

    console.log('\n🎉 NFT Image Upload Process Completed!');
    console.log(`📊 Successfully processed ${Object.keys(uploadResults).length} NFT images`);

  } catch (error) {
    console.error('❌ Fatal error:', error.message);
  }
}

// Run the upload process
uploadNFTImages().catch(console.error);
