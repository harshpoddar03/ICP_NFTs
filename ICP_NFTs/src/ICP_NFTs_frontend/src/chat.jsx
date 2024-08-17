import React, { useState, useEffect } from 'react';
import { useAppContext } from './AppContext';
import { useParams, useNavigate } from 'react-router-dom';
import { marked } from 'marked'; // Import the marked library
import DOMPurify from 'dompurify'; // Import DOMPurify for sanitization
import './styles/chat.css';



const NFTImage = ({ nftImage, name }) => {
  const [imageError, setImageError] = React.useState(false);

  const uint8ArrayToBase64 = (uint8Array) => {
    if (!(uint8Array instanceof Uint8Array)) {
      console.error('Invalid image data: not a Uint8Array for NFT:', name);
      return '';
    }
    
    try {
      const binary = String.fromCharCode.apply(null, uint8Array);
      return window.btoa(binary);
    } catch (error) {
      console.error('Error converting Uint8Array to base64 for NFT:', name, error);
      return '';
    }
  };

  const handleImageError = (error) => {
    console.error('Failed to load image for NFT:', name, error);
    setImageError(true);
  };

  const imageSource = React.useMemo(() => {
    if (!nftImage || nftImage.length === 0) {
      console.error('Empty or invalid image data for NFT:', name);
      return '';
    }
    
    try {
      const base64 = uint8ArrayToBase64(nftImage);
      return `data:image/jpeg;base64,${base64}`;
    } catch (error) {
      console.error('Error creating image source for NFT:', name, error);
      return '';
    }
  }, [nftImage, name]);

  if (imageError || !imageSource) {
    return (
      <div className="nft-image-placeholder">
        <p>Image not available for {name || 'Unnamed NFT'}</p>
      </div>
    );
  }

  return (
    <img
      src={imageSource}
      alt={name || 'Unnamed NFT'}
      onError={handleImageError}
      className="nft-image"
    />
  );
};


const Chat = () => {
  const { actor, authClient } = useAppContext();
  const { nftId } = useParams(); // Get nftId from URL
  const navigate = useNavigate();
  const [chatHistory, setChatHistory] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [jwtToken, setJwtToken] = useState(null);
  const [ChatUrl, setChatUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [nftDetails, setNftDetails] = useState(null);
  const [isModelFeaturesOpen, setIsModelFeaturesOpen] = useState(false);

  useEffect(() => {
    if (nftId) {
      initializeChat(nftId);
      fetchNFTDetails(nftId);
    } else {
      navigate('/collections'); // Redirect to collections if no NFT ID is provided
    }
  }, [nftId, actor]);

  const initializeChat = async (id) => {
    setIsInitializing(true);
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
    finally{
      setIsInitializing(false);
    }
  };

  const toggleModelFeatures = () => {
    setIsModelFeaturesOpen(!isModelFeaturesOpen);
  };

  const fetchNFTDetails = async (id) => {
    try {
      const content = await actor.get_token_content(BigInt(id));
      if (Array.isArray(content) && content.length > 0) {
        setNftDetails(content[0]);
      }
    } catch (error) {
      console.error('Error fetching NFT details:', error);
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault(); // Prevents default behavior (like adding a newline)
      sendMessage();
    }
  };

  const sendMessage = async () => {
    if (!userInput.trim()) return;

    const newUserMessage = { type: 'user', content: userInput };
    setChatHistory(prevHistory => [...prevHistory, newUserMessage]);
    setIsLoading(true);

    setUserInput(''); // Clear the input field

    try {
      const response = await fetch('https://1889-115-117-107-100.ngrok-free.app/chat', {
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

      const rawMarkdown = responseData.answer || 'No answer provided';
      console.log("Raw Markdown:", rawMarkdown);
      const sanitizedHtml = DOMPurify.sanitize(marked(rawMarkdown));

      
    const wrappedHtml = `<div class="bot-response">${sanitizedHtml}</div>`;

    const newBotMessage = {
      type: 'bot',
      content: wrappedHtml
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
  <div className="chat-page">
    <div className="sidebar">
    {nftDetails && (
      <>
          <div className="nft-image-container">
              <NFTImage nftImage={nftDetails.nft_image} name={nftDetails.name} />
            </div>
        <h2>{nftDetails.name || 'Unnamed NFT'}</h2>
        <p>{nftDetails.description || 'No description available'}</p>
        <div className="model-info">
        <div className="model-tag" onClick={toggleModelFeatures}>
                <span className="model-name">
                  Model: {nftDetails.model || 'Unknown'}
                </span>
                <span className="arrow-down"></span>
              </div>
              {isModelFeaturesOpen && (
                <ul className="model-features">
                  <li>Content window: 16k</li>
                  <li>Feature 2</li>
                  <li>Feature 3</li>
                </ul>
              )}
            </div>
      </>
    )}
  </div>
    <div className="chat-container">
      
      <h2 className="chat-header">Chat with NFT #{nftId}</h2>
      <div className="chat-messages">
      {chatHistory.map((message, index) => (
          <div key={index} className={`message ${message.type}-message`}>
            {message.type === 'bot' ? (
              <div dangerouslySetInnerHTML={{ __html: message.content }} />
            ) : (
              <p>{message.content}</p>
            )}
          </div>
        ))}
        {isLoading && (
          <div className="loading-indicator"></div>
        )}
      </div>
      <div className="chat-input-container">
      {isInitializing && (
          <div className="initializing-message">Loading your model...</div>
        )}
        <input
          className="chat-input"
          type="text"
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          placeholder="Type your message..."
          onKeyDown={handleKeyDown}
          // disabled={isLoading || isInitializing}
        />
        <button 
          className="send-button"
          onClick={sendMessage} 
          disabled={isLoading || isInitializing}
        >
          <svg className="send-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M22 2L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
    </div>
    </div>
  );
}

export default Chat;