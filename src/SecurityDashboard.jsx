import React, { useState, useEffect } from 'react';

const BACKUP_TIME = 10 * 60 * 1000; // 10 minutes in milliseconds

const SecurityDashboard = ({ dashboardData }) => {
    const [currentTime, setCurrentTime] = useState(Date.now());
    const [backupEndTime, setBackupEndTime] = useState(null);
    const [gameStartTime, setGameStartTime] = useState(null);

    // Inject CSS animations
    useEffect(() => {
        const style = document.createElement('style');
        style.textContent = `
            @keyframes scanlines {
                0% { background-position: 0 0; }
                100% { background-position: 0 4px; }
            }
            @keyframes crystalPulse {
                0%, 100% { filter: drop-shadow(0 0 15px #00ffaa) drop-shadow(0 0 30px #00ffaa); }
                50% { filter: drop-shadow(0 0 25px #00ffaa) drop-shadow(0 0 50px #00ffaa); }
            }
            @keyframes blinkRed {
                0% { color: rgba(255, 68, 68, 0); }
                50% { color: rgba(255, 68, 68, 1); }
                100% { color: rgba(255, 68, 68, 0); }
            }
            .scanline-effect {
                background-image: 
                    linear-gradient(90deg, transparent 50%, rgba(0, 255, 170, 0.03) 50%),
                    linear-gradient(rgba(0, 255, 170, 0.05) 50%, transparent 50%);
                background-size: 4px 4px;
                animation: scanlines 0.1s infinite linear;
            }
            .crystal-pulse {
                animation: crystalPulse 3s ease-in-out infinite;
            }
            .blink-red {
                animation: blinkRed 1s infinite;
            }
        `;
        document.head.appendChild(style);
        return () => document.head.removeChild(style);
    }, []);

    const {
        now_playing = "Bright new day",
        security_doors = "LOCKED",
        security_firewall = "SECURED",
        vents_external = "CLOSED",
        vents_internal = "OPEN",
        vents_flow = "INWARD",
        last_backup = null, // Will default to 10 minutes from now if null
        game_start = null, // Will be set when received from server
        crystal_integrty = "Calibrated",
        crystal_power = "Stable"
    } = dashboardData || {};

    // Set game start time when component mounts or game_start changes
    useEffect(() => {
        if (game_start) {
            setGameStartTime(game_start);
        }
        // Don't set default if game_start is not present
    }, [game_start]);

    // Set backup end time when component mounts or last_backup changes
    useEffect(() => {
        if (last_backup) {
            // Add BACKUP_TIME to last_backup to get the end time (last_backup is the start time)
            const endTime = last_backup + BACKUP_TIME;
            console.log('Setting backupEndTime from last_backup:', last_backup, 'Date:', new Date(last_backup));
            console.log('Adding BACKUP_TIME, endTime:', endTime, 'Date:', new Date(endTime));
            setBackupEndTime(endTime);
        }
        // Don't set default if last_backup is not present
    }, [last_backup]);

    // Update current time every second for countdown
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTime(Date.now());
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    // Format timestamp to countdown timer (for backup)
    const formatCountdown = () => {
        if (!backupEndTime) return "10:00";

        const diff = backupEndTime - currentTime;
        
        console.log('Countdown calculation:', {
            backupEndTime,
            currentTime,
            diff,
            backupEndTimeDate: new Date(backupEndTime),
            currentTimeDate: new Date(currentTime),
            diffMinutes: Math.floor(diff / 60000),
            diffSeconds: Math.floor((diff % 60000) / 1000)
        });
        
        // If time has exceeded the backup window, show 00:00
        if (diff <= 0) return "00:00";
        
        const minutes = Math.floor(diff / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    // Check if backup is needed (time exceeded)
    const isBackupNeeded = () => {
        if (!backupEndTime) return false;
        return currentTime >= backupEndTime;
    };

    // Format elapsed time since game start (counting up)
    const formatElapsed = () => {
        if (!gameStartTime) return "00:00";
        const diff = Math.max(0, currentTime - gameStartTime);
        const minutes = Math.floor(diff / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    const styles = {
        container: {
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: '#000810',
            color: '#00ffaa',
            fontFamily: 'monospace',
            fontSize: '10px',
            display: 'flex',
            flexDirection: 'column',
            border: '2px solid #00ffaa',
            borderRadius: '4px',
            overflow: 'hidden',
            textShadow: '0 0 8px currentColor',
            boxShadow: 'inset 0 0 20px rgba(0, 255, 170, 0.2)',
        },
        header: {
            backgroundColor: 'rgba(0, 20, 40, 0.8)',
            padding: '4px 8px',
            borderBottom: '1px solid #00ffaa',
            textAlign: 'center',
            fontWeight: 'bold',
            fontSize: '11px',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            filter: 'brightness(1.2)',
        },
        content: {
            flex: 1,
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
        },
        crystalCenter: {
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2,
        },
        crystal: {
            width: '100px',
            height: '120px',
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '8px',
        },
        crystalSvg: {
            width: '100%',
            height: '100%',
            filter: crystal_power === 'stable'
                ? 'drop-shadow(0 0 15px #00ffaa) drop-shadow(0 0 30px #00ffaa)'
                : 'drop-shadow(0 0 8px #ff4444)',
        },
        '@keyframes crystalPulse': {
            '0%, 100%': { filter: 'drop-shadow(0 0 15px #00ffaa) drop-shadow(0 0 30px #00ffaa)' },
            '50%': { filter: 'drop-shadow(0 0 25px #00ffaa) drop-shadow(0 0 50px #00ffaa)' }
        },
        countdown: {
            textAlign: 'center',
            fontSize: '18px',
            fontWeight: 'bold',
            marginBottom: '4px',
            textShadow: '0 0 10px currentColor',
            color: '#00ffaa',
        },
        gameTimer: {
            textAlign: 'center',
            fontSize: '10px',
            opacity: 0.7,
            color: '#88ffcc',
        },
        corner: {
            position: 'absolute',
            padding: '8px',
            fontSize: '9px',
            lineHeight: '1.2',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            border: '1px solid rgba(0, 255, 170, 0.3)',
            borderRadius: '3px',
            backdropFilter: 'blur(2px)',
        },
        topLeft: {
            top: '8px',
            left: '8px',
            maxWidth: '120px',
        },
        topRight: {
            top: '8px',
            right: '8px',
            maxWidth: '120px',
        },
        bottomLeft: {
            bottom: '8px',
            left: '8px',
            maxWidth: '120px',
        },
        bottomRight: {
            bottom: '8px',
            right: '8px',
            maxWidth: '120px',
        },
        statusItem: {
            marginBottom: '6px',
        },
        statusLabel: {
            color: '#66bbaa',
            fontSize: '8px',
            marginBottom: '2px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
        },
        statusValue: {
            fontWeight: 'bold',
            fontSize: '9px',
            textShadow: '0 0 6px currentColor',
        },
    };

    // Get status color based on value
    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'secured':
            case 'active':
            case 'closed':
            case 'calibrated':
            case 'stable':
            case 'inward':
                return '#00ff88';
            case 'open':
            case 'outward':
                return '#ffff44';
            case 'breached':
            case 'inactive':
            case 'unstable':
            case 'critical':
                return '#ff4444';
            default:
                return '#888888';
        }
    };

    return (
        <div style={styles.container} className="scanline-effect">
            <div style={styles.header}>
                NOW PLAYING: {now_playing.toUpperCase()}
            </div>

            <div style={styles.content}>
                {/* Top Left Corner - Security Status */}
                <div style={{ ...styles.corner, ...styles.topLeft }}>
                    <div style={styles.statusItem}>
                        <div style={styles.statusLabel}>Security Status</div>
                        <div style={{ ...styles.statusValue, color: getStatusColor(security_doors) }}>
                            DOORS {security_doors.toUpperCase()}
                        </div>
                    </div>
                    <div style={styles.statusItem}>
                        <div style={styles.statusLabel}>Firewall</div>
                        <div style={{ ...styles.statusValue, color: getStatusColor(security_firewall) }}>
                            {security_firewall.toUpperCase()}
                        </div>
                    </div>
                </div>

                {/* Top Right Corner - Vent Status */}
                <div style={{ ...styles.corner, ...styles.topRight }}>
                    <div style={styles.statusItem}>
                        <div style={styles.statusLabel}>Internal Vents</div>
                        <div style={{ ...styles.statusValue, color: getStatusColor(vents_internal) }}>
                            {vents_internal.toUpperCase()}
                        </div>
                    </div>
                    <div style={styles.statusItem}>
                        <div style={styles.statusLabel}>External Vents</div>
                        <div style={{ ...styles.statusValue, color: getStatusColor(vents_external) }}>
                            {vents_external.toUpperCase()}
                        </div>
                    </div>
                    <div style={styles.statusItem}>
                        <div style={styles.statusLabel}>Airflow</div>
                        <div style={{ ...styles.statusValue, color: getStatusColor(vents_flow) }}>
                            {vents_flow.toUpperCase()}
                        </div>
                    </div>
                </div>

                {/* Bottom Left Corner - Crystal Status */}
                <div style={{ ...styles.corner, ...styles.bottomLeft }}>
                    <div style={styles.statusItem}>
                        <div style={styles.statusLabel}>Crystal Integrity</div>
                        <div style={{ ...styles.statusValue, color: getStatusColor(crystal_integrty) }}>
                            {crystal_integrty.toUpperCase()}
                        </div>
                    </div>
                    <div style={styles.statusItem}>
                        <div style={styles.statusLabel}>Crystal Power</div>
                        <div style={{ ...styles.statusValue, color: getStatusColor(crystal_power) }}>
                            {crystal_power.toUpperCase()}
                        </div>
                    </div>
                </div>

                {/* Bottom Right Corner - Backup Status */}
                <div style={{ ...styles.corner, ...styles.bottomRight }}>
                    <div style={styles.statusItem}>
                        <div style={styles.statusLabel}>
                            {isBackupNeeded() ? "Back up needed" : "Next Backup In"}
                        </div>
                        <div style={{
                            ...styles.countdown
                        }} className={isBackupNeeded() ? "blink-red" : ""}>
                            {formatCountdown()}
                        </div>
                    </div>
                </div>

                {/* Central Crystal */}
                <div style={styles.crystalCenter}>
                    <div style={styles.crystal}>
                        <svg
                            style={styles.crystalSvg}
                            className={crystal_power === 'stable' ? 'crystal-pulse' : ''}
                            viewBox="0 0 100 120"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            {/* Outer crystal structure */}
                            <path
                                d="M50 5 L75 25 L75 85 L50 115 L25 85 L25 25 Z"
                                fill="none"
                                stroke="#00ffaa"
                                strokeWidth="2"
                                opacity="0.9"
                            />
                            {/* Inner crystal facets */}
                            <path
                                d="M50 5 L65 20 L50 60 L35 20 Z"
                                fill="rgba(0, 255, 170, 0.1)"
                                stroke="#00ffaa"
                                strokeWidth="1"
                                opacity="0.8"
                            />
                            <path
                                d="M25 25 L50 60 L25 85 Z"
                                fill="rgba(0, 255, 170, 0.05)"
                                stroke="#00ffaa"
                                strokeWidth="1"
                                opacity="0.6"
                            />
                            <path
                                d="M75 25 L50 60 L75 85 Z"
                                fill="rgba(0, 255, 170, 0.05)"
                                stroke="#00ffaa"
                                strokeWidth="1"
                                opacity="0.6"
                            />
                            <path
                                d="M25 85 L50 60 L50 115 L25 85 Z"
                                fill="rgba(0, 255, 170, 0.1)"
                                stroke="#00ffaa"
                                strokeWidth="1"
                                opacity="0.8"
                            />
                            <path
                                d="M75 85 L50 60 L50 115 L75 85 Z"
                                fill="rgba(0, 255, 170, 0.1)"
                                stroke="#00ffaa"
                                strokeWidth="1"
                                opacity="0.8"
                            />
                            {/* Inner energy lines */}
                            <line x1="35" y1="20" x2="65" y2="20" stroke="#00ffaa" strokeWidth="0.5" opacity="0.7" />
                            <line x1="25" y1="40" x2="75" y2="40" stroke="#00ffaa" strokeWidth="0.5" opacity="0.5" />
                            <line x1="25" y1="60" x2="75" y2="60" stroke="#00ffaa" strokeWidth="0.5" opacity="0.7" />
                            <line x1="25" y1="80" x2="75" y2="80" stroke="#00ffaa" strokeWidth="0.5" opacity="0.5" />
                            <line x1="35" y1="100" x2="65" y2="100" stroke="#00ffaa" strokeWidth="0.5" opacity="0.7" />
                            {/* Center core */}
                            <circle
                                cx="50"
                                cy="60"
                                r="4"
                                fill="#00ffaa"
                                opacity="0.9"
                            />
                            <circle
                                cx="50"
                                cy="60"
                                r="2"
                                fill="#ffffff"
                                opacity="0.8"
                            />
                        </svg>
                    </div>
                    <div style={styles.gameTimer}>
                        GAME TIME: {formatElapsed()}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SecurityDashboard;
