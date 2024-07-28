import React, { useState, useEffect } from 'react';
// import { ICP_NFTs_backend } from 'declarations/ICP_NFTs_backend';
import NFTMinter from './NFT_Minter';

console.log('App.jsx is being executed');
let ICP_NFTs_backend;
try {
  ICP_NFTs_backend = require('declarations/ICP_NFTs_backend').ICP_NFTs_backend;
  console.log('Backend imported successfully');
} catch (error) {
  console.error('Error importing backend:', error);
}

function App() {
  const [greeting, setGreeting] = useState('');
  console.log('App component rendered, greeting:', greeting);

  useEffect(() => {
    console.log('App component mounted');
    // Check if the backend canister is accessible
    ICP_NFTs_backend.greet("Test").then(
      result => console.log('Backend canister responded:', result),
      error => console.error('Error calling backend:', error)
    );
  }, []);

  function handleSubmit(event) {
    event.preventDefault();
    const name = event.target.elements.name.value;
    console.log('Submitting name:', name);
    ICP_NFTs_backend.greet(name).then(
      (greeting) => {
        console.log('Received greeting:', greeting);
        setGreeting(greeting);
      },
      error => console.error('Error getting greeting:', error)
    );
    return false;
  }

  return (
    <main>
      <img src="/logo2.svg" alt="DFINITY logo" />
      <br />
      <br />
      <form action="#" onSubmit={handleSubmit}>
        <label htmlFor="name">Enter your name: &nbsp;</label>
        <input id="name" alt="Name" type="text" />
        <button type="submit">Click Me!</button>
      </form>
      <section id="greeting">{greeting}</section>
      
      <hr />
      
      <NFTMinter />
    </main>
  );
}

export default App;