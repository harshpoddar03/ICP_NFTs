import React, { useState } from 'react';
import { ICP_NFTs_backend } from 'declarations/ICP_NFTs_backend';
import NFTMinter from './NFT_Minter';

function App() {
  const [greeting, setGreeting] = useState('');
  console.log('greeting:', greeting);
  function handleSubmit(event) {
    event.preventDefault();
    const name = event.target.elements.name.value;
    ICP_NFTs_backend.greet(name).then((greeting) => {
      setGreeting(greeting);
    });
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