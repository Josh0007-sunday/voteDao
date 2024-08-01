"use client";
import React, { useState, useContext, useEffect } from 'react';
import { useAnchorWallet } from '@solana/wallet-adapter-react';
import { PublicKey, SystemProgram } from '@solana/web3.js';
import * as anchor from '@project-serum/anchor';
import { WalletContext } from '../../web3/adapter';

const CreateProposal: React.FC = () => {
  const { program, isInitializer } = useContext(WalletContext);
  const wallet = useAnchorWallet();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [options, setOptions] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [daoAddress, setDaoAddress] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('CreateProposal: Component mounted or updated');
    console.log('CreateProposal: isInitializer:', isInitializer);
    console.log('CreateProposal: wallet connected:', !!wallet);
    console.log('CreateProposal: program available:', !!program);
  }, [isInitializer, wallet, program]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    console.log('CreateProposal: handleSubmit called');

    if (!program || !wallet || !wallet.publicKey) {
      setError('Missing required context or wallet');
      return;
    }

    try {
      const optionsArray = options.split(',').map(option => option.trim());
      const startTimestamp = Math.floor(new Date(startTime).getTime() / 1000);
      const endTimestamp = Math.floor(new Date(endTime).getTime() / 1000);

      console.log('CreateProposal: Preparing to create proposal');
      console.log('CreateProposal: Title:', title);
      console.log('CreateProposal: Description:', description);
      console.log('CreateProposal: Options:', optionsArray);
      console.log('CreateProposal: Start time:', new Date(startTimestamp * 1000).toISOString());
      console.log('CreateProposal: End time:', new Date(endTimestamp * 1000).toISOString());

      const daoPubkey = new PublicKey(daoAddress);

      const [proposalPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("proposal"), daoPubkey.toBuffer(), Buffer.from(title)],
        program.programId
      );

      console.log('CreateProposal: Proposal PDA:', proposalPDA.toBase58());

      const tx = await program.methods.createProposal(
        title,
        description,
        optionsArray,
        new anchor.BN(startTimestamp),
        new anchor.BN(endTimestamp)
      )
        .accounts({
          authority: wallet.publicKey,
          dao: daoPubkey,
          proposal: proposalPDA,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      console.log('CreateProposal: Proposal created successfully. Signature:', tx);
      setTitle('');
      setDescription('');
      setOptions('');
      setStartTime('');
      setEndTime('');
    } catch (error) {
      console.error('CreateProposal: Error creating proposal:', error);
      setError(`Error creating proposal: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  if (!isInitializer) {
    return <div>Only the initializer can create proposals.</div>;
  }

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold mb-4">Create Proposal</h2>
      {error && <div className="text-red-500 mb-4">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="daoAddress" className="block text-sm font-medium text-gray-700">DAO Address</label>
          <input
            type="text"
            id="daoAddress"
            value={daoAddress}
            onChange={(e) => setDaoAddress(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            required
          />
        </div>
        <div className="mb-4">
          <label htmlFor="title" className="block text-sm font-medium text-gray-700">Title</label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            required
          />
        </div>
        <div className="mb-4">
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            rows={3}
            required
          ></textarea>
        </div>
        <div className="mb-4">
          <label htmlFor="options" className="block text-sm font-medium text-gray-700">Options (comma-separated)</label>
          <input
            type="text"
            id="options"
            value={options}
            onChange={(e) => setOptions(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            required
          />
        </div>
        <div className="mb-4">
          <label htmlFor="startTime" className="block text-sm font-medium text-gray-700">Start Time</label>
          <input
            type="datetime-local"
            id="startTime"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            required
          />
        </div>
        <div className="mb-4">
          <label htmlFor="endTime" className="block text-sm font-medium text-gray-700">End Time</label>
          <input
            type="datetime-local"
            id="endTime"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            required
          />
        </div>
        <button
          type="submit"
          className="w-full px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Create Proposal
        </button>
      </form>
    </div>
  );
};

export default CreateProposal;