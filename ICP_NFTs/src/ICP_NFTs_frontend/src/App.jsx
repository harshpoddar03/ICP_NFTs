import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import NFTMinter from './NFT_Minter';
import CreateNFT from './create_nft';

function App() {
  console.log('Inside App.jsx');
  
  return (
    <div className="App">
      <Router>
        <Routes>
          <Route path="/create_nft" element={<CreateNFT />} />
          <Route path="/" element={<NFTMinter />} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;