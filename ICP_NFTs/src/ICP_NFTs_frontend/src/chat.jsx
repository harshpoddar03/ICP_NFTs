import React, { useState, useEffect } from 'react';
import { useAppContext } from './AppContext';

const Chat = () => {
  const { actor, authClient } = useAppContext();
  const [nftIds, setNftIds] = useState([]);
  const [selectedNftId, setSelectedNftId] = useState(null);
  const [selectedNftContent, setSelectedNftContent] = useState(null);
  const [chatHistory, setChatHistory] = useState([]);
//   const [userInput, setUserInput] = useState('');
  const [embeddings, setEmbeddings] = useState([[]]);
  const [documents, setDocuments] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [result, setResult] = useState(null);


  useEffect(() => {
    fetchUserNfts();
  }, [actor]);

  const fetchUserNfts = async () => {
    if (!actor || !authClient) return;

    try {
      const identity = await authClient.getIdentity();
      const userPrincipal = identity.getPrincipal();
      console.log("Inside fetchUserNfts");
      const userNftIdsArray = await actor.all_user_nfts(userPrincipal);
      const userNftIds = Array.from(userNftIdsArray);
      setNftIds(userNftIds);
      console.log("User NFTs:", userNftIds);

    } catch (error) {
      console.error('Error fetching user NFTs:', error);
    }
  };

  const bigIntToString = (bigIntValue) => {
    return bigIntValue.toString();
  };

  const handleNftSelect = async (nftId) => {
    try {
      const nftContent = await actor.get_token_content(BigInt(nftId));
      setSelectedNftId(nftId);
      const nftContentmain = nftContent[0];
      setDocuments(nftContentmain.pdfcontent);
      setEmbeddings (nftContentmain.embeddings);

      console.log("NFT content:", nftContent);

    } catch (error) {
      console.error('Error fetching NFT content:', error);
    }
  };

  const sendMessage = async () => {
    if (!selectedNftId || !userInput.trim()) return;

    try {
      // Prepare the data to send to the API
      console.log(embeddings);
      console.log(documents);
      const requestData = {
        query: userInput,
        embeddings: embeddings,
        document: documents
      };

      // Send API request
      const response = await fetch('https://6393-106-193-216-5.ngrok-free.app/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Update chat history
      const responseData = await response.json();
      setResult({
        query: userInput,
        answer: responseData.answer || 'No answer provided'
      });
      setUserInput('');
    } catch (error) {
        console.error('Error sending message:', error);
        setResult({
          query: userInput,
          answer: `An error occurred: ${error.message}`
        });
    }
  };

  return (
    <div>
      <h2>Chat with Your NFT</h2>
      <div>
        <h3>Select an NFT:</h3>
        <select onChange={(e) => handleNftSelect(e.target.value)} value={selectedNftId ? bigIntToString(selectedNftId) : ''}>
          <option value="">Select an NFT</option>
          {nftIds.map((nftId, index) => (
            <option key={index} value={bigIntToString(nftId)}>
              NFT #{bigIntToString(nftId)}
            </option>
          ))}
        </select>
      </div>
      <div>
        <h3>Chat:</h3>
        <input
          type="text"
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          placeholder="Type your message..."
        />
        <button onClick={sendMessage} disabled={!selectedNftId}>Send</button>
      </div>
      {result && (
        <div>
          <h3>Result:</h3>
          <p><strong>Query:</strong> {result.query}</p>
          <p><strong>Answer:</strong> {result.answer}</p>
        </div>
      )}
    </div>
  );
};

export default Chat;