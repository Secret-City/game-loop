import React, { useState, useEffect, useRef } from 'react';
import { websocketService } from './websocketService';

const isProduction = process.env.NODE_ENV === 'production';
const basePath = isProduction ? '/game-loop/dist/' : '/';

// All styles are now defined within the component.
const aspectRatio = 1.777;

const styles = {
    videoGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
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
    "security_1_0.mp4", "security_1_1.mp4", "security_1_2.mp4", "security_1_3.mp4",
    "security_2_0.mp4", "security_2_1.mp4", "security_2_2.mp4",
    "security_3_0.mp4", "security_3_1.mp4", "security_3_2.mp4", "security_3_3.mp4",
    "security_4_0.mp4", "security_4_1.mp4", "security_4_2.mp4", "security_4_3.mp4",
    "security_5_0.mp4", "security_5_1.mp4", "security_5_2.mp4", "security_5_3.mp4",
    "security_6_0.mp4", "security_6_1.mp4", "security_6_2.mp4", "security_6_3.mp4", "security_6_4.mp4",
    "security_7_0.mp4", "security_7_1.mp4", "security_7_2.mp4",
    "security_8_0.mp4", "security_8_1.mp4", "security_8_2.mp4", "security_8_3.mp4"
];

// Helper to create initial state for 12 screens, all showing the "no signal" video.
const createInitialVideoSources = () => {
    const sources = {};
    for (let i = 1; i <= 8; i++) {
        sources[i] = `${basePath}security/security_${i}_0.mp4`;
    }
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
                const seqNum = parseInt(sequence, 10);

                if (screenNum >= 1 && screenNum <= 8 && seqNum >= -1) {
                    const newSrc = `${basePath}security/security_${screenNum}_${seqNum}.mp4`;
                    setVideoSources(prevSources => ({
                        ...prevSources,
                        [screenNum]: newSrc
                    }));

                    // The `autoPlay` prop on the <video> element will handle playing the new source.
                    // Calling load() and play() imperatively can cause race conditions.
                    console.log(`Screen ${screenNum} updated to sequence ${seqNum}`);
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
            {Object.keys(videoSources).map(screenNum => (
                <div key={screenNum} style={styles.videoContainer}>
                    <video
                        ref={el => videoRefs.current[screenNum] = el}
                        style={styles.video}
                        src={videoSources[screenNum]}
                        autoPlay
                        loop
                        muted
                        playsInline
                    />
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