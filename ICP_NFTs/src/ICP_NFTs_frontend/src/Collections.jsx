import React, { useState, useEffect } from 'react';
import { useAppContext } from './AppContext';
import { useNavigate } from 'react-router-dom';
import { 
  Card, 
  CardContent, 
  CardMedia,
  Typography, 
  Grid, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  Button, 
  Box,
  CircularProgress
} from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import './styles/Collections.css'; // Import the NFT_Minter styles
import { Alert, Snackbar } from '@mui/material';
// import AddIcon from '@mui/icons-material/Add'; // Import the Add icon


const theme = createTheme({
  palette: {
    mode: 'dark',
    background: {
      default: '#000000',
      paper: '#121212',
    },
  },
});


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
      console.log(`Image base64 for NFT ${name} (first 100 chars):`, base64.substring(0, 100));
      
      if (!base64.startsWith('/9j/') && !base64.startsWith('iVBOR')) {
        console.warn('Unexpected image data format for NFT:', name);
      }
      
      return `data:image/jpeg;base64,${base64}`;
    } catch (error) {
      console.error('Error creating image source for NFT:', name, error);
      return '';
    }
  }, [nftImage, name]);

  if (imageError || !imageSource) {
    return (
      <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f0f0f0' }}>
        <Typography variant="body2">Image not available for {name || 'Unnamed NFT'}</Typography>
      </div>
    );
  }

  return (
    <CardMedia
      component="img"
      height="200"
      image={imageSource}
      alt={name || 'Unnamed NFT'}
      onError={handleImageError}
    />
  );
};

