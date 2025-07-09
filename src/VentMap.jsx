import React, { useState, useEffect, useCallback, useRef } from 'react'; // Added useRef
import './index.css';
import { WALL, DOOR, VENT, GOAL, SHOW_DOORS, SHOW_VENTS, SHOW_GOAL } from './map';
import { websocketService } from './websocketService'; // Import the service

const VentMap = () => {
    const [grid, setGrid] = useState([]);
    const [ventPressure, setVentPressure] = useState(50); // Example state, adjust as needed
    const [facilityPower, setFacilityPower] = useState(75);
    const [coolantLevel, setCoolantLevel] = useState(60);
    const [dronePosition, setDronePosition] = useState({ x: -1, y: -1 }); // To show drone on vent map
    const [verticalMode, setVerticalMode] = useState('down'); // Added vertical mode state
    const [highlightedKey, setHighlightedKey] = useState(null); // For visual feedback

    const gridRef = useRef(grid); // Ref to always have latest grid
    const verticalModeRef = useRef(verticalMode); // Ref to always have latest vertical mode

    // Update refs when state changes
    useEffect(() => {
        gridRef.current = grid;
    }, [grid]);

    useEffect(() => {
        verticalModeRef.current = verticalMode;
    }, [verticalMode]);

    useEffect(() => {
        const fetchMap = async () => {
            try {
                const response = await fetch(__MAP_URL__); // Use the defined URL from Vite config
                const data = await response.json();
                setGrid(data.initialGrid);

                // Find the starting position (marked with 'S') and set drone position
                for (let y = 0; y < data.initialGrid.length; y++) {
                    for (let x = 0; x < data.initialGrid[y].length; x++) {
                        if (data.initialGrid[y][x] === 'S') {
                            setDronePosition({ x, y });
                            return; // Exit early once found
                        }
                    }
                }
            } catch (error) {
                console.error("Failed to fetch vent map:", error);
            }
        };

        fetchMap();
    }, []);

    // Message handler function that uses refs to get latest values
    const handleWebSocketMessage = useCallback((message) => {
        console.log('VentMap: Received WebSocket message:', message);

        if (message.type === 'status') {
            console.log('VentMap WebSocket Status:', message.payload);
        }
        // Update dronePosition from any movement message
        else if (message.type === 'drone_position' || message.type === 'move') {
            if (typeof message.payload?.x === 'number' && typeof message.payload?.y === 'number') {
                // Check if moving to a non-vent while in UP mode - use ref for latest grid
                const currentGrid = gridRef.current;
                const currentVerticalMode = verticalModeRef.current;

                if (currentGrid.length > 0 && message.payload.y < currentGrid.length && message.payload.x < currentGrid[0].length) {
                    const newCell = currentGrid[message.payload.y] && currentGrid[message.payload.y][message.payload.x];
                    console.log('VentMap: Received drone position update:', message.payload, newCell, currentVerticalMode);
                    if (newCell !== VENT) {
                        console.log('VentMap: Moved to non-vent, switching to DOWN');
                        websocketService.sendMessage({
                            type: 'vertical_mode_change',
                            payload: { verticalMode: 'down' }
                        });
                    }
                }

                // Update drone position
                setDronePosition(prevPos => {
                    if (prevPos.x !== message.payload.x || prevPos.y !== message.payload.y) {
                        return { x: message.payload.x, y: message.payload.y };
                    }
                    return prevPos;
                });
            }
        }
        // Listen for vertical mode changes from DroneMap
        else if (message.type === 'vertical_mode_change') {
            setVerticalMode(message.payload.verticalMode);
        }
        // Listen for page refresh events
        else if (message.type === 'refresh_page') {
            console.log('VentMap: Received refresh_page event, reloading...');
            window.location.reload();
        }
        else {
            console.log('VentMap: Unhandled message type:', message.type, message);
        }
    }, []);

    // WebSocket subscription - only run once on mount
    useEffect(() => {
        const unsubscribe = websocketService.subscribe(handleWebSocketMessage, 'ws://towerloop:1880/ws/dronemaze');
        return unsubscribe; // Clean up subscription on unmount
    }, [handleWebSocketMessage]);

    // Handle vertical mode toggle
    const toggleVerticalMode = useCallback(() => {
        const newMode = verticalMode === 'up' ? 'down' : 'up';
        setVerticalMode(newMode);
        websocketService.sendMessage({
            type: 'vertical_mode_change',
            payload: { verticalMode: newMode }
        });
    }, [verticalMode]);

    // Handle keyboard events
    const handleKeyDown = useCallback((event) => {
        if (event.key === ' ') {
            event.preventDefault();
            toggleVerticalMode();
            setHighlightedKey('Space');
        }
    }, [toggleVerticalMode]);

    const handleKeyUp = useCallback((event) => {
        if (event.key === ' ') {
            setHighlightedKey(null);
        }
    }, []);

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, [handleKeyDown, handleKeyUp]);

    // Get drone indicator color based on vertical mode
    const getDroneColor = () => {
        return verticalMode === 'up' ? '#4CAF50' : '#f44336'; // Green for up, red for down
    };

    return (
        <div className="terminal-container" tabIndex={0}>
            <div className="header-bar">
                <span>HARMONICS TERMINAL #0271</span>
                <span>VENTILATION SYSTEM MONITOR</span>
            </div>
            <div className="main-content">
                <div className="floor-plan-area" style={{ width: '80%' }}> {/* Reduced width to make room for controls */}
                    <div className="schematic-title">FACILITY VENTILATION - SECTOR GAMMA</div>
                    <div className="grid-container" style={{ position: 'relative' }}>
                        {grid.length > 0 && <div className="grid-row">
                            <div className="grid-label-row" />
                            {grid[0].map((_, x) => (
                                <div key={x} className="grid-label-col">
                                    {String.fromCharCode(65 + x)}
                                </div>
                            ))}
                        </div>}
                        {grid.map((row, y) => (
                            <div key={y} className="grid-row">
                                <div className="grid-label-row">{y + 1}</div>
                                {row.map((cell, x) => {
                                    let displayCellType = cell;
                                    if (cell === DOOR && !SHOW_DOORS) {
                                        displayCellType = WALL;
                                    }
                                    return (
                                        <div
                                            key={x}
                                            className={`grid-cell ${displayCellType === WALL ? 'wall' :
                                                displayCellType === DOOR ? 'door' : // Will only be 'door' if SHOW_DOORS is true
                                                    displayCellType === VENT ? 'vent' :
                                                        ''
                                                } ${dronePosition.x === x && dronePosition.y === y ? 'player-on-vent-map' : ''} `}
                                        >
                                            {dronePosition.x === x && dronePosition.y === y && (
                                                <div style={{
                                                    backgroundColor: getDroneColor(),
                                                    color: "#FFF",
                                                    width: "100%",
                                                    height: "100%",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    fontWeight: "bold",
                                                    fontSize: "12px"
                                                }}>
                                                    X
                                                </div>
                                            )}
                                            {/* Optional: Display cell type characters if needed for VentMap */}
                                            {/* {cell === GOAL ? 'G' : cell === DOOR ? 'D' : cell === VENT ? 'V' : ''} */}
                                        </div>
                                    );
                                })}
                            </div>
                        ))}
                    </div>
                    <div className="footer-info">
                        <span>LEGEND: ▉ WALL 🚪 DOOR <span className="vent-legend">V</span> VENT 🎯 GOAL</span>
                    </div>
                </div>

                {/* Added drone control panel */}
                <div className="right-column" style={{ width: '20%', paddingLeft: '10px' }}>
                    <div className="info-pane drone-vertical-control">
                        <h3>DRONE VERTICAL CONTROL</h3>
                        <div className="vertical-mode-display">
                            <p>MODE: <span className={`mode-indicator ${verticalMode}`}>{verticalMode.toUpperCase()}</span></p>
                            <div className="mode-visualization">
                                <div className={`altitude-indicator ${verticalMode === 'up' ? 'active' : ''}`}>
                                    ↑ UP
                                </div>
                                <div className={`altitude-indicator ${verticalMode === 'down' ? 'active' : ''}`}>
                                    ↓ DOWN
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={toggleVerticalMode}
                            className={`vertical-toggle-button ${highlightedKey === 'Space' ? 'active' : ''}`}
                        >
                            TOGGLE MODE (SPACE)
                        </button>
                        <div className="control-instructions">
                            <p>Press SPACE or click button to toggle drone altitude</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VentMap;
