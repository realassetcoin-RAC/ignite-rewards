#!/usr/bin/env node

/**
 * Remove Exact Duplicate Cards
 * Deletes the 6 duplicate cards created on 9/29/2025
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://wndswqvqogeblksrujpg.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InduZHN3cXZxb2dlYmxrc3J1anBnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzMzEyMTAsImV4cCI6MjA3MTkwNzIxMH0.eOXJEo3XheuB2AK3NlRotSKqPMueqkgPUa896TM-hfA';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// IDs of duplicate cards to delete (all created on 9/29/2025)
const DUPLICATE_IDS = [
  '8ed0625b-c00e-4b95-9d5e-aeff957b3a87', // Black (duplicate)
  '20bc1ca4-9427-4b6d-9bd8-e1c729caf01e', // Gold (duplicate)
  '6d617c54-8437-4028-97a5-107c4637216a', // Lava Orange (duplicate)
  'eb225c04-4a67-44c0-b2dc-86432d6033a9', // Pearl White (duplicate)
  '85e680be-bc8a-41ca-b42d-a5bd1f761568', // Pink (duplicate)
  '8a1c8718-105c-4462-b88b-50c281e0b4ac'  // Silver (duplicate)
];

async function removeDuplicates() {
  console.log('🗑️  Removing duplicate loyalty cards...\n');

  try {
    // First, show what we're deleting
    const { data: toDelete, error: fetchError } = await supabase
      .from('nft_types')
      .select('*')
      .in('id', DUPLICATE_IDS);

    if (fetchError) throw fetchError;

    console.log('Cards to be deleted:');
    console.log('='.repeat(80));
    toDelete.forEach((card, index) => {
      console.log(`${index + 1}. ${card.nft_name} (${card.rarity})`);
      console.log(`   ID: ${card.id}`);
      console.log(`   Created: ${new Date(card.created_at).toLocaleString()}`);
      console.log('');
    });

    // Delete the duplicates
    console.log('🔄 Deleting duplicates...\n');

    const { error: deleteError } = await supabase
      .from('nft_types')
      .delete()
      .in('id', DUPLICATE_IDS);

    if (deleteError) {
      throw new Error(`Failed to delete: ${deleteError.message}`);
    }

    console.log('✅ Successfully deleted 6 duplicate cards!\n');

    // Verify final count
    const { data: remaining, error: verifyError } = await supabase
      .from('nft_types')
      .select('id, nft_name, rarity, created_at')
      .order('nft_name', { ascending: true });

    if (verifyError) throw verifyError;

    console.log('='.repeat(80));
    console.log('REMAINING CARDS IN DATABASE');
    console.log('='.repeat(80));
    console.log(`Total: ${remaining.length} cards\n`);

    remaining.forEach((card, index) => {
      console.log(`${index + 1}. ${card.nft_name} (${card.rarity})`);
      console.log(`   ID: ${card.id}`);
      console.log(`   Created: ${new Date(card.created_at).toLocaleDateString()}`);
    });

    console.log('\n' + '='.repeat(80));
    console.log('✅ CLEANUP COMPLETE!');
    console.log('='.repeat(80));
    console.log('Database now has 6 unique loyalty cards');
    console.log('🔄 Refresh your browser to see the changes\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Run
removeDuplicates();

