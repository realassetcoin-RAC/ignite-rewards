import React, { useMemo } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react'
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets'
import { PhantomWalletProvider } from './components/PhantomWalletProvider'
import { MetaMaskProvider } from './components/MetaMaskProvider'
import { SafeWalletProvider } from './components/SafeWalletProvider'
import App from './SimpleWorkingApp.tsx'
import './safe.css'

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
              <BrowserRouter>
                <App />
              </BrowserRouter>
            </MetaMaskProvider>
          </PhantomWalletProvider>
        </WalletProvider>
      </ConnectionProvider>
    </SafeWalletProvider>
  )
}

createRoot(document.getElementById("root")!).render(<Root />);
