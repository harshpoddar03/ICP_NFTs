import React, { useState , useRef } from 'react';
import { useAppContext } from './AppContext';
import './styles/create_nfts.css';
import { useNavigate } from 'react-router-dom';
import { Paperclip, Upload , X } from 'lucide-react'; // Import icons

const CreateNFT = () => {
  const navigate = useNavigate();
  const [nftContent, setNftContent] = useState('');
  const [pdfFile, setPdfFile] = useState(null);
  const [selectedModel, setSelectedModel] = useState('');
  const [nftCreate,setNftCreate] = useState(false);
  const [pdfFiles, setPdfFiles] = useState([]);
  const [embeddings, setEmbeddings] = useState([]);
  const [embeddingsGenerated, setEmbeddingsGenerated] = useState(false);
  const [pdfContent, setPdfContent] = useState([]);
  const [name, setName] = useState('');

  const {actor, authClient} = useAppContext();
  const fileInputRef = useRef(null);

  const handleModelChange = (event) => {
    setSelectedModel(event.target.value);
  };


  const handleFileChange = (event) => {
    const files = Array.from(event.target.files);
    const validFiles = files.filter(file => file.type === 'application/pdf');
    
    if (validFiles.length !== files.length) {
      alert('Please select only PDF files');
    }

    setPdfFiles(prevFiles => [...prevFiles, ...validFiles]);
  };

  const handleRemoveFile = (index) => {
    setPdfFiles(prevFiles => prevFiles.filter((_, i) => i !== index));
  };

  const uploadPdf = async () => {
    if (pdfFiles.length === 0 || !actor || !selectedModel || !name) {
      console.error('Missing required information');
      return;
    }

    try {
      const pdfContents = await Promise.all(pdfFiles.map(file => file.arrayBuffer()));
      const pdfContentArrays = pdfContents.map(buffer => Array.from(new Uint8Array(buffer)));

      const identity = await authClient.getIdentity();
      const userPrincipal = identity.getPrincipal();

      const input = {
        pdf_contents: pdfContentArrays,
        selected_model: selectedModel,
        name: name,
        owner_principal: userPrincipal
      };

      const tokenId = await actor.process_pdfs_and_mint_nft(input);

      setNftCreate(true);
      console.log('NFT minted with token ID:', tokenId);
      alert(`NFT minted with token ID: ${tokenId}`);
    } catch (error) {
      console.error('Error processing PDFs and minting NFT:', error);
      alert('Error processing PDFs and minting NFT');
    }
  };
  const handleNameChange = (event) => {
    setName(event.target.value);
  };
  // const convertDocuments = (documents) => {
  //   return documents.map(doc => {
  //     // Convert each document object to an array of [key, value] pairs
  //     return Object.entries(doc).map(([key, value]) => [key, value.toString()]);
  //   });
  // };

  const mintNFT = async () => {
    if (!actor) return;
    try {
      const identity = await authClient.getIdentity();
      const userPrincipal = identity.getPrincipal();



      const tokenId = await actor.mint_nft(userPrincipal, selectedModel, embeddings, pdfContent);
        setNftCreate(true);

      console.log('NFT minted with token ID:', tokenId);
      alert(`NFT minted with token ID: ${tokenId}`);
    //   navigate('/'); // Navigate back to the main page after minting
    } catch (error) {
      console.error('Error minting NFT:', error);
    }
  };

  return (
    <div className="create-nft-container">
      <h2>Create NFT</h2>
      <div className="top-buttons">
        <button className="nav-button" onClick={() => navigate('/')}>Back to Main</button>
        {embeddingsGenerated && (
          <button className="mint-button" onClick={mintNFT}>Mint NFT</button>
        )}
        {nftCreate && (
          <button className="chat-button" onClick={() => navigate('/chat')}>Chat</button>
        )}
      </div>
      
      <div className="content-wrapper">
        
          <div className="model-selection">
            <select value={selectedModel} onChange={handleModelChange}>
              <option value="">Select a model</option>
              <option value="Llama 3.1">Llama 3.1</option>
              <option value="Llama 70b">Llama 70b</option>
            </select>
          </div>

          
        <input
          type="text"
          value={name}
          onChange={handleNameChange}
          placeholder="Enter NFT name"
          className="nft-name-input"
        />

    

        <div className="file-upload-area">
          <input 
            type="file" 
            ref={fileInputRef}
            accept=".pdf" 
            onChange={handleFileChange} 
            multiple
            style={{display: 'none'}}
          />
          {pdfFiles.length > 0 ? (
            <div className="file-list">
              {pdfFiles.map((file, index) => (
                <div key={index} className="file-item">
                  <div className="file-info">
                    <div className="file-icon"></div>
                    <span className="file-name">{file.name}</span>
                  </div>
                  <button className="close-button" onClick={() => handleRemoveFile(index)}>
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p>Drag & drop PDF files here or click the attach button</p>
          )}
        </div>
        <div className="upload-icons">
            <div className="icon-button attach-button" onClick={() => fileInputRef.current.click()}>
              <Paperclip size={20} />
            </div>
            <div className="icon-button upload-button" onClick={uploadPdf}>
              <Upload size={20} />
            </div>
          </div>
      </div>
    </div>
  );
};

export default CreateNFT;