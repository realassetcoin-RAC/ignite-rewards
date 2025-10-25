#!/usr/bin/env node

/**
 * Identify Duplicate Loyalty Cards
 * Shows which cards are duplicated in the database
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://wndswqvqogeblksrujpg.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InduZHN3cXZxb2dlYmxrc3J1anBnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzMzEyMTAsImV4cCI6MjA3MTkwNzIxMH0.eOXJEo3XheuB2AK3NlRotSKqPMueqkgPUa896TM-hfA';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function identifyDuplicates() {
  console.log('🔍 Identifying duplicate loyalty cards...\n');

  try {
    const { data: allCards, error } = await supabase
      .from('nft_types')
      .select('*')
      .order('nft_name', { ascending: true })
      .order('created_at', { ascending: true });

    if (error) throw error;

    console.log(`📊 Total cards in database: ${allCards.length}\n`);

    // Group cards by name
    const cardGroups = new Map();
    
    allCards.forEach(card => {
      const key = card.nft_name;
      if (!cardGroups.has(key)) {
        cardGroups.set(key, []);
      }
      cardGroups.get(key).push(card);
    });

    console.log(`📋 Unique card names: ${cardGroups.size}\n`);

    // Show grouped cards
    console.log('='.repeat(80));
    console.log('CARD GROUPS (showing all instances)');
    console.log('='.repeat(80));

    let duplicateCount = 0;
    const cardsToDelete = [];

    cardGroups.forEach((cards, name) => {
      console.log(`\n${name} (${cards.length} instance${cards.length > 1 ? 's' : ''})`);
      console.log('-'.repeat(80));
      
      cards.forEach((card, index) => {
        const marker = index === 0 ? '✅ KEEP' : '❌ DELETE';
        console.log(`  ${marker} | ID: ${card.id}`);
        console.log(`           | Rarity: ${card.rarity}`);
        console.log(`           | Price: $${card.buy_price_usdt}`);
        console.log(`           | Created: ${new Date(card.created_at).toLocaleString()}`);
        console.log(`           | Active: ${card.is_active}`);
        
        if (index > 0) {
          cardsToDelete.push(card.id);
          duplicateCount++;
        }
      });
    });

    console.log('\n' + '='.repeat(80));
    console.log('SUMMARY');
    console.log('='.repeat(80));
    console.log(`Total cards: ${allCards.length}`);
    console.log(`Unique cards: ${cardGroups.size}`);
    console.log(`Duplicates to remove: ${duplicateCount}`);
    console.log('='.repeat(80));

    if (duplicateCount > 0) {
      console.log('\n🗑️  Cards marked for deletion:');
      cardsToDelete.forEach((id, index) => {
        console.log(`${index + 1}. ${id}`);
      });
    }

    return cardsToDelete;

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Run
identifyDuplicates();

