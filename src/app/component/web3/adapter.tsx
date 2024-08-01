import React, { ReactNode, useMemo, useState, useEffect } from 'react';
import { ConnectionProvider, WalletProvider, useAnchorWallet } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { clusterApiUrl, Connection, PublicKey } from '@solana/web3.js';
import * as anchor from '@project-serum/anchor';
import idl from './idl.json';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets';

require('@solana/wallet-adapter-react-ui/styles.css');

interface WalletContextProps {
  program: anchor.Program | null;
  isInitializer: boolean;
}

export const WalletContext = React.createContext<WalletContextProps>({
  program: null,
  isInitializer: false
});

const INITIALIZER_ADDRESS = 'HuDEMx6hGxCYWYJKivCSFM8UX21Acgkwgd1UfFJ3qaGN';

const WalletContextProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [program, setProgram] = useState<anchor.Program | null>(null);
  const [isInitializer, setIsInitializer] = useState<boolean>(false);
  const wallet = useAnchorWallet();
  const network = WalletAdapterNetwork.Devnet;
  const endpoint = useMemo(() => clusterApiUrl(network), [network]);
  const wallets = useMemo(() => [new PhantomWalletAdapter()], []);
  const commitment: anchor.web3.Commitment = 'processed';

  useEffect(() => {
    console.log('WalletContextProvider: Effect triggered');
    console.log('WalletContextProvider: Wallet:', wallet);
    console.log('WalletContextProvider: Network:', network);
    console.log('WalletContextProvider: Endpoint:', endpoint);

    const initializeProgram = async () => {
      if (wallet && wallet.publicKey) {
        console.log('WalletContextProvider: Wallet connected');
        const connection = new Connection(endpoint, commitment);
        const provider = new anchor.AnchorProvider(connection, wallet, { commitment });

        const programID = new PublicKey('ELtu4vRdjQVq2oU8HLJB1Vu9fecMVKzU22kxMSYyeEwS');
        const idlObject = idl as anchor.Idl;

        try {
          console.log('WalletContextProvider: Initializing program with ID:', programID.toBase58());
          const program = new anchor.Program(idlObject, programID, provider);
          setProgram(program);
          console.log('WalletContextProvider: Program loaded successfully');

          const userAddress = wallet.publicKey.toBase58();
          console.log('WalletContextProvider: User Public Key:', userAddress);
          console.log('WalletContextProvider: Initializer Address:', INITIALIZER_ADDRESS);

          const isInit = wallet.publicKey.equals(new PublicKey(INITIALIZER_ADDRESS));
          setIsInitializer(isInit);
          console.log('WalletContextProvider: Is Initializer:', isInit);
        } catch (error) {
          console.error('WalletContextProvider: Error initializing program:', error);
        }
      } else {
        setProgram(null);
        setIsInitializer(false);
        console.log('WalletContextProvider: Wallet not available or no public key');
      }
    };

    initializeProgram();
  }, [wallet, endpoint, commitment, network]);

  const contextValue = useMemo(() => ({ program, isInitializer }), [program, isInitializer]);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect={true}>
        <WalletModalProvider>
          <WalletContext.Provider value={contextValue}>
            {children}
          </WalletContext.Provider>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};

export default WalletContextProvider;