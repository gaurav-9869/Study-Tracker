import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Absolute fail-safe container detection targeting your browser DOM directly
const container = document.getElementById('root');

if (!container) {
  // If the browser can't bind the root layout element, it will alert you immediately
  alert("Axion System Engine Block: The browser could not discover the HTML target root layout.");
} else {
  try {
    const root = ReactDOM.createRoot(container);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  } catch (err: any) {
    // Catches any internal component variable errors inside your 11 files
    alert("Axion Application Startup Crash:\n" + err?.message + "\n\nStack Trace:\n" + err?.stack);
  }
}
