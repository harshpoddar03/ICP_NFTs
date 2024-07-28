import React, { useState, useEffect } from 'react';
import { AuthClient } from '@dfinity/auth-client';
import { Actor, HttpAgent } from '@dfinity/agent';
// import { Actor } from '@dfinity/agent';
import { idlFactory } from '../../declarations/ICP_NFTs_backend/ICP_NFTs_backend.did.js';



const NFTMinter = () => {
  const [authClient, setAuthClient] = useState(null);
  const [actor, setActor] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [nftContent, setNftContent] = useState('');
  const [mintedTokenId, setMintedTokenId] = useState(null);

  useEffect(() => {
    const initAuth = async () => {
      const client = await AuthClient.create();
      setAuthClient(client);

      if (await client.isAuthenticated()) {
        handleAuthenticated(client);
      }
    };

    initAuth();
  }, []);

  const handleAuthenticated = async (client) => {
    const identity = await client.getIdentity();
    const agent = new HttpAgent.create({ identity });
    
    // Fetch root key for local development
    if (process.env.DFX_NETWORK !== "ic") {
      await agent.fetchRootKey();
    }
    
    const actor = Actor.createActor(idlFactory, {
      agent,
      canisterId: process.env.CANISTER_ID_ICP_NFTS_BACKEND,
    });
    setActor(actor);
    setIsAuthenticated(true);
  };

  const login = async () => {
    await authClient.login({
      identityProvider: process.env.DFX_NETWORK === "ic" 
        ? "https://identity.ic0.app/#authorize" 
        : `http://localhost:4943?canisterId=${process.env.CANISTER_ID_INTERNET_IDENTITY}#authorize`,
      onSuccess: () => handleAuthenticated(authClient),
    });
  };

  const mintNFT = async () => {
    if (!actor) return;
    try {
      const tokenId = await actor.mint_nft(nftContent);
      setMintedTokenId(tokenId);
      alert(`NFT minted with token ID: ${tokenId}`);
    } catch (error) {
      console.error('Error minting NFT:', error);
    }
  };

  const transferNFT = async () => {
    if (!actor || !mintedTokenId) return;
    const recipientPrincipal = prompt('Enter recipient Principal ID:');
    if (!recipientPrincipal) return;

    try {
      const result = await actor.transfer_nft(recipientPrincipal, mintedTokenId);
      if (result) {
        alert('NFT transferred successfully!');
      } else {
        alert('NFT transfer failed.');
      }
    } catch (error) {
      console.error('Error transferring NFT:', error);
    }
  };

  return (
    <div>
      <h2>NFT Minter</h2>
      {!isAuthenticated ? (
        <button onClick={login}>Login with Internet Identity</button>
      ) : (
        <div>
          <textarea
            value={nftContent}
            onChange={(e) => setNftContent(e.target.value)}
            placeholder="Enter text for your NFT"
          />
          <button onClick={mintNFT}>Mint NFT</button>
          {mintedTokenId && (
            <button onClick={transferNFT}>Transfer NFT</button>
          )}
        </div>
      )}
    </div>
  );
};

export default NFTMinter;