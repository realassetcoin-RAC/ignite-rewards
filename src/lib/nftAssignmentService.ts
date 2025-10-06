/**
 * NFT Assignment Service
 * Handles automatic free NFT assignment for custodial users
 * Following .cursorrules: Local PostgreSQL for data operations
 */

import { databaseAdapter } from './databaseAdapter';
import { createModuleLogger } from '@/utils/consoleReplacer';

const logger = createModuleLogger('NFTAssignmentService');

export class NFTAssignmentService {
  /**
   * Assign free Pearl White NFT to a custodial user
   * This is called during signup for email and Google OAuth users
   */
  static async assignFreeNFT(userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      logger.info(`Assigning free Pearl White NFT to user: ${userId}`);

      // Get the Pearl White NFT type from nft_types table
      const { data: nftType, error: nftTypeError } = await databaseAdapter
        .from('nft_types')
        .select('id')
        .eq('nft_name', 'Pearl White')
        .eq('is_custodial', true)
        .eq('is_active', true)
        .single();

      if (nftTypeError || !nftType) {
        logger.error('Pearl White NFT type not found in database');
        return { success: false, error: 'Pearl White NFT type not found' };
      }

      // Check if user already has a loyalty card
      const { data: existing } = await databaseAdapter
        .from('user_loyalty_cards')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (existing) {
        logger.info('User already has a loyalty card, skipping assignment');
        return { success: true };
      }

      // Assign the NFT by creating a user_loyalty_cards record
      const { error: assignError } = await databaseAdapter
        .from('user_loyalty_cards')
        .insert({
          user_id: userId,
          nft_type_id: nftType.id,
          is_active: true,
          is_custodial: true,
          is_upgraded: false,
          points_balance: 0,
          tier_level: 'pearl_white',
          card_number: await this.generateCardNumber(userId),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (assignError) {
        logger.error('Failed to assign free NFT:', assignError);
        return { success: false, error: assignError.message };
      }

      logger.info('Successfully assigned free Pearl White NFT');
      return { success: true };

    } catch (error) {
      logger.error('Error in assignFreeNFT:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Generate a unique card number for the loyalty card
   * Format: 8 characters, first character is user's initial
   */
  private static async generateCardNumber(userId: string): Promise<string> {
    try {
      // Get user's first name initial from profiles
      const { data: profile } = await databaseAdapter
        .from('profiles')
        .select('first_name, full_name')
        .eq('id', userId)
        .single();

      let initial = 'U'; // Default initial
      if (profile?.first_name) {
        initial = profile.first_name.charAt(0).toUpperCase();
      } else if (profile?.full_name) {
        initial = profile.full_name.charAt(0).toUpperCase();
      }

      // Generate random 7-digit number
      const randomNumber = Math.floor(Math.random() * 10000000).toString().padStart(7, '0');
      
      return `${initial}${randomNumber}`;
    } catch (error) {
      logger.error('Error generating card number:', error);
      // Return default format if profile fetch fails
      const randomNumber = Math.floor(Math.random() * 10000000).toString().padStart(7, '0');
      return `U${randomNumber}`;
    }
  }

  /**
   * Check if a user has been assigned a free NFT
   */
  static async hasUserNFT(userId: string): Promise<boolean> {
    try {
      const { data } = await databaseAdapter
        .from('user_loyalty_cards')
        .select('id')
        .eq('user_id', userId)
        .single();

      return !!data;
    } catch {
      return false;
    }
  }
}
