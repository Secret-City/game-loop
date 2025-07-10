import React, { useState, useRef, useEffect } from 'react';
const isProduction = process.env.NODE_ENV === 'production';
const basePath = isProduction ? '/game-loop/dist/' : '/';

// Mock document viewer using images instead of PDFs

// Document data with access codes and image arrays
const documentData = {
    "iukac": {
        code: "iukac",
        docId: "recalibrate",
        name: "Project Alpha",
        images: [
            `${basePath}pdfs/recalibrate_1.jpg`,
        ]
    },
    "xhjym": {
        code: "xhjym",
        docId: "undoctored",
        name: "Admin Manual",
        images: [
            `${basePath}pdfs/undoctored_1.jpg`,
            `${basePath}pdfs/undoctored_2.jpg`,
            `${basePath}pdfs/undoctored_3.jpg`
        ]
    }
};

// Styles object containing all CSS
const styles = {
    microfilmContainer: {
        width: '100%',
        height: '100vh',
        background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #0a0a0a 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Courier New', monospace",
        color: '#00ffff',
        overflow: 'hidden',
        position: 'relative',
    },
    microfilmTerminal: {
        width: '800px',
        height: '600px',
        background: '#1a1a2e',
        border: '3px solid #00ffff',
        borderRadius: '10px',
        boxShadow: '0 0 20px rgba(0, 255, 255, 0.5), inset 0 0 20px rgba(0, 255, 255, 0.1)',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
    },
    terminalHeader: {
        background: 'linear-gradient(90deg, #0f3460 0%, #16213e 100%)',
        padding: '15px',
        borderBottom: '2px solid #00ffff',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    terminalTitle: {
        fontSize: '14px',
        fontWeight: 'bold',
        textTransform: 'lowercase',
        letterSpacing: '2px',
        textShadow: '0 0 10px #00ffff',
    },
    terminalStatus: {
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        fontSize: '12px',
    },
    statusLight: {
        width: '12px',
        height: '12px',
        borderRadius: '50%',
        background: '#00ff00',
        border: '1px solid #666',
        boxShadow: '0 0 10px #00ff00',
        animation: 'pulse 2s infinite',
    },
    passwordScreen: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        padding: '30px',
        gap: '30px',
    },
    displayArea: {
        flex: 1,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
    },
    screenBorder: {
        width: '500px',
        height: '200px',
        background: '#000',
        border: '4px solid #333',
        borderRadius: '15px',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: 'inset 0 0 30px rgba(0, 255, 255, 0.2), 0 0 20px rgba(0, 255, 255, 0.3)',
    },
    crtLines: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'repeating-linear-gradient(0deg, transparent 0px, transparent 2px, rgba(0, 255, 255, 0.1) 2px, rgba(0, 255, 255, 0.1) 4px)',
        pointerEvents: 'none',
        zIndex: 1,
    },
    displayContent: {
        padding: '30px',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '20px',
        position: 'relative',
        zIndex: 2,
    },
    accessPrompt: {
        fontSize: '16px',
        color: '#00ffff',
        textShadow: '0 0 10px #00ffff',
        textAlign: 'center',
        textTransform: 'lowercase',
        letterSpacing: '3px',
        animation: 'glow 2s ease-in-out infinite alternate',
    },
    codeDisplay: {
        fontSize: '24px',
        fontWeight: 'bold',
        color: '#00ff00',
        background: 'rgba(0, 255, 0, 0.1)',
        padding: '15px 25px',
        border: '2px solid #00ff00',
        borderRadius: '5px',
        letterSpacing: '8px',
        minWidth: '300px',
        textAlign: 'center',
        textShadow: '0 0 10px #00ff00',
        transition: 'all 0.3s ease',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '10px',
    },
    codeImage: {
        width: '32px',
        height: '32px',
        filter: 'invert(1) sepia(1) saturate(5) hue-rotate(120deg) brightness(1.2)',
        transition: 'all 0.3s ease',
    },
    codePlaceholder: {
        width: '32px',
        height: '32px',
        border: '2px dashed #00ff00',
        borderRadius: '4px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#00ff00',
        fontSize: '20px',
        opacity: 0.5,
    },
    codeDisplayError: {
        color: '#ff0000',
        borderColor: '#ff0000',
        background: 'rgba(255, 0, 0, 0.1)',
        textShadow: '0 0 10px #ff0000',
        animation: 'shake 0.5s ease-in-out',
    },
    errorMessage: {
        color: '#ff0000',
        fontSize: '14px',
        textShadow: '0 0 10px #ff0000',
        animation: 'blink 1s linear infinite',
        textTransform: 'lowercase',
        letterSpacing: '2px',
    },
    keyboardSection: {
        display: 'flex',
        justifyContent: 'center',
    },
    keyboardContainer: {
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        background: '#2a2a4e',
        padding: '20px',
        borderRadius: '10px',
        border: '2px solid #555',
        boxShadow: 'inset 0 0 20px rgba(0, 0, 0, 0.5)',
    },
    keyboardRow: {
        display: 'flex',
        gap: '5px',
        justifyContent: 'center',
    },
    keyboardKey: {
        width: '55px',
        height: '55px',
        background: 'linear-gradient(145deg, #4a4a6e, #3a3a5e)',
        border: '2px solid #666',
        borderRadius: '8px',
        color: '#00ffff',
        fontFamily: "'Courier New', monospace",
        fontSize: '14px',
        fontWeight: 'bold',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        textShadow: '0 0 5px #00ffff',
        boxShadow: '0 3px 6px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '8px',
    },
    keyImage: {
        width: '32px',
        height: '32px',
        filter: 'invert(1) sepia(1) saturate(5) hue-rotate(180deg) brightness(1.2)',
        transition: 'all 0.2s ease',
        pointerEvents: 'none',
    },
    keyboardKeyHover: {
        background: 'linear-gradient(145deg, #5a5a7e, #4a4a6e)',
        borderColor: '#00ffff',
        boxShadow: '0 0 15px rgba(0, 255, 255, 0.5), 0 3px 6px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
        transform: 'translateY(-1px)',
    },
    clearKey: {
        width: '100px',
        fontSize: '12px',
    },
    submitKey: {
        width: '100px',
        fontSize: '12px',
        background: 'linear-gradient(145deg, #4a6e4a, #3a5e3a)',
    },
    // Viewer styles
    microfilmViewer: {
        width: '95vw',
        height: '95vh',
        background: '#1a1a2e',
        border: '3px solid #00ffff',
        borderRadius: '10px',
        boxShadow: '0 0 30px rgba(0, 255, 255, 0.5), inset 0 0 30px rgba(0, 255, 255, 0.1)',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
    },
    viewerHeader: {
        background: 'linear-gradient(90deg, #0f3460 0%, #16213e 100%)',
        padding: '15px 30px',
        borderBottom: '2px solid #00ffff',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    viewerTitle: {
        fontSize: '16px',
        fontWeight: 'bold',
        textTransform: 'lowercase',
        letterSpacing: '2px',
        textShadow: '0 0 10px #00ffff',
    },
    backButton: {
        background: 'linear-gradient(145deg, #4a4a6e, #3a3a5e)',
        border: '2px solid #666',
        borderRadius: '5px',
        color: '#00ffff',
        padding: '8px 16px',
        fontFamily: "'Courier New', monospace",
        fontSize: '12px',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        textShadow: '0 0 5px #00ffff',
    },
    viewerMain: {
        flex: 1,
        display: 'flex',
        padding: '20px',
        gap: '20px',
    },
    controlPanel: {
        width: '200px',
        background: '#2a2a4e',
        border: '2px solid #555',
        borderRadius: '10px',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        boxShadow: 'inset 0 0 20px rgba(0, 0, 0, 0.3)',
    },
    controlGroup: {
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
    },
    controlLabel: {
        fontSize: '12px',
        color: '#00ffff',
        textAlign: 'center',
        textTransform: 'lowercase',
        letterSpacing: '1px',
        textShadow: '0 0 5px #00ffff',
    },
    knobContainer: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: '#1a1a3e',
        border: '1px solid #444',
        borderRadius: '20px',
        padding: '5px 10px',
    },
    knobButton: {
        width: '30px',
        height: '30px',
        background: 'linear-gradient(145deg, #4a4a6e, #3a3a5e)',
        border: '1px solid #666',
        borderRadius: '50%',
        color: '#00ffff',
        fontWeight: 'bold',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    knobDisplay: {
        fontSize: '12px',
        color: '#00ff00',
        textShadow: '0 0 5px #00ff00',
        minWidth: '60px',
        textAlign: 'center',
    },
    documentViewport: {
        flex: 1,
        background: '#000',
        border: '4px solid #333',
        borderRadius: '15px',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: 'inset 0 0 30px rgba(0, 255, 255, 0.2), 0 0 20px rgba(0, 255, 255, 0.3)',
    },
    viewportFrame: {
        width: '100%',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
    },
    scanningLine: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '2px',
        background: 'linear-gradient(90deg, transparent, #00ffff, transparent)',
        animation: 'scan 3s linear infinite',
        zIndex: 10,
        opacity: 0.7,
    },
    documentContainer: {
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'transform 0.1s ease-out',
        position: 'relative',
    },
    loadingIndicator: {
        color: '#00ffff',
        fontSize: '18px',
        textAlign: 'center',
        textShadow: '0 0 10px #00ffff',
    },
    pageControls: {
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        alignItems: 'center',
    },
    pageButton: {
        background: 'linear-gradient(145deg, #4a4a6e, #3a3a5e)',
        border: '2px solid #666',
        borderRadius: '5px',
        color: '#00ffff',
        padding: '8px 12px',
        fontFamily: "'Courier New', monospace",
        fontSize: '10px',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        textShadow: '0 0 5px #00ffff',
        width: '100%',
    },
    pageDisplay: {
        fontSize: '12px',
        color: '#00ff00',
        textShadow: '0 0 5px #00ff00',
        textAlign: 'center',
        background: '#1a1a3e',
        border: '1px solid #444',
        borderRadius: '5px',
        padding: '5px 10px',
    },
    statusPanel: {
        marginTop: '20px',
        padding: '15px',
        background: '#1a1a3e',
        border: '1px solid #444',
        borderRadius: '5px',
    },
    statusItem: {
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: '8px',
        fontSize: '10px',
    },
    statusLabel: {
        color: '#888',
    },
    statusValue: {
        color: '#00ff00',
        textShadow: '0 0 5px #00ff00',
    },
};


