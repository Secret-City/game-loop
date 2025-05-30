import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom'; // Import useLocation
import DroneMap from './DroneMap';
import VentMap from './VentMap';
import './index.css';

const App = () => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const mapType = searchParams.get('map');

  if (mapType === 'vent') {
    return <VentMap />;
  }

  // Default to DroneMap if no specific map type is requested or if it's 'drone'
  return <DroneMap />;
};

export default App;
