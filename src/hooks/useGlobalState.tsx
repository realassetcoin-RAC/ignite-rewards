import { createContext, useContext, useRef, ReactNode } from 'react';

/**
 * Global state context to prevent unnecessary re-renders and maintain app state
 * across window focus/blur events
 */
interface GlobalState {
  isInitialized: boolean;
  lastFocusTime: number;
  preventRefresh: boolean;
}

const GlobalStateContext = createContext<GlobalState | null>(null);

interface GlobalStateProviderProps {
  children: ReactNode;
}

export const GlobalStateProvider = ({ children }: GlobalStateProviderProps) => {
  const stateRef = useRef<GlobalState>({
    isInitialized: false,
    lastFocusTime: 0,
    preventRefresh: true,
  });

  return (
    <GlobalStateContext.Provider value={stateRef.current}>
      {children}
    </GlobalStateContext.Provider>
  );
};

export const useGlobalState = () => {
  const context = useContext(GlobalStateContext);
  if (!context) {
    throw new Error('useGlobalState must be used within a GlobalStateProvider');
  }
  return context;
};

