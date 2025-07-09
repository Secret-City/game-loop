import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter as Router, Route, Routes } from 'react-router-dom'; // Import HashRouter
// import App from './App.jsx'; // Ensure this points to App.jsx
import VentMap from './VentMap';
import DroneMap from './DroneMap';
import VideoScreen from './VideoScreen.jsx'; // Import VideoScreen
import Microfilm from './Microfilm'; // Import Microfilm
import './index.css';

console.log('Starting main.jsx...'); // Debugging log
ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>

        <Router> {/* Wrap App with Router */}
            <Routes>
                <Route path="/dronemap" element={<DroneMap />} /> {/* Home page */}
                <Route path="/ventmap" element={<VentMap />} /> {/* Vent map page */}
                <Route path="/security" element={<VideoScreen />} />
                <Route path="/microfilm" element={<Microfilm />} />
            </Routes>
        </Router>
    </React.StrictMode>
);