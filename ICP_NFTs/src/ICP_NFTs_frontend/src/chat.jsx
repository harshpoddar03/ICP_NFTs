import React, { useState, useEffect } from 'react';
import { useAppContext } from './AppContext';
import './styles/chat.css';


const Chat = () => {
  const { actor, authClient } = useAppContext();
  const [nftIds, setNftIds] = useState([]);
  const [selectedNftId, setSelectedNftId] = useState(null);
  // const [selectedNftContent, setSelectedNftContent] = useState(null);
  const [chatHistory, setChatHistory] = useState([]);
//   const [userInput, setUserInput] = useState('');
  // const [embeddings, setEmbeddings] = useState([[]]);
  // const [documents, setDocuments] = useState([]);
  const [userInput, setUserInput] = useState('');
  // const [result, setResult] = useState(null);
  const [jwtToken, setJwtToken] = useState(null);
  const [ChatUrl, setChatUrl] = useState(null);
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
    setSelectedNftId(nftId);
    setJwtToken(null);
    setChatUrl(null);
    setChatHistory([]);

    try {
      const response = await actor.chat(BigInt(nftId));
      console.log(response)
      if ('Ok' in response) {
        const { jwt_token, url } = response.Ok;
        setJwtToken(jwt_token);
        setChatUrl(url);
        console.log("JWT Token:", jwt_token);
        console.log("Chat URL:", url);
      } else {
        // Handle the case where the response is not as expected
        console.error("Unexpected response format:", response);
        // You might want to show an error message to the user here
      }
    } catch (error) {
      console.error('Error initiating chat:', error);
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

      // Send API request
      const response = await fetch('https://1320-115-117-107-100.ngrok-free.app/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': jwtToken
        },
        body: JSON.stringify({ query: userInput,url: ChatUrl  }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Update chat history
      const responseData = await response.json();
      // setResult({
      //   query: userInput,
      //   answer: responseData.answer || 'No answer provided'
      // });
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