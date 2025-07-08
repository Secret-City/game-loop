import React, { useState, useEffect, useRef } from 'react';
import { websocketService } from './websocketService';

const isProduction = process.env.NODE_ENV === 'production';
const basePath = isProduction ? '/game-loop/dist/' : '/';

// All styles are now defined within the component.
const aspectRatio = 1.777;

const styles = {
    videoGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '2px',
        width: '100vw',
        backgroundColor: '#111',
        alignContent: 'start',
    },
    videoContainer: {
        position: 'relative',
        width: '100%',
        paddingTop: `${100 / aspectRatio}%`, // Calculated from JS variable
        background: 'black',
    },
    video: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        objectFit: 'cover',
    },
    videoOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
    },
    overlayCorner: {
        position: 'absolute',
        color: 'white',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        padding: '5px',
        fontFamily: 'monospace',
        fontSize: '14px',
    },
    topLeft: {
        top: '10px',
        left: '10px',
    },
    topRight: {
        top: '10px',
        right: '10px',
    },
    bottomLeft: {
        bottom: '10px',
        left: '10px',
    },
    bottomRight: {
        bottom: '10px',
        right: '10px',
    },
    loadingOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'black',
        color: 'white',
        fontSize: '2em',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'column',
        zIndex: 9999,
    },
    loadingText: {
        marginBottom: '1em',
    },
    loadingFile: {
        fontSize: '0.6em',
        marginTop: '0.5em',
        color: '#888',
    },
    progressBarContainer: {
        width: '300px',
        height: '20px',
        background: '#333',
        border: '1px solid #777',
        borderRadius: '5px',
        overflow: 'hidden',
    },
    progressBar: {
        height: '100%',
        background: '#4caf50',
        transition: 'width 0.4s ease',
    },
};

// List of all video files to be preloaded.
const videoList = [
    "1_gas_countdown.mp4", "1_gas_win.mp4", "1_gas_won_loop.mp4", "2_gas_win.mp4",
    "3_racoon_countdown.mp4", "3_racoon_win.mp4", "4_gas_win.mp4",
    "4_spy_win.mp4", "5_spy_countdown.mp4", "5_spy_win.mp4", "6_spy_win.mp4",
    "6_music_countdown.mp4", "6_music_win.mp4", "7_music_win.mp4", "8_power_countdown.mp4"
];

// Helper to create initial state for 12 screens, all showing the "no signal" video.
const createInitialVideoSources = () => {
    const sources = {
        1: `${basePath}security/1_begin.png`,
        2: `${basePath}security/2_begin.png`,
        3: `${basePath}security/3_begin.png`,
        4: `${basePath}security/4_begin.png`,
        5: `${basePath}security/5_begin.png`,
        6: `${basePath}security/6_begin.png`,
        7: `${basePath}security/7_begin.png`,
        8: `${basePath}security/8_begin.png`,
        9: `${basePath}security/9_begin.png`,
    };
    // for (let i = 1; i <= 8; i++) {
    //     sources[i] = `${basePath}security/${i}_begin.png`;
    // }
    return sources;
};

function VideoScreen() {
    const [loadingProgress, setLoadingProgress] = useState(0);
    const [loadingFile, setLoadingFile] = useState('');
    const [isLoaded, setIsLoaded] = useState(false);
    const [videoSources, setVideoSources] = useState(createInitialVideoSources);
    const videoRefs = useRef({});

    // Effect for preloading videos
    useEffect(() => {
        let completed = 0;
        const total = videoList.length;

        videoList.forEach(src => {
            const fullPath = `${basePath}security/${src}`;
            const video = document.createElement('video');
            video.src = fullPath;
            video.preload = 'auto';

            const updateProgress = () => {
                completed++;
                const percent = Math.round((completed / total) * 100);
                setLoadingProgress(percent);
                setLoadingFile(fullPath);
                if (completed === total) {
                    setTimeout(() => setIsLoaded(true), 500); // Short delay before hiding loader
                }
            };

            video.addEventListener('canplaythrough', updateProgress);
            video.addEventListener('error', () => {
                console.warn(`Failed to preload: ${fullPath}`);
                updateProgress(); // Still count it as completed to not block loading
            });
        });
    }, []);

    // Effect for WebSocket communication
    useEffect(() => {
        const handleMessage = (msg) => {
            // console.log("Received WebSocket message:", msg);
            try {
                // The message might be a string, so we parse it.
                const parsedMsg = typeof msg === 'string' ? JSON.parse(msg) : msg;

                if (parsedMsg.type == "ping") {
                    // Handle ping messages if needed, e.g., to keep the connection alive.
                    return;
                }

                // if (parsedMsg.type === 'video_update') { // Assuming server wraps messages

                if (parsedMsg.screen == null || parsedMsg.screen === undefined || parsedMsg.sequence == null || parsedMsg.sequence === undefined) {
                    console.warn("Invalid message format, missing screen or sequence:", parsedMsg, parsedMsg.sequence, parsedMsg.screen);
                    return;
                }
                const { screen, sequence } = parsedMsg;
                const screenNum = parseInt(screen, 10);
                const filename = sequence; // sequence is now the full filename

                if (screenNum >= 1 && screenNum <= 9 && filename) {
                    const newSrc = `${basePath}security/${filename}`;
                    setVideoSources(prevSources => ({
                        ...prevSources,
                        [screenNum]: newSrc
                    }));

                    // The `autoPlay` prop on the <video> element will handle playing the new source.
                    // Calling load() and play() imperatively can cause race conditions.
                    console.log(`Screen ${screenNum} updated to filename: ${filename}`);
                }
                // }
            } catch (err) {
                console.error("Invalid WebSocket message:", msg, err);
            }
        };

        const unsubscribe = websocketService.subscribe(handleMessage);
        websocketService.connect('/ws/wall'); // Ensure connection

        return () => unsubscribe();
    }, []);

    if (!isLoaded) {
        return (
            <div style={styles.loadingOverlay}>
                <div style={styles.loadingText}>LOADING... {loadingProgress}%</div>
                <div style={styles.progressBarContainer}>
                    <div style={{ ...styles.progressBar, width: `${loadingProgress}%` }}></div>
                </div>
                <div style={styles.loadingFile}>{loadingFile}</div>
            </div>
        );
    }

    return (
        <div style={styles.videoGrid}>
            {[1, 2, 3, 4, 9, 5, 6, 7, 8].map(screenNum => (
                <div key={screenNum} style={styles.videoContainer}>
                    {videoSources[screenNum].toLowerCase().includes('.png') ? (
                        <img
                            ref={el => videoRefs.current[screenNum] = el}
                            style={styles.video}
                            src={videoSources[screenNum]}
                            alt={`Screen ${screenNum}`}
                        />
                    ) : (
                        <video
                            ref={el => videoRefs.current[screenNum] = el}
                            style={styles.video}
                            src={videoSources[screenNum]}
                            autoPlay
                            loop={videoSources[screenNum].toLowerCase().includes('loop')}
                            muted
                            playsInline
                        />
                    )}
                    <div style={styles.videoOverlay}>
                        {/* <div style={{ ...styles.overlayCorner, ...styles.topLeft }}></div>
                        <div style={{ ...styles.overlayCorner, ...styles.topRight }}>CAM 0{screenNum}</div>
                        <div style={{ ...styles.overlayCorner, ...styles.bottomLeft }}></div>
                        <div style={{ ...styles.overlayCorner, ...styles.bottomRight }}></div> */}
                    </div>
                </div>
            ))}
        </div>
    );
}

export default VideoScreen;