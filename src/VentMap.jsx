import React, { useState, useEffect, useCallback, useRef } from 'react'; // Added useRef
import './index.css';
import { WALL, DOOR, VENT, GOAL, SHOW_DOORS, SHOW_VENTS, SHOW_GOAL } from './map';
import { websocketService } from './websocketService'; // Import the service

// Drone animation constants (from DroneMap.jsx)
const propellerFrames = [
    `
     o     o
      \\\\___/
     | [_] |
      /‾‾‾\\\\\\\\\n     o     o
  `,
    `
     -     -
      \\\\___/
     | [_] |
      /‾‾‾\\\\\\\\\n     -     -
  `,
    `
     \\\\     /\ 
      \\\\___/\ 
     | [_] | 
      /‾‾‾\\\\\\\\\ 
     \\\\     /\ 
  `,
    `
     |     |
      \\\\___/
     | [_] |
      /‾‾‾\\\\\\\\\n     |     |
  `,
];

const hoverOffsets = [-2, -1, 0, 1, 2, 1, 0, -1];
const baseUpPosition = -20;
const baseDownPosition = 20;

const VentMap = () => {
    const [grid, setGrid] = useState([]);
    const [ventPressure, setVentPressure] = useState(50); // Example state, adjust as needed
    const [facilityPower, setFacilityPower] = useState(75);
    const [coolantLevel, setCoolantLevel] = useState(60);
    const [dronePosition, setDronePosition] = useState({ x: -1, y: -1 }); // To show drone on vent map
    const [highlightedKey, setHighlightedKey] = useState(null); // For visual feedback
    const [droneFrame, setDroneFrame] = useState(0); // Animation frame for propellers
    const [hoverFrame, setHoverFrame] = useState(0); // Animation frame for hovering
    
    // New dual-client control states
    const [isSpacePressed, setIsSpacePressed] = useState(false);
    const [clientControl, setClientControl] = useState(null); // "vents", "drone", or null
    const [controlStatus, setControlStatus] = useState("No control active");
    
    // Win state
    const [gameWon, setGameWon] = useState(false);
    const [showModal, setShowModal] = useState(false);

    const gridRef = useRef(grid); // Ref to always have latest grid

    // Update refs when state changes
    useEffect(() => {
        gridRef.current = grid;
    }, [grid]);

    useEffect(() => {
        const fetchMap = async () => {
            try {
                const response = await fetch(__MAP_URL__); // Use the defined URL from Vite config
                const data = await response.json();
                setGrid(data.map1); // Use map1 for VentMap

                // Find the starting position (marked with 'S') and set drone position
                for (let y = 0; y < data.map1.length; y++) {
                    for (let x = 0; x < data.map1[y].length; x++) {
                        if (data.map1[y][x] === 'S') {
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

    // Drone animation effects
    useEffect(() => {
        const propellerInterval = setInterval(() => {
            setDroneFrame(prev => (prev + 1) % propellerFrames.length);
        }, 120);

        const hoverInterval = setInterval(() => {
            setHoverFrame(prev => (prev + 1) % hoverOffsets.length);
        }, 300);

        return () => {
            clearInterval(propellerInterval);
            clearInterval(hoverInterval);
        };
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
                // Update drone position
                setDronePosition(prevPos => {
                    if (prevPos.x !== message.payload.x || prevPos.y !== message.payload.y) {
                        return { x: message.payload.x, y: message.payload.y };
                    }
                    return prevPos;
                });
            }
        }
        // Handle spacebar events from other clients
        else if (message.type === 'spacebar_down') {
            if (message.client === 'drone') {
                setClientControl('vents');
                setControlStatus('Console 1 control active');
            }
        }
        else if (message.type === 'spacebar_up') {
            if (message.client === 'drone') {
                setClientControl(null);
                setControlStatus('No control active');
            }
        }
        // Handle control updates
        else if (message.type === 'control_update') {
            setClientControl(message.clientControl);
            if (message.clientControl === 'vents') {
                setControlStatus('Console 1 control active');
            } else if (message.clientControl === 'drone') {
                setControlStatus('Console 2 control active');
            } else {
                setControlStatus('No control active');
            }
        }
        // Handle win conditions
        else if (message.type === 'capture_sequence_initiated') {
            setGameWon(true);
            setShowModal(true);
            console.log('VentMap: Game won!');
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

    // Handle keyboard events for dual-client control
    const handleKeyDown = useCallback((event) => {
        if (event.key === ' ' && !isSpacePressed) {
            event.preventDefault();
            setIsSpacePressed(true);
            setHighlightedKey('Space');
            
            // Send spacebar down event
            websocketService.sendMessage({
                type: 'spacebar_down',
                client: 'vents'
            });
        }
    }, [isSpacePressed]);

    const handleKeyUp = useCallback((event) => {
        if (event.key === ' ') {
            setIsSpacePressed(false);
            setHighlightedKey(null);
            
            // Send spacebar up event
            websocketService.sendMessage({
                type: 'spacebar_up',
                client: 'vents'
            });
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

    // Handle movement for VentMap
    const handleMovement = useCallback((direction) => {
        if (gameWon || clientControl !== 'vents' || !dronePosition || dronePosition.x === -1 || dronePosition.y === -1) {
            console.log('VentMap: Movement blocked - game won, no control, or invalid position');
            return;
        }

        let newX = dronePosition.x;
        let newY = dronePosition.y;

        if (direction === 'up') newY = Math.max(0, dronePosition.y - 1);
        if (direction === 'down') newY = Math.min(grid.length - 1, dronePosition.y + 1);
        if (direction === 'left') newX = Math.max(0, dronePosition.x - 1);
        if (direction === 'right') newX = Math.min(grid[0] ? grid[0].length - 1 : 0, dronePosition.x + 1);

        // Check if the new position is valid on VentMap's grid
        if (grid[newY] && grid[newY][newX] !== WALL) {
            // Send movement message
            websocketService.sendMessage({
                type: 'move',
                payload: { x: newX, y: newY, direction: direction.toUpperCase() }
            });
        } else {
            console.log(`VentMap: Movement to [${newX}, ${newY}] blocked by wall`);
        }
    }, [gameWon, clientControl, dronePosition, grid]);

    // Handle arrow key movement for VentMap
    const handleArrowKeyDown = useCallback((event) => {
        if (gameWon || clientControl !== 'vents') return;

        switch (event.key) {
            case 'ArrowUp':
                event.preventDefault();
                handleMovement('up');
                break;
            case 'ArrowDown':
                event.preventDefault();
                handleMovement('down');
                break;
            case 'ArrowLeft':
                event.preventDefault();
                handleMovement('left');
                break;
            case 'ArrowRight':
                event.preventDefault();
                handleMovement('right');
                break;
        }
    }, [gameWon, clientControl, handleMovement]);

    // Add arrow key event listener
    useEffect(() => {
        window.addEventListener('keydown', handleArrowKeyDown);
        return () => {
            window.removeEventListener('keydown', handleArrowKeyDown);
        };
    }, [handleArrowKeyDown]);

    // Get drone indicator color based on who's controlling
    const getDroneColor = () => {
        if (clientControl === 'vents') {
            return '#4CAF50'; // Green when VentMap is controlling
        } else if (clientControl === 'drone') {
            return '#f44336'; // Red when DroneMap is controlling
        } else {
            return '#888888'; // Gray when no control
        }
    };

    return (
        <div className="terminal-container" tabIndex={0}>
            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <pre className="modal-ascii-border">
                            {`
+---------------------------------------+
|                                       |
|     INITIATING CAPTURE SEQUENCE     |
|                                       |
+---------------------------------------+
`}
                        </pre>
                    </div>
                </div>
            )}
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
                                    // Show GOAL cells regardless of SHOW_GOAL setting for VentMap
                                    return (
                                        <div
                                            key={x} className={`grid-cell ${displayCellType === WALL ? 'wall' :
                                                displayCellType === DOOR ? 'door' : // Will only be 'door' if SHOW_DOORS is true
                                                    displayCellType === VENT ? 'vent' :
                                                        displayCellType === GOAL ? 'goal-cell' : // Show GOAL cells when SHOW_GOAL is true
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
                        <span>POS: X={dronePosition.x} Y={dronePosition.y} {gameWon ? "[TARGET LOCKED]" : ""}</span>
                        <span>LEGEND: <span className="vent-legend" style={{ backgroundColor: '#4CAF50', color: 'white', padding: '2px 4px', borderRadius: '2px' }}>V</span> VENT | DRONE: <span style={{ backgroundColor: '#4CAF50', color: 'white', padding: '2px 4px', borderRadius: '2px', fontWeight: 'bold' }}>X</span> VENT CONTROL <span style={{ backgroundColor: '#f44336', color: 'white', padding: '2px 4px', borderRadius: '2px', fontWeight: 'bold' }}>X</span> DRONE CONTROL <span style={{ backgroundColor: '#888888', color: 'white', padding: '2px 4px', borderRadius: '2px', fontWeight: 'bold' }}>X</span> NO CONTROL 🎯 INFILTRATOR</span>
                    </div>
                </div>

                {/* Control status panel */}
                <div className="right-column" style={{ width: '20%', paddingLeft: '10px' }}>
                    <div className="info-pane drone-pane">
                        <h3>DRONE STATUS</h3>
                        <pre
                            className="drone-ascii"
                            style={{
                                position: 'relative',
                                transform: `translateY(${baseDownPosition + hoverOffsets[hoverFrame % hoverOffsets.length]}px)`
                            }}
                        >
                            {propellerFrames[droneFrame % propellerFrames.length]}
                        </pre>
                        <p>POSITION: X={dronePosition.x} Y={dronePosition.y}</p>
                    </div>
                    <div className="info-pane drone-vertical-control">
                        <h3>CONTROL STATUS</h3>
                        <div className="vertical-mode-display">
                            <p>STATUS: <span className={`mode-indicator ${clientControl === 'vents' ? 'active' : ''}`}>{controlStatus}</span></p>
                            <div className="mode-visualization">
                                <div className={`altitude-indicator ${clientControl === 'vents' ? 'active' : ''}`}>
                                    Console 1 (VentMap) Control
                                </div>
                                <div className={`altitude-indicator ${clientControl === 'drone' ? 'active' : ''}`}>
                                    Console 2 (DroneMap) Control
                                </div>
                            </div>
                        </div>
                        <div className={`vertical-toggle-button ${highlightedKey === 'Space' ? 'active' : ''}`}>
                            HOLD SPACE TO ENABLE DRONE CONTROL
                        </div>
                        <div className="control-instructions">
                            <p>Hold SPACE to allow drone movement from the other console</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VentMap;
