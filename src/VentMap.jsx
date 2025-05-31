import React, { useState, useEffect } from 'react'; // Added useState and useEffect
import './index.css';
import { initialGrid, WALL, DOOR, VENT, GOAL, SHOW_DOORS, SHOW_VENTS, SHOW_GOAL } from './map';
import { websocketService } from './websocketService'; // Import the service

const VentMap = () => {
    const [ventPressure, setVentPressure] = useState(50); // Example state, adjust as needed
    const [facilityPower, setFacilityPower] = useState(75);
    const [coolantLevel, setCoolantLevel] = useState(60);
    const [dronePosition, setDronePosition] = useState({ x: -1, y: -1 }); // To show drone on vent map

    useEffect(() => {
        const unsubscribe = websocketService.subscribe(message => {
            console.log('Message from server (VentMap):', message);
            if (message.type === 'status') {
                // Optionally handle WebSocket status changes in VentMap
                console.log('VentMap WebSocket Status:', message.payload);
            }
            // Only update dronePosition if it actually changed
            if ((message.type === 'drone_position' || message.type === 'move') &&
                (message.payload.x !== dronePosition.x || message.payload.y !== dronePosition.y)) {
                setDronePosition(message.payload);
            }
            // You might want to update ventPressure, facilityPower, coolantLevel based on messages too
            // For example, if the server sends updates for these:
            // if (message.type === 'system_status_update') {
            //   setVentPressure(message.payload.ventPressure);
            //   setFacilityPower(message.payload.facilityPower);
            //   setCoolantLevel(message.payload.coolantLevel);
            // }
        });
        websocketService.connect(); // Ensure connection is attempted

        return unsubscribe; // Clean up subscription on unmount
    }, [dronePosition.x, dronePosition.y]);

    return (
        <div className="terminal-container">
            <div className="header-bar">
                <span>HARMONICS TERMINAL #0271</span>
                <span>VENTILATION SYSTEM MONITOR</span>
            </div>
            <div className="main-content">
                <div className="floor-plan-area" style={{ width: '100%' }}> {/* Vent map takes full width */}
                    <div className="schematic-title">FACILITY VENTILATION - SECTOR GAMMA</div>
                    <div className="grid-container" style={{ position: 'relative' }}>
                        {initialGrid.map((row, y) => (
                            <div key={y} className="grid-row">
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
                                                        displayCellType === GOAL ? 'goal-cell' :
                                                            ''
                                                } ${dronePosition.x === x && dronePosition.y === y ? 'player-on-vent-map' : ''} `}
                                        >
                                            {dronePosition.x === x && dronePosition.y === y && (
                                                <div style={{ backgroundColor: 'red', color: "red", width: "100%" }}> P </div>
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
            </div>
        </div>
    );
};

export default VentMap;
