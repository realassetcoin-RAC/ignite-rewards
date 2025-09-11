import React, { Component, ReactNode } from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class WalletErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.warn('Wallet provider error caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // Fallback UI - just render children without wallet functionality
      console.warn('Wallet providers failed, continuing without wallet functionality');
      return this.props.children;
    }

    return this.props.children;
  }
}

export const SafeWalletProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <WalletErrorBoundary>
      {children}
    </WalletErrorBoundary>
  );
};

