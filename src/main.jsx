import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom'; // Import BrowserRouter
import App from './App.jsx'; // Ensure this points to App.jsx
import VideoScreen from './VideoScreen.jsx'; // Import VideoScreen
import './index.css';

console.log('Starting main.jsx...'); // Debugging log
ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>

        <Router> {/* Wrap App with Router */}
            <Routes>
                <Route path="/" element={<App />} /> {/* Home page */}
                <Route path="/security" element={<VideoScreen />} />
            </Routes>
        </Router>
    </React.StrictMode>
);