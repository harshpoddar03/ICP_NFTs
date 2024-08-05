import React, { useState, useEffect } from 'react';
import { AuthClient } from '@dfinity/auth-client';
import { Actor, HttpAgent } from '@dfinity/agent';
// import { Actor } from '@dfinity/agent';
import { idlFactory } from '../../declarations/ICP_NFTs_backend/ICP_NFTs_backend.did.js';
import { Principal } from '@dfinity/principal';


const days = BigInt(1);
const hours = BigInt(24);
const nanoseconds = BigInt(3600000000000);

const defaultOptions = {
  createOptions: {
    idleOptions: {
      disableIdle: true,
    },
  },
  loginOptions: {
    identityProvider:
      process.env.DFX_NETWORK === "ic"
        ? "https://identity.ic0.app/#authorize"
        : `http://${process.env.CANISTER_ID_INTERNET_IDENTITY}.localhost:4943/#authorize`,
    maxTimeToLive: days * hours * nanoseconds,
  },
};

const NFTMinter = () => {
  const [authClient , setAuthClient] = useState(null);
  const [actor, setActor] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [nftContent, setNftContent] = useState('');
  const [mintedTokenId, setMintedTokenId] = useState(null);
  // const [authState, setAuthState] = useState('idle'); // Add this state



  console.log('Inside NFTMinter');




  useEffect(() => {
    const initAuth = async () => {
      try {
        const client = await AuthClient.create(defaultOptions.createOptions);
        setAuthClient(client);
        console.log('AuthClient created:', client);

        const isAuthed = await client.isAuthenticated();
        console.log('Is authenticated:', isAuthed);

        if (isAuthed) {
          console.log('User is already authenticated, handling authentication...');
          await handleAuthenticated(client);
        }

      } catch (error) {
        console.error('Error creating AuthClient:', error);
      }
    };

    initAuth();
  }, []);

  useEffect(() => {
    const handleAuthReturn = async () => {
      console.log('Handling auth return...');
      if (authClient) {
        const isAuthed = await authClient.isAuthenticated();
        console.log('Is authenticated after return:', isAuthed);
        if (isAuthed) {
          await handleAuthenticated(authClient);
        } else {
          console.log('Authentication failed or was cancelled');
          setAuthError('Authentication failed or was cancelled');
        }
      }
    };

    if (window.location.hash === '#auth-return') {
      handleAuthReturn();
      window.history.replaceState(null, null, window.location.pathname);
    }
  }, [authClient]);

  const handleAuthenticated = async (client) => {
      console.log('inside handleAuthenticated');
      try {
        const identity = await client.getIdentity();
        console.log('Identity received:', identity);
        
        if (identity.getPrincipal().isAnonymous()) {
          console.log('Warning: Anonymous principal detected');
          // You might want to trigger a re-login here
          return;
        }
  
        const agent = new HttpAgent({ identity,verifyQuerySignatures: false });
        console.log('Agent created:', agent);
        if('fetchRootKey' in agent) {
          console.log('fetchRootKey exists in agent');
        } else {
          console.log('fetchRootKey does not exist in agent');
        }
        if (process.env.DFX_NETWORK !== "ic") {
          await agent.fetchRootKey();
          console.log('Root key fetched for local development');
        }
  
        const newActor = Actor.createActor(idlFactory, {
          agent,
          canisterId: process.env.CANISTER_ID_ICP_NFTS_BACKEND,
        });
        console.log('Actor created');
        setActor(newActor);
        setIsAuthenticated(true);
        console.log('Authentication process completed');
      } catch (error) {
        console.error('Error in handleAuthenticated:', error);
      }
  }


  const login = async () => {
    console.log('inside login');
    if (!authClient) {
      console.error('AuthClient not initialized');
      return;
    }

    try {
      await authClient.login({
        ...defaultOptions.loginOptions,
        onSuccess: () => {
          console.log('Login successful');
          handleAuthenticated(authClient);
        },
        onError: (error) => {
          console.error('Login error:', error);
          setAuthError('Login failed. Please try again.');
        },
      });
      // The page will redirect, so the code below won't execute immediately
      console.log('Redirect should have happened');
      handleAuthenticated(authClient);
    } catch (error) {
      console.error('Error during login:', error);
    }
  };



  const mintNFT = async () => {
    if (!actor) return;
    try {
      // Get the current user's principal
      const identity = await authClient.getIdentity();
      const userPrincipal = identity.getPrincipal();

  
      // Call the mint function with both required parameters
      const tokenId = await actor.mint_nft(userPrincipal, nftContent);
      setMintedTokenId(tokenId);
      console.log('NFT minted with token ID:', tokenId);
      alert(`NFT minted with token ID: ${tokenId}`);
    } catch (error) {
      console.error('Error minting NFT:', error);
    }
  };

  const transferNFT = async () => {
    if (!actor || !mintedTokenId) return;
    const recipientPrincipal = prompt('Enter recipient Principal ID:');
    const tokenIdtotransfer = prompt('Enter token ID:');
    if (!recipientPrincipal) return;

    try {
      const result = await actor.transfer_nft(recipientPrincipal, tokenIdtotransfer);
      if (result) {
        alert('NFT transferred successfully!');
      } else {
        alert('NFT transfer failed.');
      }
    } catch (error) {
      console.error('Error transferring NFT:', error);
    }
  };

  const check_nft = async () => {
    if (!actor) return;
    try {
      const token_id = prompt('Enter token ID:');
      if (!token_id) return;
      const bigIntTokenId = BigInt(token_id);
      console.log('Checking NFT with token ID:', bigIntTokenId);
      const nft = await actor.get_token_content(bigIntTokenId);
      console.log('Received NFT data:', nft);
      if (nft && nft.length > 0) {
        alert(`NFT found with content: ${nft[0]}`);
      } else {
        alert('NFT not found.');
      }
    } catch (error) {
      console.error('Error checking NFT:', error);
      alert(`Error checking NFT: ${error.message}`);
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
          <button onClick={check_nft}>Check NFT</button>
        </div>
      )}
      <button onClick={async () => {
      if (authClient) {
        const isAuth = await authClient.isAuthenticated();
        console.log(`Current authentication status: ${isAuth}`);
      } else {
        console.log('AuthClient not initialized');
      }
    }}>Check Auth Status</button>
    </div>
  );
};

export default NFTMinter;