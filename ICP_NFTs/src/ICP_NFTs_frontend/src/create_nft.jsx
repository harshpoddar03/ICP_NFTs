// CreateNFT.js
import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Paperclip, Upload, X, Image } from 'lucide-react';
import { useAppContext } from './AppContext';
import './styles/CreateNFT.css';
import { Alert, Snackbar } from '@mui/material';

const CreateNFT = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [nftImagePreview, setNftImagePreview] = useState(null);
  const [nftImage, setNftImage] = useState(null);
  const [pdfFiles, setPdfFiles] = useState([]);
  const { actor, authClient } = useAppContext();
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const [nftCreated, setNftCreated] = useState(false);

  const handleNameChange = (event) => setName(event.target.value);
  const handleDescriptionChange = (event) => setDescription(event.target.value);
  const handleModelChange = (event) => setSelectedModel(event.target.value);

  const handleImageChange = (event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
      setNftImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setNftImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      alert('Please select an image file');
    }
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

  const uploadNFT = async () => {
    if (!nftImage || pdfFiles.length === 0 || !name || !description || !selectedModel || !actor) {
      alert('Please fill in all fields and upload required files');
      return;
    }

    try {
      const pdfContents = await Promise.all(pdfFiles.map(file => file.arrayBuffer()));
      const pdfContentArrays = pdfContents.map(buffer => Array.from(new Uint8Array(buffer)));

      const identity = await authClient.getIdentity();
      const userPrincipal = identity.getPrincipal();

      const nftImageArray = Array.from(new Uint8Array(await nftImage.arrayBuffer()));

      const input = {
        pdf_contents: pdfContentArrays,
        name: name,
        description: description,
        selected_model: selectedModel,
        owner_principal: userPrincipal,
        nft_image: nftImageArray
      };

      const tokenId = await actor.process_pdfs_and_mint_nft(input);
      setNftCreated(true);
      console.log('NFT minted with token ID:', tokenId);
      // alert(`NFT minted with token ID: ${tokenId}`);
    } catch (error) {
      console.error('Error processing PDFs and minting NFT:', error);
      alert('Error processing PDFs and minting NFT');
    }
  };

  const handleCloseAlert = () => {
    setNftCreated(false);
  };

  return (
    <div className="create-nft-container">
        <Snackbar 
        open={!!nftCreated}
        autoHideDuration={6000} 
        onClose={handleCloseAlert}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseAlert} severity="success" sx={{ width: '100%' }}>
          NFT Created Successfully !
        </Alert>
      </Snackbar>
      <button 
        className="back-button"
        onClick={() => navigate('/')}
      >
        Back to Main
      </button>

      <div className="create-nft-form">
        <div className="form-group">
          <label>NFT Image</label>
          <div className="nft-image-preview">
            <div className="nft-image-circle">
              {nftImagePreview ? (
                <img src={nftImagePreview} alt="NFT Preview" />
              ) : (
                <Image size={40} />
              )}
            </div>
            <input 
              type="file" 
              accept="image/*" 
              onChange={handleImageChange}
              ref={imageInputRef}
              className="hidden-input"
            />
            <button 
              onClick={() => imageInputRef.current.click()}
              className="change-photo-button"
            >
              {nftImage ? 'Change Photo' : 'Select Photo'}
            </button>
          </div>
        </div>

        <div className="form-group">
          <label className='name-label'>Name of NFT</label>
          <input 
            type="text" 
            value={name} 
            onChange={handleNameChange}
            className="text-input"
            placeholder="Enter NFT name"
          />
        </div>

        <div className="form-group">
          <label className='desc-label'>Description</label>
          <textarea 
            value={description} 
            onChange={handleDescriptionChange}
            className="text-input"
            placeholder="Enter NFT description"
            rows="3"
          />
        </div>

        <div className="form-group">
          <label className='select-label'>Select Model</label>
          <select 
            value={selectedModel} 
            onChange={handleModelChange}
            className="select-input"
          >
            <option value="">Select a model</option>
            <option value="Llama 3.1">Llama 3.1</option>
            <option value="Llama 70b">Llama 70b</option>
          </select>
        </div>

        <div className="form-group">
          <label className="upload-label">Upload Knowledge. Fine Tune Your Model</label>
          <div className="pdf-upload-area">
            <input 
              type="file" 
              ref={fileInputRef}
              accept=".pdf" 
              onChange={handleFileChange} 
              multiple
              className="hidden-input"
            />
            {pdfFiles.length > 0 ? (
              <div className="pdf-file-list">
                {pdfFiles.map((file, index) => (
                  <div key={index} className="pdf-file-item">
                    <div className="pdf-icon">PDF</div>
                    <span className="pdf-name">{file.name}</span>
                    <button onClick={() => handleRemoveFile(index)} className="remove-file-button">
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p>Click the attach button</p>
            )}
          </div>
          <div className="button-group">
            <button 
              onClick={() => fileInputRef.current.click()}
              className="attach-button"
            >
              <Paperclip size={20} /> Attach
            </button>
            <button 
              onClick={uploadNFT}
              className="upload-button"
            >
              <Upload size={20} /> Upload
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateNFT;