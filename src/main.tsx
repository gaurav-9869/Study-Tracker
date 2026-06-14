import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Safety net catches startup runtime crashes and prints them as a mobile alert
try {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} catch (error: any) {
  // This will trigger an Android browser popup showing the exact broken component or variable!
  alert("Axion Startup Crash Log: " + error?.message + "\nStack: " + error?.stack);
}
