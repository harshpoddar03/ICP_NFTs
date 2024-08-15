import React, { useState, useEffect } from 'react';
import { useAppContext } from './AppContext';
import './styles/chat.css';


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
  const [isLoading, setIsLoading] = useState(false);

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

    const newUserMessage = {
      type: 'user',
      content: userInput
    };
    setChatHistory(prevHistory => [...prevHistory, newUserMessage]);
    setIsLoading(true);

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
      const response = await fetch('https://3a9f-106-193-168-129.ngrok-free.app/chat', {
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
      const newBotMessage = {
        type: 'bot',
        content: responseData.answer || 'No answer provided'
      };
      // const newMessage = {
      //   type: 'user',
      //   content: userInput
      // };
      // const newResponse = {
      //   type: 'bot',
      //   content: responseData.answer || 'No answer provided'
      // };
      // setChatHistory(prevHistory => [...prevHistory, newMessage, newResponse]);
      setChatHistory(prevHistory => [...prevHistory, newBotMessage]);
    } catch (error) {
        console.error('Error sending message:', error);
        const errorMessage = {
          type: 'bot',
          content: `An error occurred: ${error.message}`
        };
        setChatHistory(prevHistory => [...prevHistory, errorMessage]);
    } finally{
      setIsLoading(false);
      setUserInput('');

    }
  };

  return (
    <div className="chat-container">
      <h2 className="chat-header">Chat with Your NFT</h2>
      <div className="nft-select-container">
        <h3>Select an NFT:</h3>
        <select 
          className="nft-select"
          onChange={(e) => handleNftSelect(e.target.value)} 
          value={selectedNftId ? bigIntToString(selectedNftId) : ''}
        >
          <option value="">Select an NFT</option>
          {nftIds.map((nftId, index) => (
            <option key={index} value={bigIntToString(nftId)}>
              NFT #{bigIntToString(nftId)}
            </option>
          ))}
        </select>
      </div>
      <div className="chat-messages">
        {chatHistory.map((message, index) => (
          <div key={index} className={`message ${message.type}-message`}>
            <p>{message.content}</p>
          </div>
        ))}
        {isLoading && (
          <div className="loading-indicator"></div>
        )}
      </div>
      <div className="chat-input-container">
        <input
          className="chat-input"
          type="text"
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          placeholder="Type your message..."
        />
        <button 
          className="send-button"
          onClick={sendMessage} 
          disabled={!selectedNftId || isLoading}
        >
          <svg className="send-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M22 2L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
    </div>
  );
}

export default Chat;