import React, { useState, useEffect } from 'react';
import { AuthClient } from '@dfinity/auth-client';
import { Actor, HttpAgent } from '@dfinity/agent';
import { idlFactory } from '../../declarations/ICP_NFTs_backend/ICP_NFTs_backend.did.js';
import { Principal } from '@dfinity/principal';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from './AppContext';
import tempImage from './temp2.jpg';
import './styles/NFT_Minter.css';

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
    maxTimeToLive: BigInt(1) * BigInt(24) * BigInt(3600000000000),
  },
};

const NFTMinter = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [principal, setPrincipal] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const { actor, setActor, authClient, setAuthClient } = useAppContext();

  const backgroundStyle = {
    backgroundImage: `url(${tempImage})`,
  };

  useEffect(() => {
    const initAuth = async () => {
      try {
        const client = await AuthClient.create(defaultOptions.createOptions);
        setAuthClient(client);
        const isAuthed = await client.isAuthenticated();
        if (isAuthed) {
          await handleAuthenticated(client);
        }
      } catch (error) {
        console.error('Error creating AuthClient:', error);
      }
    };

    initAuth();
  }, []);

  const handleAuthenticated = async (client) => {
    try {
      const identity = await client.getIdentity();
      setPrincipal(identity.getPrincipal());
      
      if (identity.getPrincipal().isAnonymous()) {
        console.log('Warning: Anonymous principal detected');
        return;
      }

      const agent = new HttpAgent({ identity, verifyQuerySignatures: false });
      if (process.env.DFX_NETWORK !== "ic") {
        await agent.fetchRootKey();
      }

      const newActor = Actor.createActor(idlFactory, {
        agent,
        canisterId: process.env.CANISTER_ID_ICP_NFTS_BACKEND,
      });
      setActor(newActor);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Error in handleAuthenticated:', error);
    }
  };

  const login = async () => {
    if (!authClient) {
      console.error('AuthClient not initialized');
      return;
    }

    try {
      await authClient.login({
        ...defaultOptions.loginOptions,
        onSuccess: () => {
          handleAuthenticated(authClient);
        },
        onError: (error) => {
          console.error('Login error:', error);
        },
      });
    } catch (error) {
      console.error('Error during login:', error);
    }
  };

  const logout = async () => {
    if (!authClient) {
      console.error('AuthClient not initialized');
      return;
    }
    try {
      await authClient.logout();
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  const handleCreate = () => navigate('/create_nft');
  const handleTrade = () => navigate('/trade');
  const handleChat = () => navigate('/chat');


  return (
    <div className="nft-minter" style={{ backgroundImage: `url(${tempImage})` }}>
      <div className="top-bar">
        <div className="logo">RAG BOT</div>
        {isAuthenticated && (
          <div className="dropdown">
            <button 
              className="dropdown-toggle"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            >
              {principal && `${principal.toString().slice(0, 10)}...`}
              <span className="arrow-down"></span>
            </button>
            {isDropdownOpen && (
              <div className="dropdown-menu">
                <button onClick={handleChat}>Chat</button>
                <button onClick={handleCreate}>Create</button>
                <button onClick={logout}>Logout</button>
              </div>
            )}
          </div>
        )}
      </div>
      <div className="main-content">
        <h1>Own your AI. A decentralized Future</h1>
        <p>Revolutionizing AI ownership through decentralized technology</p>
        <div className="button-container">
          {isAuthenticated ? (
            <button className="button primary" onClick={handleCreate}>
              Get Started
            </button>
          ) : (
            <button className="button primary" onClick={login}>
              Login with Internet Identity
            </button>
          )}
          <button className="button secondary">Lite Paper</button>
        </div>
      </div>
    </div>
  );
};

export default NFTMinter;