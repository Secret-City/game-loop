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
    const [verticalMode, setVerticalMode] = useState('down'); // Now read-only, controlled by VentMap
    const [droneFrame, setDroneFrame] = useState(0);
    const [hoverFrame, setHoverFrame] = useState(0);

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
                const newGrid = data.initialGrid;
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
            } else if (message.type === 'vertical_mode_change') {
                // Listen for vertical mode changes from VentMap
                setVerticalMode(message.payload.verticalMode);
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
                newPlayerPosition.y = Math.max(0, playerPosition.y - 1);
                setHighlightedKey('ArrowUp');
                moved = true;
                direction = 'NORTH';
                break;
            case 'arrowdown':
                newPlayerPosition.y = Math.min(grid.length - 1, playerPosition.y + 1);
                setHighlightedKey('ArrowDown');
                moved = true;
                direction = 'SOUTH';
                break;
            case 'arrowleft':
                newPlayerPosition.x = Math.max(0, playerPosition.x - 1);
                setHighlightedKey('ArrowLeft');
                moved = true;
                direction = 'WEST';
                break;
            case 'arrowright':
                newPlayerPosition.x = Math.min(grid[0].length - 1, playerPosition.x + 1);
                setHighlightedKey('ArrowRight');
                moved = true;
                direction = 'EAST';
                break;
            case ' ':
                event.preventDefault();
                // Space bar functionality moved to VentMap - no longer handled here
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
                } else if (effectiveTargetCellType === DOOR) {
                    if (verticalMode === 'down') {
                        canMove = true;
                        moveMessage = `DRONE: Passed through DOOR at [${newPlayerPosition.x}, ${newPlayerPosition.y}] (Mode: DOWN).`;
                    } else {
                        canMove = false;
                        moveMessage = `DRONE: Cannot pass DOOR at [${newPlayerPosition.x}, ${newPlayerPosition.y}]. Mode: ${verticalMode.toUpperCase()}. Requires DOWN.`;
                    }
                } else if (effectiveTargetCellType === VENT) {
                    if (verticalMode === 'up') {
                        canMove = true;
                        moveMessage = `DRONE: Passed through VENT at [${newPlayerPosition.x}, ${newPlayerPosition.y}] (Mode: UP).`;
                    } else {
                        canMove = false;
                        moveMessage = `DRONE: Cannot pass VENT at [${newPlayerPosition.x}, ${newPlayerPosition.y}]. Mode: ${verticalMode.toUpperCase()}. Requires UP.`;
                    }
                } else if ([EMPTY, START, GOAL].includes(effectiveTargetCellType)) { // GOAL here means SHOW_GOAL is true
                    canMove = true;
                    if (effectiveTargetCellType === GOAL) {
                        moveMessage = `DRONE: Reached GOAL at [${newPlayerPosition.x}, ${newPlayerPosition.y}].`;
                    }
                } else { // Should not happen if logic is correct
                    canMove = false;
                    moveMessage = `DRONE: Movement to [${newPlayerPosition.x}, ${newPlayerPosition.y}] blocked by unhandled cell type '${effectiveTargetCellType}'.`;
                }

                if (canMove) {
                    setPlayerPosition(newPlayerPosition);
                    setConsoleLog(prevLog => [moveMessage, ...prevLog.slice(0, MAX_LOG_ENTRIES - 1)]);
                    websocketService.sendMessage({ type: 'move', payload: { x: newPlayerPosition.x, y: newPlayerPosition.y, direction, verticalMode } });

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
    }, [playerPosition, verticalMode, MAX_LOG_ENTRIES, grid, gameWon]);

    const handleKeyUp = useCallback((event) => {
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
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

    const currentDroneAscii = propellerFrames[droneFrame % propellerFrames.length];
    const currentHoverOffset = hoverOffsets[hoverFrame % hoverOffsets.length];
    const droneYPosition = (verticalMode === 'up' ? baseUpPosition : baseDownPosition) + currentHoverOffset;

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
                                <span>LEGEND: ▉ WALL □ PLAYER 🚪 DOOR <span className="vent-legend">V</span> VENT 🎯 GOAL</span>
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
                            <h3>DRONE VERTICAL STATUS</h3>
                            <pre
                                className="drone-ascii"
                                style={{ position: 'relative', transform: `translateY(${droneYPosition}px)` }}
                            >
                                {currentDroneAscii}
                            </pre>
                            <p>MODE: <span className={`mode-indicator ${verticalMode}`}>{verticalMode.toUpperCase()}</span></p>
                            <p className="control-note">Control via Ventilation Monitor</p>
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
                                <button onClick={() => move('up')} className={`control-button up ${highlightedKey === 'ArrowUp' ? 'active' : ''}`} disabled={gameWon}>↑</button>
                                <div className="middle-controls">
                                    <button onClick={() => move('left')} className={`control-button left ${highlightedKey === 'ArrowLeft' ? 'active' : ''}`} disabled={gameWon}>←</button>
                                    <button onClick={() => move('right')} className={`control-button right ${highlightedKey === 'ArrowRight' ? 'active' : ''}`} disabled={gameWon}>→</button>
                                </div>
                                <button onClick={() => move('down')} className={`control-button down ${highlightedKey === 'ArrowDown' ? 'active' : ''}`} disabled={gameWon}>↓</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DroneMap;