const KEYBOARD_LAYOUT = [
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O'],
    ['A', 'S', 'F', 'G', 'H', 'J', 'K', 'L'],
    ['Z', 'X', 'C', 'V', 'B', 'N', 'M']
];

const Microfilm = () => {
    const [currentScreen, setCurrentScreen] = useState('password');
    const [inputCode, setInputCode] = useState('');
    const [currentFile, setCurrentFile] = useState(null);
    const [errorAnimation, setErrorAnimation] = useState(false);
    const [numPages, setNumPages] = useState(0);
    const [pageNumber, setPageNumber] = useState(1);
    const [scale, setScale] = useState(1.0);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [isLoading, setIsLoading] = useState(false);

    const viewerRef = useRef(null);

    // Add CSS animations
    useEffect(() => {
        const styleSheet = document.createElement('style');
        styleSheet.textContent = `
            @keyframes pulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.7; }
            }
            @keyframes glow {
                from { text-shadow: 0 0 10px #00ffff; }
                to { text-shadow: 0 0 20px #00ffff, 0 0 30px #00ffff; }
            }
            @keyframes shake {
                0%, 100% { transform: translateX(0); }
                25% { transform: translateX(-5px); }
                75% { transform: translateX(5px); }
            }
            @keyframes blink {
                0%, 50% { opacity: 1; }
                51%, 100% { opacity: 0; }
            }
            @keyframes scan {
                0% { transform: translateY(0); }
                100% { transform: translateY(100vh); }
            }
        `;
        document.head.appendChild(styleSheet);
        return () => document.head.removeChild(styleSheet);
    }, []);

    const handleKeyPress = (key: string) => {
        if (inputCode.length < 5) {
            setInputCode(prev => prev + key.toLowerCase());
        }
    };

    const handleClearCode = () => {
        setInputCode('');
    };

    const handleSubmitCode = () => {
        if (inputCode.length !== 5) {
            setErrorAnimation(true);
            setTimeout(() => {
                setErrorAnimation(false);
                setInputCode('');
            }, 1000);
            return;
        }
        console.log('Submitting code:', inputCode, documentData[inputCode]);

        const matchedFile = documentData[inputCode];

        if (matchedFile) {
            setCurrentFile(matchedFile);
            setCurrentScreen('viewer');
            setInputCode('');
            setPageNumber(1);
            setScale(1.0);
            setPosition({ x: 0, y: 0 });
            setNumPages(matchedFile.images.length);
        } else {
            setErrorAnimation(true);
            setTimeout(() => {
                setErrorAnimation(false);
                setInputCode('');
            }, 1000);
        }
    };

    const handleBackToPassword = () => {
        setCurrentScreen('password');
        setCurrentFile(null);
        setInputCode('');
    };

    const getCurrentImage = () => {
        if (!currentFile || !currentFile.images) return null;
        return currentFile.images[pageNumber - 1];
    };

    const handleZoomIn = () => {
        setScale(prev => Math.min(prev + 0.2, 3.0));
    };

    const handleZoomOut = () => {
        setScale(prev => Math.max(prev - 0.2, 0.5));
    };

    const handlePositionChange = (axis: 'x' | 'y', delta: number) => {
        setPosition(prev => ({
            ...prev,
            [axis]: prev[axis] + delta
        }));
    };

    const handleMouseDown = (e) => {
        setIsDragging(true);
        setDragStart({
            x: e.clientX - position.x,
            y: e.clientY - position.y
        });
    };

    const handleMouseMove = (e) => {
        if (isDragging) {
            setPosition({
                x: e.clientX - dragStart.x,
                y: e.clientY - dragStart.y
            });
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const changePage = (direction: 'prev' | 'next') => {
        if (direction === 'prev' && pageNumber > 1) {
            setPageNumber(pageNumber - 1);
        } else if (direction === 'next' && pageNumber < numPages) {
            setPageNumber(pageNumber + 1);
        }
    };

    if (currentScreen === 'password') {
        return (
            <div style={styles.microfilmContainer}>
                <div style={styles.microfilmTerminal}>
                    <div style={styles.terminalHeader}>
                        <div style={styles.terminalTitle}>SECURE ARCHIVE ACCESS TERMINAL</div>
                        <div style={styles.terminalStatus}>
                            <span style={styles.statusLight}></span>
                            <span>SYSTEM READY</span>
                        </div>
                    </div>

                    <div style={styles.passwordScreen}>
                        <div style={styles.displayArea}>
                            <div style={styles.screenBorder}>
                                <div style={styles.crtLines}></div>
                                <div style={styles.displayContent}>
                                    <div style={styles.accessPrompt}>
                                        ENTER AUTHORIZATION CODE
                                    </div>
                                    <div style={{
                                        ...styles.codeDisplay,
                                        ...(errorAnimation ? styles.codeDisplayError : {})
                                    }}>
                                        {Array.from({ length: 5 }, (_, index) => {
                                            const char = inputCode[index];
                                            if (char) {
                                                return (
                                                    <img
                                                        key={index}
                                                        src={`${basePath}keys/key_${char.toLowerCase()}.png`}
                                                        alt={char}
                                                        style={styles.codeImage}
                                                        onError={(e) => {
                                                            e.target.style.display = 'none';
                                                            e.target.nextSibling.style.display = 'flex';
                                                        }}
                                                    />
                                                );
                                            } else {
                                                return (
                                                    <div key={index} style={styles.codePlaceholder}>
                                                        _
                                                    </div>
                                                );
                                            }
                                        })}
                                    </div>
                                    {errorAnimation && (
                                        <div style={styles.errorMessage}>
                                            {inputCode.length !== 5 ? 'CODE MUST BE 5 LETTERS' : 'ACCESS DENIED'}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div style={styles.keyboardSection}>
                            <div style={styles.keyboardContainer}>
                                {KEYBOARD_LAYOUT.map((row, rowIndex) => (
                                    <div key={rowIndex} style={styles.keyboardRow}>
                                        {row.map(key => (
                                            <button
                                                key={key}
                                                style={styles.keyboardKey}
                                                onClick={() => handleKeyPress(key)}
                                                disabled={errorAnimation}
                                                onMouseEnter={(e) => {
                                                    if (!errorAnimation) {
                                                        Object.assign(e.target.style, styles.keyboardKeyHover);
                                                    }
                                                }}
                                                onMouseLeave={(e) => {
                                                    Object.assign(e.target.style, styles.keyboardKey);
                                                }}
                                            >
                                                <img
                                                    src={`${basePath}keys/key_${key.toLowerCase()}.png`}
                                                    alt={key}
                                                    style={styles.keyImage}
                                                    onError={(e) => {
                                                        // Fallback to text if image fails to load
                                                        e.target.style.display = 'none';
                                                        e.target.parentElement.textContent = key;
                                                    }}
                                                />
                                            </button>
                                        ))}
                                    </div>
                                ))}
                                <div style={styles.keyboardRow}>
                                    <button
                                        style={{ ...styles.keyboardKey, ...styles.clearKey }}
                                        onClick={handleClearCode}
                                        disabled={errorAnimation}
                                    >
                                        CLEAR
                                    </button>
                                    <button
                                        style={{ ...styles.keyboardKey, ...styles.submitKey }}
                                        onClick={handleSubmitCode}
                                        disabled={errorAnimation || inputCode.length !== 5}
                                    >
                                        SUBMIT
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div style={styles.microfilmContainer}>
            <div style={styles.microfilmViewer}>
                <div style={styles.viewerHeader}>
                    <div style={styles.viewerTitle}>
                        MICROFILM VIEWER - {currentFile?.name || 'UNKNOWN'}
                    </div>
                    <button style={styles.backButton} onClick={handleBackToPassword}>
                        ← RETURN TO TERMINAL
                    </button>
                </div>

                <div style={styles.viewerMain}>
                    <div style={styles.controlPanel}>
                        <div style={styles.controlGroup}>
                            <div style={styles.controlLabel}>ZOOM</div>
                            <div style={styles.knobContainer}>
                                <button style={styles.knobButton} onClick={handleZoomOut}>-</button>
                                <div style={styles.knobDisplay}>{(scale * 100).toFixed(0)}%</div>
                                <button style={styles.knobButton} onClick={handleZoomIn}>+</button>
                            </div>
                        </div>

                        <div style={styles.controlGroup}>
                            <div style={styles.controlLabel}>X-AXIS</div>
                            <div style={styles.knobContainer}>
                                <button style={styles.knobButton} onClick={() => handlePositionChange('x', -20)}>←</button>
                                <div style={styles.knobDisplay}>{position.x}</div>
                                <button style={styles.knobButton} onClick={() => handlePositionChange('x', 20)}>→</button>
                            </div>
                        </div>

                        <div style={styles.controlGroup}>
                            <div style={styles.controlLabel}>Y-AXIS</div>
                            <div style={styles.knobContainer}>
                                <button style={styles.knobButton} onClick={() => handlePositionChange('y', -20)}>↑</button>
                                <div style={styles.knobDisplay}>{position.y}</div>
                                <button style={styles.knobButton} onClick={() => handlePositionChange('y', 20)}>↓</button>
                            </div>
                        </div>
                    </div>

                    <div style={styles.documentViewport}>
                        <div style={styles.viewportFrame}>
                            <div style={styles.scanningLine}></div>
                            <div
                                style={{
                                    ...styles.documentContainer,
                                    transform: `translate(${position.x}px, ${position.y}px)`,
                                    cursor: isDragging ? 'grabbing' : 'grab'
                                }}
                                ref={viewerRef}
                                onMouseDown={handleMouseDown}
                                onMouseMove={handleMouseMove}
                                onMouseUp={handleMouseUp}
                                onMouseLeave={handleMouseUp}
                            >
                                {currentFile ? (
                                    getCurrentImage() ? (
                                        <img
                                            src={getCurrentImage()}
                                            alt={`Document page ${pageNumber}`}
                                            style={{
                                                maxWidth: '100%',
                                                maxHeight: '100%',
                                                transform: `scale(${scale})`,
                                                transition: 'transform 0.1s ease-out',
                                                filter: 'sepia(20%) hue-rotate(180deg) saturate(0.8) brightness(1.1)',
                                                border: '2px solid #444',
                                                boxShadow: '0 0 20px rgba(0, 0, 0, 0.5)'
                                            }}
                                            onError={(e) => {
                                                e.target.style.display = 'none';
                                            }}
                                        />
                                    ) : (
                                        <div style={styles.loadingIndicator}>
                                            IMAGE NOT FOUND
                                        </div>
                                    )
                                ) : (
                                    <div style={styles.loadingIndicator}>
                                        NO DOCUMENT LOADED
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div style={styles.controlPanel}>
                        <div style={styles.controlGroup}>
                            <div style={styles.controlLabel}>PAGE</div>
                            <div style={styles.pageControls}>
                                <button
                                    style={styles.pageButton}
                                    onClick={() => changePage('prev')}
                                    disabled={pageNumber <= 1}
                                >
                                    ← PREV
                                </button>
                                <div style={styles.pageDisplay}>
                                    {pageNumber} / {numPages || 1}
                                </div>
                                <button
                                    style={styles.pageButton}
                                    onClick={() => changePage('next')}
                                    disabled={pageNumber >= numPages}
                                >
                                    NEXT →
                                </button>
                            </div>
                        </div>

                        <div style={styles.statusPanel}>
                            <div style={styles.statusItem}>
                                <span style={styles.statusLabel}>MAGNIFICATION:</span>
                                <span style={styles.statusValue}>{(scale * 100).toFixed(0)}%</span>
                            </div>
                            <div style={styles.statusItem}>
                                <span style={styles.statusLabel}>POSITION:</span>
                                <span style={styles.statusValue}>X:{position.x} Y:{position.y}</span>
                            </div>
                            <div style={styles.statusItem}>
                                <span style={styles.statusLabel}>DOCUMENT:</span>
                                <span style={styles.statusValue}>{currentFile?.docId || 'NONE'}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Microfilm;
