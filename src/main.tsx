import React, { useMemo } from 'react'
import { createRoot } from 'react-dom/client'
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react'
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets'
import { PhantomWalletProvider } from './components/PhantomWalletProvider'
import { MetaMaskProvider } from './components/MetaMaskProvider'
import { SafeWalletProvider } from './components/SafeWalletProvider'
import App from './App.tsx'
import './safe.css'

// Debug environment variables
console.log('🔍 Environment Variables Debug:');
console.log('VITE_ENABLE_MOCK_AUTH:', import.meta.env.VITE_ENABLE_MOCK_AUTH);
console.log('VITE_APP_ENV:', import.meta.env.VITE_APP_ENV);
console.log('VITE_DB_HOST:', import.meta.env.VITE_DB_HOST);
console.log('All env vars:', import.meta.env);

const Root = () => {
  const endpoint = 'https://api.devnet.solana.com'
  const wallets = useMemo(() => [
    new PhantomWalletAdapter(),
    new SolflareWalletAdapter()
  ], [])
  
  return (
    <SafeWalletProvider>
      <ConnectionProvider endpoint={endpoint}>
        <WalletProvider wallets={wallets} autoConnect={false}>
          <PhantomWalletProvider>
            <MetaMaskProvider>
              <App />
            </MetaMaskProvider>
          </PhantomWalletProvider>
        </WalletProvider>
      </ConnectionProvider>
    </SafeWalletProvider>
  )
}

createRoot(document.getElementById("root")!).render(<Root />);
