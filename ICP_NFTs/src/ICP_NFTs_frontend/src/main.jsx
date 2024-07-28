import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.scss';

console.log('Inside main.jsx');

try {
  const root = ReactDOM.createRoot(document.getElementById('root'));
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} catch (error) {
  console.error('Error rendering App:', error);
}