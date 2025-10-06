/**
 * User Type Hook
 * Custom hook to determine if user is custodial or non-custodial
 * Following .cursorrules: Local PostgreSQL for data operations
 */

import { useState, useEffect } from 'react';
import { databaseAdapter } from '@/lib/databaseAdapter';
import { createModuleLogger } from '@/utils/consoleReplacer';

const logger = createModuleLogger('useUserType');

export type UserType = 'custodial' | 'non_custodial' | null;

interface UseUserTypeReturn {
  userType: UserType;
  isCustodial: boolean;
  isNonCustodial: boolean;
  loading: boolean;
  refresh: () => Promise<void>;
}

export function useUserType(userId: string | undefined): UseUserTypeReturn {
  const [userType, setUserType] = useState<UserType>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserType = async () => {
    if (!userId) {
      setUserType(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      const { data, error } = await databaseAdapter
        .from('profiles')
        .select('user_type')
        .eq('id', userId)
        .single();

      if (error) {
        logger.error('Error fetching user type:', error);
        setUserType(null);
        return;
      }

      const type = data?.user_type as UserType;
      setUserType(type || 'custodial'); // Default to custodial for safety
      logger.info(`User type: ${type || 'custodial (default)'}`);
      
    } catch (error) {
      logger.error('Error in fetchUserType:', error);
      setUserType(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserType();
  }, [userId]);

  return {
    userType,
    isCustodial: userType === 'custodial',
    isNonCustodial: userType === 'non_custodial',
    loading,
    refresh: fetchUserType
  };
}
