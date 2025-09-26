import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { Toaster } from './components/ui/sonner';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
    <Toaster 
      position="top-center"
      toastOptions={{
        style: {
          fontFamily: 'Vazirmatn, system-ui, sans-serif',
          direction: 'rtl',
          textAlign: 'right'
        }
      }}
    />
  </React.StrictMode>
);