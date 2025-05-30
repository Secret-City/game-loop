import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router } from 'react-router-dom'; // Import BrowserRouter
import App from './App.jsx'; // Ensure this points to App.jsx
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <Router> {/* Wrap App with Router */}
            <App />
        </Router>
    </React.StrictMode>
);