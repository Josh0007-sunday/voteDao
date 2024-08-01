import React, { useContext, useEffect } from 'react';
import { useAnchorWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { WalletContext } from '../web3/adapter'; 
import CreateProposal from '../utils/proposal/page'; 
import VoteOptions from '../castVote/page'; 

const INITIALIZER_ADDRESS = 'HuDEMx6hGxCYWYJKivCSFM8UX21Acgkwgd1UfFJ3qaGN';

const App: React.FC = () => {
  const wallet = useAnchorWallet();
  const { isInitializer, program } = useContext(WalletContext);

  useEffect(() => {
    if (wallet && wallet.publicKey) {
      const userAddress = wallet.publicKey.toBase58();
      console.log('App: User Public Key:', userAddress);
      console.log('App: Is user the initializer?', userAddress === INITIALIZER_ADDRESS);
      console.log('App: Program available:', !!program);
    } else {
      console.log('App: Wallet not connected');
    }
  }, [wallet, program]);

  const renderContent = () => {
    if (!wallet || !wallet.publicKey) {
      return <p>Please connect your wallet to continue.</p>;
    }

    if (!program) {
      return <p>Loading program... Please wait.</p>;
    }

    return isInitializer ? <CreateProposal /> : <VoteOptions />;
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow-md rounded-lg p-8">
          <h1 className="text-2xl font-bold text-indigo-600 mb-6">Voting App</h1>
          <div className="mb-6">
            <WalletMultiButton className="!bg-indigo-600 hover:!bg-indigo-700" />
          </div>
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default App;