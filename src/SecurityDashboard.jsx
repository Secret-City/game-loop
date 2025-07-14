import React, { useState, useEffect } from 'react';

const BACKUP_TIME = 10 * 60 * 1000; // 10 minutes in milliseconds

const SecurityDashboard = ({ dashboardData }) => {
    const [currentTime, setCurrentTime] = useState(Date.now());
    const [backupEndTime, setBackupEndTime] = useState(null);
    const [gameStartTime, setGameStartTime] = useState(null);
    const [collapseCountdown, setCollapseCountdown] = useState(null);
    const [timelineCollapsed, setTimelineCollapsed] = useState(false);
    const [currentPhase, setCurrentPhase] = useState("Unknown");

    // Console command function - expose to window for debugging
    useEffect(() => {
        window.sendSecurityCommand = (jsonData) => {
            console.log('Console command received:', jsonData);
            try {
                // Create a synthetic event that mimics WebSocket message handling
                const messageEvent = new CustomEvent('security-command', {
                    detail: jsonData
                });
                window.dispatchEvent(messageEvent);
                console.log('Security command dispatched successfully');
                return { success: true, message: 'Command sent successfully' };
            } catch (error) {
                console.error('Error sending security command:', error);
                return { success: false, message: error.message };
            }
        };

        // Add help function
        window.sendSecurityCommand.help = () => {
            console.log(`
Available Security Dashboard Commands:

Usage: sendSecurityCommand(jsonData)

Example commands:
// Update dashboard data
sendSecurityCommand({
    now_playing: "Battle Theme",
    security_doors: "BREACHED",
    security_firewall: "INACTIVE", 
    crystal_power: "UNSTABLE",
    phase: "raccoon",
    game_start: Date.now(),
    last_backup: Date.now()
});

// Start backup countdown
sendSecurityCommand({
    last_backup: Date.now()
});

// Change crystal status
sendSecurityCommand({
    crystal_power: "CRITICAL",
    crystal_integrty: "UNSTABLE"
});

// Trigger timeline collapse (10 second default)
sendSecurityCommand({
    crystal_integrty: "Collapsing"
});

// Trigger timeline collapse with custom duration
sendSecurityCommand({
    crystal_integrty: "Collapsing",
    collapse_seconds: 15
});

// Go directly to collapsed state (no countdown)
sendSecurityCommand({
    crystal_integrty: "Collapsed"
});

// Update security status
sendSecurityCommand({
    security_doors: "OPEN",
    security_firewall: "BREACHED"
});

Status values:
- SECURED, ACTIVE, CLOSED, CALIBRATED, STABLE, INWARD (green)
- OPEN, OUTWARD (yellow) 
- BREACHED, INACTIVE, UNSTABLE, CRITICAL (red)
- COLLAPSING (triggers red theme and countdown)
- COLLAPSED (triggers red theme and goes directly to "Timeline Collapsed")

Special attributes:
- collapse_seconds: Duration for collapse countdown (default: 10, only used with "Collapsing")
            `);
        };

        // Cleanup function
        return () => {
            delete window.sendSecurityCommand;
        };
    }, []);

    // Listen for console commands
    useEffect(() => {
        const handleConsoleCommand = (event) => {
            console.log('Security Dashboard received console command:', event.detail);
            // The command data should be handled by the parent VideoScreen component
            // but we can also trigger a re-render here if needed
        };

        window.addEventListener('security-command', handleConsoleCommand);
        return () => {
            window.removeEventListener('security-command', handleConsoleCommand);
        };
    }, []);

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
            @keyframes redPulse {
                0% { background-color: rgba(255, 0, 0, 0.9); }
                50% { background-color: rgba(255, 0, 0, 0.7); }
                100% { background-color: rgba(255, 0, 0, 0.9); }
            }
            @keyframes staticFlicker {
                0% { opacity: 1; }
                50% { opacity: 0.8; }
                100% { opacity: 1; }
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
        crystal_power = "Stable",
        collapse_seconds = 10,
        phase
    } = dashboardData || {};

    // Update phase only when provided in dashboardData
    useEffect(() => {
        if (phase !== undefined) {
            setCurrentPhase(phase);
        }
    }, [phase]);

    // Handle crystal integrity collapsing and collapsed states
    useEffect(() => {
        if (crystal_integrty?.toLowerCase() === 'collapsing') {
            // Start the countdown
            const countdownDuration = collapse_seconds * 1000; // Convert to milliseconds
            const endTime = Date.now() + countdownDuration;
            setCollapseCountdown(endTime);
            setTimelineCollapsed(false);

            // Set timeout to show "Timeline Collapsed" after countdown
            const timeout = setTimeout(() => {
                setCollapseCountdown(null);
                setTimelineCollapsed(true);
            }, countdownDuration);

            return () => clearTimeout(timeout);
        } else if (crystal_integrty?.toLowerCase() === 'collapsed') {
            // Go directly to collapsed state without countdown
            setCollapseCountdown(null);
            setTimelineCollapsed(true);
        } else {
            // Reset collapse states if crystal_integrty is not "collapsing" or "collapsed"
            setCollapseCountdown(null);
            setTimelineCollapsed(false);
        }
    }, [crystal_integrty, collapse_seconds]);

    // Set game start time when component mounts or game_start changes
    useEffect(() => {
        if (game_start) {
            setGameStartTime(game_start);
        }
        // Don't set default if game_start is not present
    }, [game_start]);

    // Set backup end time when component mounts or last_backup changes
    useEffect(() => {
        if (last_backup && last_backup !== -1) {
            // Add BACKUP_TIME to last_backup to get the end time (last_backup is the start time)
            const endTime = last_backup + BACKUP_TIME;
            console.log('Setting backupEndTime from last_backup:', last_backup, 'Date:', new Date(last_backup));
            console.log('Adding BACKUP_TIME, endTime:', endTime, 'Date:', new Date(endTime));
            setBackupEndTime(endTime);
        } else if (last_backup === -1) {
            // If last_backup is -1, set backupEndTime to null to show static 10:00
            console.log('last_backup is -1, setting backupEndTime to null');
            setBackupEndTime(null);
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

        // console.log('Countdown calculation:', {
        //     backupEndTime,
        //     currentTime,
        //     diff,
        //     backupEndTimeDate: new Date(backupEndTime),
        //     currentTimeDate: new Date(currentTime),
        //     diffMinutes: Math.floor(diff / 60000),
        //     diffSeconds: Math.floor((diff % 60000) / 1000)
        // });

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

    // Format collapse countdown
    const formatCollapseCountdown = () => {
        if (!collapseCountdown) return "00:00";

        const diff = Math.max(0, collapseCountdown - currentTime);
        const totalSeconds = Math.ceil(diff / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    // Format elapsed time since game start (counting up)
    const formatElapsed = () => {
        if (!gameStartTime) return "00:00";
        const diff = Math.max(0, currentTime - gameStartTime);
        const minutes = Math.floor(diff / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    // Check if we're in collapsing or collapsed state
    const isCollapsing = crystal_integrty?.toLowerCase() === 'collapsing' || crystal_integrty?.toLowerCase() === 'collapsed';

    const styles = {
        container: {
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: isCollapsing ? '#400000' : '#000810',
            color: isCollapsing ? '#ff6666' : '#00ffaa',
            fontFamily: 'monospace',
            fontSize: '10px',
            display: 'flex',
            flexDirection: 'column',
            border: `2px solid ${isCollapsing ? '#ff6666' : '#00ffaa'}`,
            borderRadius: '4px',
            overflow: 'hidden',
            textShadow: '0 0 8px currentColor',
            boxShadow: `inset 0 0 20px ${isCollapsing ? 'rgba(255, 102, 102, 0.2)' : 'rgba(0, 255, 170, 0.2)'}`,
            transition: 'all 0.5s ease',
        },
        header: {
            backgroundColor: isCollapsing ? 'rgba(80, 0, 0, 0.8)' : 'rgba(0, 20, 40, 0.8)',
            padding: '4px 8px',
            borderBottom: `1px solid ${isCollapsing ? '#ff6666' : '#00ffaa'}`,
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
            backgroundColor: isCollapsing ? 'rgba(80, 0, 0, 0.7)' : 'rgba(0, 0, 0, 0.7)',
            border: `1px solid ${isCollapsing ? 'rgba(255, 102, 102, 0.3)' : 'rgba(0, 255, 170, 0.3)'}`,
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
        collapseOverlay: {
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(255, 0, 0, 0.9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            zIndex: 1000,
            color: '#fff',
            fontFamily: 'monospace',
            animation: 'redPulse 1s ease-in-out infinite',
        },
        collapseTimer: {
            fontSize: '64px',
            fontWeight: 'bold',
            textShadow: '0 0 20px #fff',
            marginBottom: '20px',
        },
        collapseLabel: {
            fontSize: '24px',
            textTransform: 'uppercase',
            letterSpacing: '4px',
            textShadow: '0 0 10px #fff',
        },
        timelineCollapsedOverlay: {
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.95)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            color: '#ff4444',
            fontFamily: 'monospace',
            fontSize: '36px',
            fontWeight: 'bold',
            textTransform: 'uppercase',
            letterSpacing: '6px',
            textShadow: '0 0 20px #ff4444',
            animation: 'staticFlicker 0.5s infinite',
        },
    };

    // Get status color based on value
    const getStatusColor = (status) => {
        // If collapsing, everything should be red
        if (isCollapsing) return '#ff6666';

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
                        <div style={styles.statusLabel}>Current Phase</div>
                        <div style={{ ...styles.statusValue, color: '#ffaa66' }}>
                            {currentPhase.toUpperCase()}
                        </div>
                    </div>
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
                                stroke={isCollapsing ? "#ff6666" : "#00ffaa"}
                                strokeWidth="2"
                                opacity="0.9"
                            />
                            {/* Inner crystal facets */}
                            <path
                                d="M50 5 L65 20 L50 60 L35 20 Z"
                                fill={isCollapsing ? "rgba(255, 102, 102, 0.1)" : "rgba(0, 255, 170, 0.1)"}
                                stroke={isCollapsing ? "#ff6666" : "#00ffaa"}
                                strokeWidth="1"
                                opacity="0.8"
                            />
                            <path
                                d="M25 25 L50 60 L25 85 Z"
                                fill={isCollapsing ? "rgba(255, 102, 102, 0.05)" : "rgba(0, 255, 170, 0.05)"}
                                stroke={isCollapsing ? "#ff6666" : "#00ffaa"}
                                strokeWidth="1"
                                opacity="0.6"
                            />
                            <path
                                d="M75 25 L50 60 L75 85 Z"
                                fill={isCollapsing ? "rgba(255, 102, 102, 0.05)" : "rgba(0, 255, 170, 0.05)"}
                                stroke={isCollapsing ? "#ff6666" : "#00ffaa"}
                                strokeWidth="1"
                                opacity="0.6"
                            />
                            <path
                                d="M25 85 L50 60 L50 115 L25 85 Z"
                                fill={isCollapsing ? "rgba(255, 102, 102, 0.1)" : "rgba(0, 255, 170, 0.1)"}
                                stroke={isCollapsing ? "#ff6666" : "#00ffaa"}
                                strokeWidth="1"
                                opacity="0.8"
                            />
                            <path
                                d="M75 85 L50 60 L50 115 L75 85 Z"
                                fill={isCollapsing ? "rgba(255, 102, 102, 0.1)" : "rgba(0, 255, 170, 0.1)"}
                                stroke={isCollapsing ? "#ff6666" : "#00ffaa"}
                                strokeWidth="1"
                                opacity="0.8"
                            />
                            {/* Inner energy lines */}
                            <line x1="35" y1="20" x2="65" y2="20" stroke={isCollapsing ? "#ff6666" : "#00ffaa"} strokeWidth="0.5" opacity="0.7" />
                            <line x1="25" y1="40" x2="75" y2="40" stroke={isCollapsing ? "#ff6666" : "#00ffaa"} strokeWidth="0.5" opacity="0.5" />
                            <line x1="25" y1="60" x2="75" y2="60" stroke={isCollapsing ? "#ff6666" : "#00ffaa"} strokeWidth="0.5" opacity="0.7" />
                            <line x1="25" y1="80" x2="75" y2="80" stroke={isCollapsing ? "#ff6666" : "#00ffaa"} strokeWidth="0.5" opacity="0.5" />
                            <line x1="35" y1="100" x2="65" y2="100" stroke={isCollapsing ? "#ff6666" : "#00ffaa"} strokeWidth="0.5" opacity="0.7" />
                            {/* Center core */}
                            <circle
                                cx="50"
                                cy="60"
                                r="4"
                                fill={isCollapsing ? "#ff6666" : "#00ffaa"}
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

            {/* Collapse Countdown Overlay */}
            {collapseCountdown && (
                <div style={styles.collapseOverlay}>
                    <div style={styles.collapseTimer}>
                        {formatCollapseCountdown()}
                    </div>
                    <div style={styles.collapseLabel}>
                        Timeline Collapsing
                    </div>
                </div>
            )}

            {/* Timeline Collapsed Overlay */}
            {timelineCollapsed && (
                <div style={styles.timelineCollapsedOverlay}>
                    Timeline Collapsed
                </div>
            )}
        </div>
    );
};

export default SecurityDashboard;
