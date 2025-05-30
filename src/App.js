import React, { useState, useEffect, useRef } from 'react';

const App = () => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const socketRef = useRef(null);

  useEffect(() => {
    // Initialize WebSocket connection
    socketRef.current = new WebSocket('ws://localhost:3000'); // Adjust URL as needed

    socketRef.current.onopen = () => {
      console.log('WebSocket connection established');
    };

    socketRef.current.onmessage = (event) => {
      // Assuming the server might send position updates or other messages
      console.log('Message from server: ', event.data);
      // Example: If server sends back the position
      // const newPosition = JSON.parse(event.data);
      // setPosition(newPosition);
    };

    socketRef.current.onerror = (error) => {
      console.error('WebSocket error: ', error);
    };

    socketRef.current.onclose = () => {
      console.log('WebSocket connection closed');
    };

    // Cleanup function to close the WebSocket connection when the component unmounts
    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, []); // Empty dependency array means this effect runs once on mount and cleanup on unmount

  const move = (dir) => {
    setPosition(prev => {
      const next = { ...prev };
      if (dir === 'up') next.y -= 1;
      if (dir === 'down') next.y += 1;
      if (dir === 'left') next.x -= 1;
      if (dir === 'right') next.x += 1;

      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        socketRef.current.send(JSON.stringify({ type: 'drone_position', payload: next }));
      }
      return next;
    });
  };

  return (
    <div className="terminal">
      <div className="header">
        <span>Harmonics Terminal #0271</span>
        <span>Protocol v3.1.4</span>
      </div>
      <div className="map">
        <div className="pos">Current Position: ({position.x}, {position.y})</div>
        <div className="controls">
          <button onClick={() => move('up')}>↑</button>
          <div>
            <button onClick={() => move('left')}>←</button>
            <button onClick={() => move('down')}>↓</button>
            <button onClick={() => move('right')}>→</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;