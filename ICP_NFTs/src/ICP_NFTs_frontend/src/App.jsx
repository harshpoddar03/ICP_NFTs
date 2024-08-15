import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import NFTMinter from './NFT_Minter';
import CreateNFT from './create_nft';
import Chat from './chat';
import { AppProvider } from './AppContext';

function App() {
  console.log('Inside App.jsx');
  
  return (
    <div className="App">
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