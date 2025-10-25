import { useContext } from 'react';
import { PhantomContext } from '@/components/PhantomWalletProvider';

export const usePhantom = () => {
  const context = useContext(PhantomContext);
  if (!context) {
    throw new Error('usePhantom must be used within a PhantomWalletProvider');
  }
  return context;
};
