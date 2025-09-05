import React, { useMemo } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react'
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets'
import { PhantomWalletProvider } from './components/PhantomWalletProvider'

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
          <App />
        </PhantomWalletProvider>
      </WalletProvider>
    </ConnectionProvider>
  )
}

createRoot(document.getElementById("root")!).render(<Root />);
