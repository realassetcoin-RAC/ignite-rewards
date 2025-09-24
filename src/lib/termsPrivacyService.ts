import { supabase } from '@/integrations/supabase/client';

export interface TermsPrivacyAcceptance {
  id: string;
  user_id: string;
  terms_accepted: boolean;
  privacy_accepted: boolean;
  terms_version: string;
  privacy_version: string;
  accepted_at: string;
  created_at: string;
  updated_at: string;
}

export class TermsPrivacyService {
  /**
   * Check if user has accepted terms and privacy policy
   */
  static async getUserAcceptance(userId: string): Promise<TermsPrivacyAcceptance | null> {
    try {
      const { data, error } = await supabase
        .from('terms_privacy_acceptance')
        .select('*')
        .eq('user_id', userId)
        .order('accepted_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
        console.error('Error fetching user acceptance:', error);
        // If table doesn't exist, return null instead of throwing
        if (error.code === 'PGRST116' || error.message.includes('relation') || error.message.includes('does not exist')) {
          console.warn('Terms privacy acceptance table does not exist yet, returning null');
          return null;
        }
        throw error;
      }

      return data;
    } catch (error: any) {
      console.error('Failed to fetch user acceptance:', error);
      
      // Handle specific error cases gracefully
      if (error.message && error.message.includes('limit is not a function')) {
        console.warn('Query builder limit method not available, using alternative approach');
        try {
          // Try without limit and single, just get the first result
          const { data, error: altError } = await supabase
            .from('terms_privacy_acceptance')
            .select('*')
            .eq('user_id', userId)
            .order('accepted_at', { ascending: false });
          
          if (altError) {
            console.warn('Alternative query also failed, returning null');
            return null;
          }
          
          return data && data.length > 0 ? data[0] : null;
        } catch (altError) {
          console.warn('Alternative query failed, returning null');
          return null;
        }
      }
      
      // Return null instead of throwing to prevent app crashes
      return null;
    }
  }

  /**
   * Save user's acceptance of terms and privacy policy
   */
  static async saveUserAcceptance(
    userId: string,
    termsAccepted: boolean,
    privacyAccepted: boolean,
    termsVersion: string = '1.0',
    privacyVersion: string = '1.0'
  ): Promise<TermsPrivacyAcceptance> {
    try {
      const acceptanceData = {
        user_id: userId,
        terms_accepted: termsAccepted,
        privacy_accepted: privacyAccepted,
        terms_version: termsVersion,
        privacy_version: privacyVersion,
        accepted_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('terms_privacy_acceptance')
        .insert([acceptanceData])
        .select()
        .single();

      if (error) {
        console.error('Error saving user acceptance:', error);
        // If table doesn't exist, return a mock object instead of throwing
        if (error.message.includes('relation') || error.message.includes('does not exist')) {
          console.warn('Terms privacy acceptance table does not exist yet, returning mock data');
          return {
            id: 'mock',
            user_id: userId,
            terms_accepted: termsAccepted,
            privacy_accepted: privacyAccepted,
            terms_version: termsVersion,
            privacy_version: privacyVersion,
            accepted_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          } as TermsPrivacyAcceptance;
        }
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Failed to save user acceptance:', error);
      // Return a mock object instead of throwing to prevent app crashes
      return {
        id: 'mock',
        user_id: userId,
        terms_accepted: termsAccepted,
        privacy_accepted: privacyAccepted,
        terms_version: termsVersion,
        privacy_version: privacyVersion,
        accepted_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      } as TermsPrivacyAcceptance;
    }
  }

  /**
   * Update user's acceptance of terms and privacy policy
   */
  static async updateUserAcceptance(
    userId: string,
    termsAccepted: boolean,
    privacyAccepted: boolean,
    termsVersion: string = '1.0',
    privacyVersion: string = '1.0'
  ): Promise<TermsPrivacyAcceptance> {
    try {
      const acceptanceData = {
        terms_accepted: termsAccepted,
        privacy_accepted: privacyAccepted,
        terms_version: termsVersion,
        privacy_version: privacyVersion,
        accepted_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('terms_privacy_acceptance')
        .update(acceptanceData)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        console.error('Error updating user acceptance:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Failed to update user acceptance:', error);
      throw error;
    }
  }

  /**
   * Check if user needs to accept updated terms or privacy policy
   */
  static async checkForUpdates(userId: string): Promise<{
    needsTermsUpdate: boolean;
    needsPrivacyUpdate: boolean;
    currentAcceptance: TermsPrivacyAcceptance | null;
  }> {
    try {
      const currentAcceptance = await this.getUserAcceptance(userId);
      
      if (!currentAcceptance) {
        return {
          needsTermsUpdate: true,
          needsPrivacyUpdate: true,
          currentAcceptance: null
        };
      }

      const currentTermsVersion = '1.0'; // This should be updated when terms change
      const currentPrivacyVersion = '1.0'; // This should be updated when privacy policy changes

      return {
        needsTermsUpdate: currentAcceptance.terms_version !== currentTermsVersion,
        needsPrivacyUpdate: currentAcceptance.privacy_version !== currentPrivacyVersion,
        currentAcceptance
      };
    } catch (error) {
      console.error('Failed to check for updates:', error);
      return {
        needsTermsUpdate: true,
        needsPrivacyUpdate: true,
        currentAcceptance: null
      };
    }
  }
}

