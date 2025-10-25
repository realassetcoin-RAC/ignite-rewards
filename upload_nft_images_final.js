// Final NFT Image Upload Script
// Run this after creating the public-assets bucket in Supabase

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

async function uploadNFTImages() {
  console.log('🚀 Starting Final NFT Image Upload...\n');

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
          
          // Generate clean filename
          const cleanFileName = `loyalty-${cardType.toLowerCase().replace(' ', '-')}.png`;
          const storagePath = `nft-images/${cleanFileName}`;

          // Upload to Supabase Storage
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('public-assets')
            .upload(storagePath, fileBuffer, {
              cacheControl: '3600',
              upsert: true // Allow overwrite
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
            publicUrl: urlData.publicUrl
          };

          console.log(`✅ Successfully uploaded ${filename}`);
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
        const { data: updateData, error: updateError } = await supabase
          .from('nft_types')
          .update({
            image_url: result.publicUrl,
            updated_at: new Date().toISOString()
          })
          .eq('nft_name', cardType)
          .select();

        if (updateError) {
          console.error(`❌ Error updating NFT type ${cardType}:`, updateError.message);
        } else {
          console.log(`✅ Updated NFT type: ${cardType}`);
        }

      } catch (error) {
        console.error(`❌ Error processing ${cardType}:`, error.message);
      }
    }

    // Verify uploads
    console.log('\n🔍 Verifying uploads...');
    const { data: allNFTs, error: verifyError } = await supabase
      .from('nft_types')
      .select('nft_name, display_name, image_url, rarity, buy_price_usdt, is_custodial')
      .eq('is_custodial', true)
      .order('nft_name');

    if (verifyError) {
      console.error('❌ Error verifying uploads:', verifyError.message);
    } else {
      console.log('✅ Custodial NFT types in database:');
      if (allNFTs && allNFTs.length > 0) {
        allNFTs.forEach(nft => {
          console.log(`   📋 ${nft.nft_name} (${nft.rarity}) - $${nft.buy_price_usdt || 0}`);
          console.log(`      🖼️  ${nft.image_url ? '✅ Image uploaded' : '❌ No image'}`);
          if (nft.image_url) {
            console.log(`      🔗 ${nft.image_url}`);
          }
        });
      } else {
        console.log('   No custodial NFT types found');
      }
    }

    console.log('\n🎉 NFT Image Upload Completed!');
    console.log(`📊 Successfully processed ${Object.keys(uploadResults).length} NFT images`);

  } catch (error) {
    console.error('❌ Fatal error:', error.message);
  }
}

// Run the upload process
uploadNFTImages().catch(console.error);
