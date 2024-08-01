import React, { useState, useEffect, useContext } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import * as anchor from '@project-serum/anchor';
import { WalletContext } from '../web3/adapter';

interface Proposal {
  publicKey: PublicKey;
  account: {
    title: string;
    description: string;
    options: string[];
    startTime: anchor.BN;
    endTime: anchor.BN;
    isActive: boolean;
  };
}

const VoteOptions: React.FC = () => {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isProgramValid, setIsProgramValid] = useState<boolean | null>(null);
  const { publicKey } = useWallet();
  const { program } = useContext(WalletContext);

  useEffect(() => {
    const verifyProgram = async () => {
      if (program) {
        try {
          // Attempt to fetch the program's upgrade authority
          // This is an async operation that will fail if the program ID is invalid
          const programInfo = await program.provider.connection.getAccountInfo(program.programId);
          if (programInfo) {
            console.log('Program ID is valid:', program.programId.toBase58());
            setIsProgramValid(true);
            fetchProposals();
          } else {
            console.error('Invalid program ID:', program.programId.toBase58());
            setIsProgramValid(false);
            setError('Invalid program ID. Please check your configuration.');
          }
        } catch (error) {
          console.error('Error verifying program:', error);
          setIsProgramValid(false);
          setError(`Error verifying program: ${error instanceof Error ? error.message : String(error)}`);
        }
      } else {
        console.log('VoteOptions: Program not available');
        setIsProgramValid(false);
      }
    };

    verifyProgram();
  }, [program]);

  const fetchProposals = async () => {
    if (!program) return;

    try {
      const fetchedProposals = await program.account.proposal.all();
      console.log('VoteOptions: Fetched proposals:', fetchedProposals);
      setProposals(fetchedProposals as Proposal[]);
    } catch (error) {
      console.error('Error fetching proposals:', error);
      setError(`Error fetching proposals: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const handleVote = async (proposalPublicKey: PublicKey) => {
    if (!program || !publicKey || selectedOption === null) {
      setError('Cannot vote: missing program, wallet, or selected option');
      return;
    }

    try {
      const [votePDA] = await PublicKey.findProgramAddressSync(
        [Buffer.from("vote"), proposalPublicKey.toBuffer(), publicKey.toBuffer()],
        program.programId
      );

      console.log('VoteOptions: Casting vote for proposal:', proposalPublicKey.toBase58());
      console.log('VoteOptions: Selected option:', selectedOption);

      await program.methods.castVote(selectedOption)
        .accounts({
          voter: publicKey,
          proposal: proposalPublicKey,
          vote: votePDA,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();

      console.log('Vote cast successfully');
      setError(null);
      fetchProposals(); // Refresh proposals after voting
    } catch (error) {
      console.error('Error casting vote:', error);
      setError(`Error casting vote: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  if (isProgramValid === null) {
    return <p>Verifying program... Please wait.</p>;
  }

  if (isProgramValid === false) {
    return <p>{error || 'Invalid program. Please check your configuration.'}</p>;
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Active Proposals</h2>
      {error && <div className="text-red-500 mb-4">{error}</div>}
      {proposals.length === 0 ? (
        <p>No active proposals found.</p>
      ) : (
        proposals.map((proposal) => (
          <div key={proposal.publicKey.toBase58()} className="mb-4 p-4 border rounded">
            <h3 className="text-xl font-semibold">{proposal.account.title}</h3>
            <p>{proposal.account.description}</p>
            <div className="mt-2">
              {proposal.account.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedOption(index)}
                  className={`mr-2 px-3 py-1 rounded ${
                    selectedOption === index ? 'bg-blue-500 text-white' : 'bg-gray-200'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
            <button
              onClick={() => handleVote(proposal.publicKey)}
              className="mt-2 px-4 py-2 bg-green-500 text-white rounded"
              disabled={selectedOption === null}
            >
              Cast Vote
            </button>
          </div>
        ))
      )}
    </div>
  );
};

export default VoteOptions;