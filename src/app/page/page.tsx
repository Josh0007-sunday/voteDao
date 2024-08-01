"use client";
import React from 'react';
import dynamic from 'next/dynamic';
require('@solana/wallet-adapter-react-ui/styles.css');
import App from '../component/main/page'


const WalletContextProvider = dynamic(
  () => import('../component/web3/adapter').then(mod => mod.default),
  { ssr: false }
);

const DisplayPage: React.FC = () => {
  return (
     <WalletContextProvider>
              <App/>
    </WalletContextProvider>
  )
}

export default DisplayPage