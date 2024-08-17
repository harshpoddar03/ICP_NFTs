import React from 'react';
import {Route, Routes } from 'react-router-dom';
import NFTMinter from './NFT_Minter';
import CreateNFT from './create_nft';
import Chat from './chat';
import { AppProvider } from './AppContext';
import { HashRouter as Router } from 'react-router-dom';

function App() {
  console.log('Inside App.jsx');
  
  return (
    <div className="App" style={{backgroundColor: 'black'}}>
      <AppProvider>
      <Router>
        <Routes>
          <Route path="/create_nft" element={<CreateNFT />} />
          <Route path="/" element={<NFTMinter />} />
          <Route path="/chat" element={<Chat />} />
        </Routes>
      </Router>
      </AppProvider>
    </div>
  );
}

export default App;