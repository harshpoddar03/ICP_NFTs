import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const CreateNFT = ({ actor, authClient }) => {
  const navigate = useNavigate();
  const [nftContent, setNftContent] = useState('');
  const [pdfFile, setPdfFile] = useState(null);
  const [selectedModel, setSelectedModel] = useState('');
  const [nftCreate,setNftCreate] = useState(false);
  const [pdfContent, setPdfContent] = useState([]);
  const [embeddings, setEmbeddings] = useState([]);
  const [embeddingsGenerated, setEmbeddingsGenerated] = useState(false);

  const handleModelChange = (event) => {
    setSelectedModel(event.target.value);
  };



  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file && file.type === 'application/pdf') {
      setPdfFile(file);
      console.log('PDF file selected:', file.name);
    } else {
      alert('Please select a PDF file');
      setPdfFile(null);
    }
  };

  const uploadPdf = async () => {
    if (!pdfFile || !actor) {
      console.error('No PDF file selected or actor not initialized');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('file', pdfFile);

      const response = await fetch('https://b9b6-106-193-216-5.ngrok-free.app/make_embedding', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      setEmbeddings(result.embeddings);
      setPdfContent(result.document);
      setEmbeddingsGenerated(true);
      
      console.log('Upload successful:', result);
      alert('PDF uploaded and processed successfully!');
    //   setNftContent(JSON.stringify(result)); // Store the result as NFT content
    } catch (error) {
      console.error('Error uploading PDF:', error);
      alert('Error uploading PDF');
    }
  };

  const mintNFT = async () => {
    if (!actor) return;
    try {
      const identity = await authClient.getIdentity();
      const userPrincipal = identity.getPrincipal();

      const tokenId = await actor.mint_nft(userPrincipal, selectedModel, document, embeddings);
        setNftCreate(true);

      console.log('NFT minted with token ID:', tokenId);
      alert(`NFT minted with token ID: ${tokenId}`);
    //   navigate('/'); // Navigate back to the main page after minting
    } catch (error) {
      console.error('Error minting NFT:', error);
    }
  };

  return (
    <div>
      <h2>Create NFT</h2>
      <select value={selectedModel} onChange={handleModelChange}>
        <option value="">Select a model</option>
        <option value="Llama 3.1">Llama 3.1</option>
        <option value="Llama 70b">Llama 70b</option>
    </select>
    {nftCreate ? (
    <button onClick={() => navigate('/chat')}>Chat</button>
) : null}

      <input 
        type="file" 
        accept=".pdf" 
        onChange={handleFileChange} 
      />
      <button onClick={uploadPdf} disabled={!pdfFile}>
        Upload and Process PDF
      </button>

      {/* <button onClick={mintNFT} disabled={!nftContent}>
        Mint NFT
      </button> */}
      {embeddingsGenerated ? (  <button onClick={mintNFT} disabled={!nftContent}>
        Mint NFT
      </button> ) : null}

      <button onClick={() => navigate('/')}>Back to Main</button>
    </div>
  );
};

export default CreateNFT;