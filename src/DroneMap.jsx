import React, { useState, useEffect, useCallback, useRef } from 'react';
import './index.css';
import { START, DOOR, VENT, GOAL, WALL, EMPTY, SHOW_DOORS, SHOW_VENTS, SHOW_GOAL } from './map';
import { websocketService } from './websocketService'; // Import the service

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

const DroneMap = () => {
    const [grid, setGrid] = useState([]);
    const [playerPosition, setPlayerPosition] = useState(null);
    const [consoleLog, setConsoleLog] = useState(['SYSTEM: Welcome to Drone Control.']);
    const [highlightedKey, setHighlightedKey] = useState(null);
    const [serverStatus, setServerStatus] = useState(websocketService.getStatus()); // Get initial status
    const [lastMessage, setLastMessage] = useState('');
    const [droneFrame, setDroneFrame] = useState(0);
    const [hoverFrame, setHoverFrame] = useState(0);
    
    // New dual-client control states
    const [isSpacePressed, setIsSpacePressed] = useState(false);
    const [clientControl, setClientControl] = useState(null); // "vents", "drone", or null
    const [controlStatus, setControlStatus] = useState("No control active");

    const [ventPressure, setVentPressure] = useState(50);
    const [facilityPower, setFacilityPower] = useState(75);
    const [coolantLevel, setCoolantLevel] = useState(60);
    const [gameWon, setGameWon] = useState(false);
    const [showModal, setShowModal] = useState(false);

    // const ws = useRef(null); // Remove direct WebSocket ref
    const MAX_LOG_ENTRIES = 50;

    useEffect(() => {
        const fetchMap = async () => {
            try {
                const response = await fetch(__MAP_URL__);
                const data = await response.json();
                const newGrid = data.map2; // Use map2 for DroneMap
                setGrid(newGrid);

                for (let y = 0; y < newGrid.length; y++) {
                    for (let x = 0; x < newGrid[y].length; x++) {
                        if (newGrid[y][x] === 'S') {
                            setPlayerPosition({ x, y });
                            newGrid[y][x] = EMPTY;
                            break;
                        }
                    }
                    if (playerPosition) break;
                }
            } catch (error) {
                console.error("Failed to fetch drone map:", error);
                setConsoleLog(prevLog => [`SYSTEM: Error fetching map. ${error.message}`, ...prevLog]);
            }
        };

        fetchMap();
    }, []);


    // useEffect(() => { // Replace with websocketService
    //     ws.current = new WebSocket('ws://localhost:3000');
    //     setServerStatus('CONNECTING');
    //     ws.current.onopen = () => { setServerStatus('CONNECTED'); console.log('WebSocket connection established'); };
    //     ws.current.onmessage = (event) => { setLastMessage(event.data.toString()); console.log('Message from server: ', event.data); };
    //     ws.current.onerror = (error) => { setServerStatus('ERROR'); console.error('WebSocket error: ', error); };
    //     ws.current.onclose = () => { setServerStatus('DISCONNECTED'); console.log('WebSocket connection closed'); };
    //     return () => { if (ws.current) ws.current.close(); };
    // }, []);

    useEffect(() => {
        const unsubscribe = websocketService.subscribe(message => {
            if (message.type === 'status') {
                setServerStatus(message.payload);
            } else if (message.type === 'drone_position' || message.type === 'move') {
                // Update drone position from any movement message
                if (typeof message.payload?.x === 'number' && typeof message.payload?.y === 'number') {
                    console.log('DroneMap: Received drone position update:', message.payload);
                    setPlayerPosition(prevPos => {
                        if (!prevPos || prevPos.x !== message.payload.x || prevPos.y !== message.payload.y) {
                            return { x: message.payload.x, y: message.payload.y };
                        }
                        return prevPos;
                    });
                }
            } else if (message.type === 'spacebar_down') {
                if (message.client === 'vents') {
                    setClientControl('drone');
                    setControlStatus('Console 2 control active');
                }
            } else if (message.type === 'spacebar_up') {
                if (message.client === 'vents') {
                    setClientControl(null);
                    setControlStatus('No control active');
                }
            } else if (message.type === 'control_update') {
                setClientControl(message.clientControl);
                if (message.clientControl === 'vents') {
                    setControlStatus('Console 1 control active');
                } else if (message.clientControl === 'drone') {
                    setControlStatus('Console 2 control active');
                } else {
                    setControlStatus('No control active');
                }
            } else if (message.type === 'refresh_page') {
                console.log('DroneMap: Received refresh_page event, reloading...');
                window.location.reload();
            } else {
                // Handle other message types if needed, or just log them
                requestAnimationFrame(() => {
                    setLastMessage(JSON.stringify(message));
                });
                console.log('Message from server (DroneMap):', message);
            }
        }, 'ws://towerloop:1880/ws/dronemaze');
        return unsubscribe; // Clean up subscription on unmount
    }, []);

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

    useEffect(() => {
        const fluctuateValue = (currentValue, min, max, maxChange) => {
            let change = (Math.random() * maxChange * 2) - maxChange;
            let newValue = currentValue + change;
            if (newValue < min) newValue = min + Math.abs(change);
            if (newValue > max) newValue = max - Math.abs(change);
            if (newValue < min) newValue = min;
            if (newValue > max) newValue = max;
            return Math.round(newValue);
        };

        const statusInterval = setInterval(() => {
            setFacilityPower(prevPower => fluctuateValue(prevPower, 0, 100, 5));
            setVentPressure(prevPressure => fluctuateValue(prevPressure, 0, 100, 10));
            setCoolantLevel(prevCoolant => fluctuateValue(prevCoolant, 0, 100, 7));
        }, 3000);

        return () => clearInterval(statusInterval);
    }, []);

    const move = useCallback((dir) => {
        if (gameWon) return;
        setPlayerPosition(prev => {
            let { x, y } = { ...prev };
            let newX = x;
            let newY = y;

            if (dir === 'up') newY = Math.max(0, y - 1);
            if (dir === 'down') newY = Math.min(grid.length - 1, y + 1);
            if (dir === 'left') newX = Math.max(0, x - 1);
            if (dir === 'right') newX = Math.min(grid[0] ? grid[0].length - 1 : 0, x + 1);

            if (grid[newY] && grid[newY][newX] === WALL) {
                setConsoleLog(prevLog => [`DRONE: Movement to [${newX}, ${newY}] blocked by WALL.`, ...prevLog.slice(0, MAX_LOG_ENTRIES - 1)]);
                return prev;
            }

            const nextPosition = { x: newX, y: newY };
            // if (ws.current && ws.current.readyState === WebSocket.OPEN) { // Use service to send
            //     ws.current.send(JSON.stringify({ type: 'drone_position', payload: nextPosition }));
            // }
            websocketService.sendMessage({ type: 'drone_position', payload: nextPosition });
            return nextPosition;
        });
    }, [grid, gameWon, MAX_LOG_ENTRIES]);

    const handleKeyDown = useCallback((event) => {
        if (event.repeat || gameWon || !playerPosition) {
            return;
        }

        let newPlayerPosition = { ...playerPosition };
        let moved = false;
        let direction = '';

        switch (event.key.toLowerCase()) {
            case 'arrowup':
                if (clientControl === 'drone') {
                    newPlayerPosition.y = Math.max(0, playerPosition.y - 1);
                    setHighlightedKey('ArrowUp');
                    moved = true;
                    direction = 'NORTH';
                } else {
                    setConsoleLog(prevLog => [`SYSTEM: No control active. Movement blocked.`, ...prevLog.slice(0, MAX_LOG_ENTRIES - 1)]);
                }
                break;
            case 'arrowdown':
                if (clientControl === 'drone') {
                    newPlayerPosition.y = Math.min(grid.length - 1, playerPosition.y + 1);
                    setHighlightedKey('ArrowDown');
                    moved = true;
                    direction = 'SOUTH';
                } else {
                    setConsoleLog(prevLog => [`SYSTEM: No control active. Movement blocked.`, ...prevLog.slice(0, MAX_LOG_ENTRIES - 1)]);
                }
                break;
            case 'arrowleft':
                if (clientControl === 'drone') {
                    newPlayerPosition.x = Math.max(0, playerPosition.x - 1);
                    setHighlightedKey('ArrowLeft');
                    moved = true;
                    direction = 'WEST';
                } else {
                    setConsoleLog(prevLog => [`SYSTEM: No control active. Movement blocked.`, ...prevLog.slice(0, MAX_LOG_ENTRIES - 1)]);
                }
                break;
            case 'arrowright':
                if (clientControl === 'drone') {
                    newPlayerPosition.x = Math.min(grid[0].length - 1, playerPosition.x + 1);
                    setHighlightedKey('ArrowRight');
                    moved = true;
                    direction = 'EAST';
                } else {
                    setConsoleLog(prevLog => [`SYSTEM: No control active. Movement blocked.`, ...prevLog.slice(0, MAX_LOG_ENTRIES - 1)]);
                }
                break;
            case ' ':
                event.preventDefault();
                if (!isSpacePressed) {
                    setIsSpacePressed(true);
                    setHighlightedKey('Space');
                    websocketService.sendMessage({
                        type: 'spacebar_down',
                        client: 'drone'
                    });
                }
                break;
            default:
                break;
        }

        if (moved) {
            if (
                newPlayerPosition.y >= 0 && newPlayerPosition.y < grid.length &&
                newPlayerPosition.x >= 0 && newPlayerPosition.x < grid[0].length
            ) {
                let actualTargetCellType = grid[newPlayerPosition.y][newPlayerPosition.x];
                let effectiveTargetCellType = actualTargetCellType;

                let canMove = false;
                let moveMessage = `DRONE: Moved ${direction} to [${newPlayerPosition.x}, ${newPlayerPosition.y}].`;

                if (effectiveTargetCellType === WALL) {
                    canMove = false;
                    moveMessage = `DRONE: Movement to [${newPlayerPosition.x}, ${newPlayerPosition.y}] blocked by WALL.`;
                } else if ([EMPTY, START, GOAL, DOOR, VENT].includes(effectiveTargetCellType)) {
                    canMove = true;
                    if (effectiveTargetCellType === GOAL) {
                        moveMessage = `DRONE: Reached GOAL at [${newPlayerPosition.x}, ${newPlayerPosition.y}].`;
                    } else if (effectiveTargetCellType === DOOR) {
                        moveMessage = `DRONE: Passed through DOOR at [${newPlayerPosition.x}, ${newPlayerPosition.y}].`;
                    } else if (effectiveTargetCellType === VENT) {
                        moveMessage = `DRONE: Passed through VENT at [${newPlayerPosition.x}, ${newPlayerPosition.y}].`;
                    }
                } else {
                    canMove = false;
                    moveMessage = `DRONE: Movement to [${newPlayerPosition.x}, ${newPlayerPosition.y}] blocked by unhandled cell type '${effectiveTargetCellType}'.`;
                }

                if (canMove) {
                    setPlayerPosition(newPlayerPosition);
                    setConsoleLog(prevLog => [moveMessage, ...prevLog.slice(0, MAX_LOG_ENTRIES - 1)]);
                    websocketService.sendMessage({ type: 'move', payload: { x: newPlayerPosition.x, y: newPlayerPosition.y, direction } });

                    if (effectiveTargetCellType === GOAL) { // This check ensures SHOW_GOAL was true
                        setGameWon(true);
                        setShowModal(true);
                        setConsoleLog(prevLog => [`SYSTEM: TARGET ACQUIRED. INITIATING CAPTURE SEQUENCE.`, ...prevLog.slice(0, MAX_LOG_ENTRIES - 1)]);
                        websocketService.sendMessage({ type: 'capture_sequence_initiated', payload: { status: 'INITIATED' } });
                    }
                } else {
                    setConsoleLog(prevLog => [moveMessage, ...prevLog.slice(0, MAX_LOG_ENTRIES - 1)]);
                }
            } else {
                setConsoleLog(prevLog => [`DRONE: Movement to [${newPlayerPosition.x}, ${newPlayerPosition.y}] blocked by boundary.`, ...prevLog.slice(0, MAX_LOG_ENTRIES - 1)]);
            }
        }
    }, [playerPosition, clientControl, MAX_LOG_ENTRIES, grid, gameWon, isSpacePressed]);

    const handleKeyUp = useCallback((event) => {
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
            setHighlightedKey(null);
        } else if (event.key === ' ') {
            setIsSpacePressed(false);
            setHighlightedKey(null);
            websocketService.sendMessage({
                type: 'spacebar_up',
                client: 'drone'
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

    const currentDroneAscii = propellerFrames[droneFrame % propellerFrames.length];
    const currentHoverOffset = hoverOffsets[hoverFrame % hoverOffsets.length];
    const droneYPosition = baseDownPosition + currentHoverOffset;

    return (
        <div className="App" tabIndex={0}>
            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <pre className="modal-ascii-border">
                            {`
+---------------------------------------+
|                                       |
|     INITIATING CAPTURE SEQUENCE     |
|                                       |\n+---------------------------------------+\n`}
                        </pre>
                    </div>
                </div>
            )}
            <div className="terminal-container">
                <div className="header-bar">
                    <span>HARMONICS TERMINAL #0271</span>
                    <span>PROTOCOL v3.1.4</span>
                </div>

                <div className="main-content">
                    <div className="left-column">
                        <div className="floor-plan-area">
                            <div className="schematic-title">FACILITY SCHEMATIC - SECTOR GAMMA</div>
                            <div className="grid-container">
                                {grid.length > 0 ? (<>
                                    <div className="grid-row">
                                        <div className="grid-label-row" />
                                        {grid[0].map((_, x) => (
                                            <div key={x} className="grid-label-col">
                                                {String.fromCharCode(65 + x)}
                                            </div>
                                        ))}
                                    </div>
                                    {grid.map((row, y) => (
                                        <div key={y} className="grid-row">
                                            <div className="grid-label-row">{y + 1}</div>
                                            {row.map((cell, x) => {
                                                let displayCellType = cell;
                                                const isPlayerHere = playerPosition && playerPosition.x === x && playerPosition.y === y;
                                                return (
                                                    <div
                                                        key={x}
                                                        className={`grid-cell ${displayCellType === WALL ? 'wall' :
                                                            displayCellType === DOOR ? 'door' :
                                                                displayCellType === VENT ? 'wall' : // Only if SHOW_VENTS is true
                                                                    displayCellType === GOAL ? 'goal-cell' : // Only if SHOW_GOAL is true
                                                                        ''
                                                            }`}
                                                        style={isPlayerHere ? { backgroundColor: getDroneColor() } : {}}
                                                    >
                                                        {isPlayerHere && (
                                                            <div style={{
                                                                color: 'white',
                                                                fontWeight: 'bold',
                                                                fontSize: '12px',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                width: '100%',
                                                                height: '100%'
                                                            }}>
                                                                X
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ))}
                                </>) : <div>Loading map...</div>}
                            </div>
                            <div className="footer-info">
                                <span>POS: X={playerPosition?.x} Y={playerPosition?.y} {gameWon ? "[TARGET LOCKED]" : ""}</span>
                                <span>LEGEND: DRONE: <span style={{ backgroundColor: '#4CAF50', color: 'white', padding: '2px 4px', borderRadius: '2px', fontWeight: 'bold' }}>X</span> VENT CONTROL <span style={{ backgroundColor: '#f44336', color: 'white', padding: '2px 4px', borderRadius: '2px', fontWeight: 'bold' }}>X</span> DRONE CONTROL <span style={{ backgroundColor: '#888888', color: 'white', padding: '2px 4px', borderRadius: '2px', fontWeight: 'bold' }}>X</span> NO CONTROL 🎯 INFILTRATOR</span>
                            </div>
                        </div>
                        <div className="aesthetic-info-area">
                            <div className="info-pane vent-pressure">
                                <div className="pane-title">VENT PRESSURE: {ventPressure}%</div>
                                <div className="bar-graph-container">
                                    <div
                                        className="bar single-bar"
                                        style={{ height: `${ventPressure}%` }}
                                    ></div>
                                </div>
                            </div>
                            <div className="horizontal-panes-group">
                                <div className="info-pane facility-power">
                                    <div className="pane-title">FACILITY POWER</div>
                                    <div className="power-display">
                                        <span className="power-percentage">{facilityPower}%</span>
                                        <div className="power-bar-container">
                                            <div
                                                className="power-bar"
                                                style={{ width: `${facilityPower}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                </div>
                                <div className="info-pane coolant-level">
                                    <div className="pane-title">COOLANT LEVELS: {coolantLevel}%</div>
                                    <div className="bar-graph-container">
                                        <div
                                            className="bar single-bar coolant-bar"
                                            style={{ height: `${coolantLevel}%` }}
                                        ></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="right-column">
                        <div className="info-pane drone-pane">
                            <h3>DRONE STATUS</h3>
                            <pre
                                className="drone-ascii"
                                style={{ position: 'relative', transform: `translateY(${droneYPosition}px)` }}
                            >
                                {currentDroneAscii}
                            </pre>
                            <p>CONTROL: <span className={`mode-indicator ${clientControl === 'drone' ? 'active' : ''}`}>{controlStatus}</span></p>
                            <p className="control-note">Hold SPACE to enable VentMap control</p>
                        </div>
                        <div className="info-pane drone-vertical-control">
                            <h3>CONTROL STATUS</h3>
                            <div className="vertical-mode-display">
                                <p>STATUS: <span className={`mode-indicator ${clientControl === 'drone' ? 'active' : ''}`}>{controlStatus}</span></p>
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
                                HOLD SPACE TO ENABLE VENT CONTROL
                            </div>
                            <div className="control-instructions">
                                <p>Hold SPACE to allow drone movement from VentMap</p>
                            </div>
                        </div>
                        <div className="console-log-area">
                            <h3>SYSTEM LOG</h3>
                            <div className="log-entries">
                                {consoleLog.slice(0, 10).map((entry, index) => (
                                    <div key={index} className="log-entry">
                                        {entry}
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="controls-area">
                            <div className="control-pad">
                                <button onClick={() => move('up')} className={`control-button up ${highlightedKey === 'ArrowUp' ? 'active' : ''}`} disabled={gameWon || clientControl !== 'drone'}>↑</button>
                                <div className="middle-controls">
                                    <button onClick={() => move('left')} className={`control-button left ${highlightedKey === 'ArrowLeft' ? 'active' : ''}`} disabled={gameWon || clientControl !== 'drone'}>←</button>
                                    <button onClick={() => move('right')} className={`control-button right ${highlightedKey === 'ArrowRight' ? 'active' : ''}`} disabled={gameWon || clientControl !== 'drone'}>→</button>
                                </div>
                                <button onClick={() => move('down')} className={`control-button down ${highlightedKey === 'ArrowDown' ? 'active' : ''}`} disabled={gameWon || clientControl !== 'drone'}>↓</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DroneMap;