const NFTCollection = () => {
  const { actor, authClient } = useAppContext();
  const [nfts, setNfts] = useState([]);
  const [selectedNft, setSelectedNft] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [principal, setPrincipal] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isApiDialogOpen, setIsApiDialogOpen] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [isApiLoading, setIsApiLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchUserNfts();
    fetchPrincipal()
  }, [actor, authClient]);

  const fetchUserNfts = async () => {
    if (!actor || !authClient) return;

    try {
      const identity = await authClient.getIdentity();
      const userPrincipal = identity.getPrincipal();
      const userNftIdsArray = await actor.all_user_nfts(userPrincipal);
      const userNftIds = Array.from(userNftIdsArray);
      
      const nftDetails = await Promise.all(userNftIds.map(async (id) => {
        const content = await actor.get_token_content(BigInt(id));
        console.log('Raw NFT Content:', content);
        if (Array.isArray(content) && content.length > 0) {
          const nft = content[0];
          console.log('NFT Image type:', typeof nft.nft_image);
          console.log('NFT Image length:', nft.nft_image ? nft.nft_image.length : 'N/A');
          console.log('NFT Name:', nft.name);
          return { ...nft, id };
        }
        return null;
      }));
      
      const validNfts = nftDetails.filter(nft => nft !== null);
      console.log('Valid NFTs:', validNfts.length);
      setNfts(validNfts);
    } catch (error) {
      console.error('Error fetching user NFTs:', error);
    }
  };

  const openNftDetails = (nft) => {
    console.log('Opening details for NFT:', nft);
    setSelectedNft(nft);
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setSelectedNft(null);
  };

  const openChat = (nftId) => {
    navigate(`/chat/${nftId}`);
  };


  const getOwnerText = (owner) => {
    if (!owner) return 'Unknown';
    if (typeof owner.toText === 'function') {
      try {
        return owner.toText();
      } catch (error) {
        console.error('Error calling toText on owner:', error);
        return 'Error getting owner';
      }
    }
    return 'Invalid owner format';
  };

  const fetchPrincipal = async () => {
    if (authClient) {
      const identity = await authClient.getIdentity();
      setPrincipal(identity.getPrincipal());
    }
  };


  const handleCreate = () => navigate('/create_nft');
  const handleTrade = () => navigate('/trade');
  const handleCollections = () => navigate('/collections');

  const logout = async () => {
    if (authClient) {
      await authClient.logout();
      navigate('/');
    }
  };

  const handleCreateNFT = () => {
    navigate('/create_nft');
  };

  const handleApiClick = async (id) => {
    setIsDialogOpen(false);
    setIsApiDialogOpen(true);
    setIsApiLoading(true);
    try {
      const response = await actor.generate_api_key(BigInt(id));
      if ('Ok' in response) {
        const { api_key } = response.Ok;
        setApiKey(api_key);
      } else {
        console.error("Unexpected response format:", response);
        // Handle error, maybe show a message to the user
      }
    } catch (error) {
      console.error('Error generating API key:', error);
      // Handle error, maybe show a message to the user
    } finally {
      setIsApiLoading(false);
    }
  };

  const truncateAddress = (address) => {
    if (typeof address !== 'string') return 'Invalid Address';
    if (address.length <= 13) return address;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };



  // const handleCloseAlert = () => {
  //   setApi(null);
  // };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      // You can add a notification here to inform the user that the text was copied
      console.log('Text copied to clipboard');
    }, (err) => {
      console.error('Could not copy text: ', err);
    });
  };

  const apiEndpoint = "https://1d54-115-117-107-100.ngrok-free.app"; // Replace with your actual API endpoint

  return (
    <div className="nft-collection">
        {/* <Snackbar 
        open={!!Api} 
        autoHideDuration={6000} 
        onClose={handleCloseAlert}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseAlert} severity="success" sx={{ width: '100%' }}>
          API Key generated: {Api}
        </Alert>
      </Snackbar> */}
      <div className="top-bar">
        <div className="logo">NeuraNFT</div>
        {principal && (
          <div className="dropdown">
            <button 
              className="dropdown-toggle"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            >
              {principal.toString().slice(0, 10)}...
              <span className="arrow-down"></span>
            </button>
            {isDropdownOpen && (
              <div className="dropdown-menu">
                <button onClick={handleCollections}>Collections</button>
                <button onClick={handleCreate}>Create</button>
                <button onClick={logout}>Logout</button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="collection-content">
        <h1 className="collection-title">Your NFT Collection</h1>
        <div className="nft-grid">

        <div className="nft-card create-nft" onClick={handleCreateNFT}>
            <div className="create-nft-content">
              <span className="plus-sign">+</span>
              {/* <Typography variant="h6">Create New NFT</Typography> */}
            </div>
          </div>
          {nfts.map((nft, index) => (
            <div key={index} className="nft-card" onClick={() => openNftDetails(nft)}>
              <NFTImage nftImage={nft.nft_image} name={nft.name || `NFT ${index + 1}`} />
              <div className="nft-details">
                <h2 className="nft-name">{nft.name || `NFT ${index + 1}`}</h2>
              </div>
            </div>
          ))}
        </div>
      </div>
      <Dialog open={isDialogOpen} onClose={closeDialog} maxWidth="false" fullWidth="false">
    <DialogContent className="dialog-content dialog-box-container-main">
      {selectedNft && (
        <>
          <div className="dialog-image">
            <NFTImage nftImage={selectedNft.nft_image} name={selectedNft.name || 'Unnamed NFT'} />
          </div>
          <div className="dialog-details">
            <h2>{selectedNft.name || 'Unnamed NFT'}</h2>
            <p className="description"><strong>Description:</strong> {selectedNft.description || 'No description available'}</p>
            <div className="tag-container">
              <div className="tag model-tag" title={selectedNft.model || 'Unknown model'}>
                Model: {selectedNft.model || 'Unknown model'}
              </div>
              <div 
                className="tag owner-tag" 
                title={getOwnerText(selectedNft.owner)}
                onClick={() => copyToClipboard(getOwnerText(selectedNft.owner))}
              >
                Owner: {truncateAddress(getOwnerText(selectedNft.owner))}
              </div>
            </div>
            <div className="button-container-collections">
              <button className="dialog-button chat button" onClick={() => openChat(selectedNft.id)}>
                Chat
              </button>
              <button className="dialog-button api-button" onClick={() => handleApiClick(selectedNft.id)}>
                Get API
              </button>
            </div>
          </div>
          <button className="dialog-close " onClick={closeDialog}>
            ×
          </button>
        </>
      )}
    </DialogContent>
  </Dialog>

  <Dialog open={isApiDialogOpen} onClose={() => setIsApiDialogOpen(false)} maxWidth="md">
        <DialogContent className="api-dialog-content">
          {isApiLoading ? (
               <div className="loading-container">
               <CircularProgress />
             </div>
          ) : (
            <>
              <div className="api-item">
                <span className="api-label">API Key:</span>
                <div className="api-value-container">
                  <span className="api-value">{apiKey}</span>
                  <button className="copy-button" onClick={() => copyToClipboard(apiKey)}>
                    Copy
                  </button>
                </div>
              </div>
              <div className="api-item">
                <span className="api-label">API Endpoint:</span>
                <div className="api-value-container">
                  <span className="api-value">{apiEndpoint}</span>
                  <button className="copy-button" onClick={() => copyToClipboard(apiEndpoint)}>
                    Copy
                  </button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default NFTCollection;