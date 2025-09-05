import React, { useMemo } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react'
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets'
import { PhantomWalletProvider } from './components/PhantomWalletProvider'
import { MetaMaskProvider } from './components/MetaMaskProvider'

const Root = () => {
  const endpoint = 'https://api.devnet.solana.com'
  const wallets = useMemo(() => [
    new PhantomWalletAdapter(),
    new SolflareWalletAdapter()
  ], [])
  
  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <PhantomWalletProvider>
          <MetaMaskProvider>
            <App />
          </MetaMaskProvider>
        </PhantomWalletProvider>
      </WalletProvider>
    </ConnectionProvider>
  )
}

createRoot(document.getElementById("root")!).render(<Root />);
