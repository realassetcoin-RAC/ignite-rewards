import React, { createContext, useContext, useState, useCallback, lazy, Suspense } from 'react';

interface LazyWalletContextType {
  initializeWallets: () => void;
  isInitialized: boolean;
}

const LazyWalletContext = createContext<LazyWalletContextType>({
  initializeWallets: () => {},
  isInitialized: false
});

// eslint-disable-next-line react-refresh/only-export-components
export const useLazyWallet = () => useContext(LazyWalletContext);

// Lazy load wallet selector only when needed
const WalletSelector = lazy(() => import('./WalletSelector'));

interface LazyWalletProviderProps {
  children: React.ReactNode;
}

export const LazyWalletProvider: React.FC<LazyWalletProviderProps> = ({ children }) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [showWalletSelector, setShowWalletSelector] = useState(false);

  const initializeWallets = useCallback(() => {
    setIsInitialized(true);
    setShowWalletSelector(true);
  }, []);

  return (
    <LazyWalletContext.Provider value={{ initializeWallets, isInitialized }}>
      {children}
      {isInitialized && (
        <Suspense fallback={<div>Loading wallet...</div>}>
          <WalletSelector
            isOpen={showWalletSelector}
            onClose={() => setShowWalletSelector(false)}
            onWalletConnected={() => setShowWalletSelector(false)}
          />
        </Suspense>
      )}
    </LazyWalletContext.Provider>
  );
};

