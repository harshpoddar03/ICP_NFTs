import React, { useState, useEffect } from 'react';
import { useAppContext } from './AppContext';
import { useParams, useNavigate } from 'react-router-dom';
import './styles/chat.css';

const Chat = () => {
  const { actor, authClient } = useAppContext();
  const { nftId } = useParams(); // Get nftId from URL
  const navigate = useNavigate();
  const [chatHistory, setChatHistory] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [jwtToken, setJwtToken] = useState(null);
  const [ChatUrl, setChatUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (nftId) {
      initializeChat(nftId);
    } else {
      navigate('/collections'); // Redirect to collections if no NFT ID is provided
    }
  }, [nftId, actor]);

  const initializeChat = async (id) => {
    try {
      const response = await actor.chat(BigInt(id));
      if ('Ok' in response) {
        const { jwt_token, url } = response.Ok;
        setJwtToken(jwt_token);
        setChatUrl(url);
        console.log("JWT Token:", jwt_token);
        console.log("Chat URL:", url);
      } else {
        console.error("Unexpected response format:", response);
        // Handle error, maybe show a message to the user
      }
    } catch (error) {
      console.error('Error initiating chat:', error);
      // Handle error, maybe show a message to the user
    }
  };

  const sendMessage = async () => {
    if (!userInput.trim()) return;

    const newUserMessage = { type: 'user', content: userInput };
    setChatHistory(prevHistory => [...prevHistory, newUserMessage]);
    setIsLoading(true);

    try {
      const response = await fetch('https://669a-115-117-107-100.ngrok-free.app/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': jwtToken
        },
        body: JSON.stringify({ query: userInput, url: ChatUrl }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const responseData = await response.json();
      const newBotMessage = {
        type: 'bot',
        content: responseData.answer || 'No answer provided'
      };
      setChatHistory(prevHistory => [...prevHistory, newBotMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = {
        type: 'bot',
        content: `An error occurred: ${error.message}`
      };
      setChatHistory(prevHistory => [...prevHistory, errorMessage]);
    } finally {
      setIsLoading(false);
      setUserInput('');
    }
  };

  return (
    <div className="chat-container">
      <h2 className="chat-header">Chat with NFT #{nftId}</h2>
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
          disabled={isLoading}
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