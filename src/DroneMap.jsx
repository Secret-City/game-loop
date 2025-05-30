import React, { useState, useEffect, useCallback, useRef } from 'react';
import './index.css';
import { initialGrid, START, DOOR, VENT, GOAL, WALL, EMPTY, SHOW_DOORS, SHOW_VENTS, SHOW_GOAL } from './map';
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
    const [grid, setGrid] = useState(initialGrid);
    const [playerPosition, setPlayerPosition] = useState({ x: 1, y: 1 });
    const [consoleLog, setConsoleLog] = useState(['SYSTEM: Welcome to Drone Control.']);
    const [highlightedKey, setHighlightedKey] = useState(null);
    const [serverStatus, setServerStatus] = useState(websocketService.getStatus()); // Get initial status
    const [lastMessage, setLastMessage] = useState('');
    const [verticalMode, setVerticalMode] = useState('down');
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
        setGrid(prevGrid => {
            const newGrid = prevGrid.map(row => [...row]);
            for (let r = 0; r < newGrid.length; r++) {
                for (let c = 0; c < newGrid[r].length; c++) {
                    if (newGrid[r][c] === 'P') {
                        newGrid[r][c] = 0;
                    }
                }
            }
            if (newGrid[playerPosition.y] && newGrid[playerPosition.y][playerPosition.x] !== undefined) {
                if (newGrid[playerPosition.y][playerPosition.x] === EMPTY || newGrid[playerPosition.y][playerPosition.x] === START) {
                    newGrid[playerPosition.y][playerPosition.x] = 'P';
                }
            }
            return newGrid;
        });
    }, [playerPosition]);

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
            } else {
                // Handle other message types if needed, or just log them
                setLastMessage(JSON.stringify(message)); // Assuming message is an object
                console.log('Message from server (DroneMap):', message);
            }
        });
        websocketService.connect(); // Ensure connection is attempted
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
        if (event.repeat || gameWon) {
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
                newPlayerPosition.y = Math.min(initialGrid.length - 1, playerPosition.y + 1);
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
                newPlayerPosition.x = Math.min(initialGrid[0].length - 1, playerPosition.x + 1);
                setHighlightedKey('ArrowRight');
                moved = true;
                direction = 'EAST';
                break;
            case ' ':
                event.preventDefault();
                setVerticalMode(prevMode => {
                    const newMode = prevMode === 'up' ? 'down' : 'up';
                    setConsoleLog(prevLog => [`DRONE: Mode set to ${newMode.toUpperCase()}`, ...prevLog.slice(0, MAX_LOG_ENTRIES - 1)]);
                    return newMode;
                });
                setHighlightedKey('Space');
                break;
            default:
                break;
        }

        if (moved) {
            if (
                newPlayerPosition.y >= 0 && newPlayerPosition.y < initialGrid.length &&
                newPlayerPosition.x >= 0 && newPlayerPosition.x < initialGrid[0].length
            ) {
                let actualTargetCellType = initialGrid[newPlayerPosition.y][newPlayerPosition.x];
                let effectiveTargetCellType = actualTargetCellType;

                if (actualTargetCellType === VENT && !SHOW_VENTS) {
                    effectiveTargetCellType = WALL;
                }
                if (actualTargetCellType === GOAL && !SHOW_GOAL) {
                    effectiveTargetCellType = EMPTY;
                }

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
                } else if (effectiveTargetCellType === VENT) { // This will only be true if SHOW_VENTS is true
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
    }, [playerPosition, verticalMode, /*ws,*/ MAX_LOG_ENTRIES, initialGrid, gameWon]);

    const handleKeyUp = useCallback((event) => {
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ', 'Tab', 'M'].includes(event.key) ||
            ['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'm'].includes(event.key.toLowerCase())) {
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
                                {initialGrid.map((row, y) => (
                                    <div key={y} className="grid-row">
                                        {row.map((cell, x) => {
                                            let displayCellType = cell;
                                            if (cell === VENT && !SHOW_VENTS) {
                                                displayCellType = WALL;
                                            }
                                            if (cell === GOAL && !SHOW_GOAL) {
                                                displayCellType = EMPTY;
                                            }
                                            return (
                                                <div
                                                    key={x}
                                                    className={`grid-cell ${displayCellType === WALL ? 'wall' :
                                                        displayCellType === DOOR ? 'door' :
                                                            displayCellType === VENT ? 'vent' : // Only if SHOW_VENTS is true
                                                                displayCellType === GOAL ? 'goal-cell' : // Only if SHOW_GOAL is true
                                                                    ''
                                                        } ${playerPosition.x === x && playerPosition.y === y ? 'player' : ''
                                                        }`}
                                                >
                                                </div>
                                            );
                                        })}
                                    </div>
                                ))}
                            </div>
                            <div className="footer-info">
                                <span>POS: X={playerPosition.x} Y={playerPosition.y} {gameWon ? "[TARGET LOCKED]" : ""}</span>
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
                            <h3>DRONE VERTICAL CONTROL</h3>
                            <pre
                                className="drone-ascii"
                                style={{ position: 'relative', transform: `translateY(${droneYPosition}px)` }}
                            >
                                {currentDroneAscii}
                            </pre>
                            <p>MODE: {verticalMode.toUpperCase()}</p>
                        </div>
                        <div className="console-log-area">
                            <h3>SYSTEM LOG</h3>
                            <div className="log-entries">
                                {consoleLog.map((entry, index) => (
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
