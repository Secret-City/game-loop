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
    "3_raccoon_countdown.mp4", "3_raccoon_win.mp4", "4_gas_win.mp4",
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
    const [loadingStarted, setLoadingStarted] = useState(false);
    const [videoSources, setVideoSources] = useState(createInitialVideoSources);
    const [audioEnabled, setAudioEnabled] = useState(false);
    const videoRefs = useRef({});

    // Audio refs for music and sound management
    const musicRef = useRef(null);
    const soundRef = useRef(null);
    const audioEnabledRef = useRef(false);

    // Function to enable audio context and start loading
    const enableAudioAndStartLoading = () => {
        console.log('Enabling audio and starting loading...');
        setAudioEnabled(true);
        audioEnabledRef.current = true;
        setLoadingStarted(true);

        // Play a silent audio to unlock audio context
        const silentAudio = new Audio('data:audio/wav;base64,UklGRnoAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoAAABBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuH0fDSgCwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuH0fDSgCwFS');
        silentAudio.play().then(() => {
            console.log('Audio context unlocked successfully');
        }).catch((error) => {
            console.log('Silent audio play failed (this is normal):', error);
        });
    };

    // Function to handle music playback
    const playMusic = (url) => {
        // If url is "" or undefined, stop any currently playing music
        if (!url) {
            console.log('Stopping music playback, no URL provided');
            if (musicRef.current) {
                musicRef.current.pause();
                // musicRef.current = null;
            }
            return;
        }
        console.log('playMusic called, audioEnabled:', audioEnabledRef.current);
        if (!audioEnabledRef.current) {
            console.log('Audio not enabled yet, skipping music playback');
            return;
        }

        console.log('Playing music:', url);

        // Stop current music if playing
        if (musicRef.current) {
            musicRef.current.pause();
            musicRef.current = null;
        }

        // Create and play new music
        const audio = new Audio(url);
        audio.loop = true; // Music typically loops
        audio.volume = 0.10; // Adjust volume as needed

        audio.play().then(() => {
            console.log('Music started successfully');
            musicRef.current = audio;
        }).catch(error => {
            console.error('Failed to play music:', error);
        });
    };

    // Function to handle sound effect playback
    const playSound = (url) => {
        // If url is "" or undefined, stop any currently playing sound
        if (!url) {
            console.log('Stopping sound playback, no URL provided');
            if (soundRef.current) {
                soundRef.current.pause();
                soundRef.current = null;
            }
            return;
        }

        console.log('playSound called, audioEnabled:', audioEnabledRef.current);
        if (!audioEnabledRef.current) {
            console.log('Audio not enabled yet, skipping sound playback');
            return;
        }

        console.log('Playing sound:', url);

        // Stop current sound if playing
        if (soundRef.current) {
            soundRef.current.pause();
            soundRef.current = null;
        }

        // Create and play new sound
        const audio = new Audio(url);
        audio.volume = 1.0; // Sound effects at full volume

        audio.play().then(() => {
            console.log('Sound started successfully');
            soundRef.current = audio;

            // Clean up reference when sound ends
            audio.addEventListener('ended', () => {
                if (soundRef.current === audio) {
                    soundRef.current = null;
                }
            });
        }).catch(error => {
            console.error('Failed to play sound:', error);
        });
    };

    // Effect for preloading videos - only start after user interaction
    useEffect(() => {
        if (!loadingStarted) return;

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
    }, [loadingStarted]);

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

                // Handle sound messages
                if (parsedMsg.sound_type) {
                    if (parsedMsg.sound_type === 'music') {
                        playMusic(`${basePath}${parsedMsg.url}`);
                    } else if (parsedMsg.sound_type === 'sound') {
                        playSound(`${basePath}${parsedMsg.url}`);
                    } else {
                        console.warn('Unknown sound_type:', parsedMsg.sound_type);
                    }
                    return;
                }

                // Handle refresh page events
                if (parsedMsg.type === 'refresh_page') {
                    console.log('VideoScreen: Received refresh_page event, reloading...');
                    window.location.reload();
                    return;
                }

                // Handle video update messages
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

        const unsubscribe = websocketService.subscribe(handleMessage, 'ws://towerloop:1880/ws/wall');

        return () => {
            unsubscribe();
            // Clean up audio when component unmounts
            if (musicRef.current) {
                musicRef.current.pause();
                musicRef.current = null;
            }
            if (soundRef.current) {
                soundRef.current.pause();
                soundRef.current = null;
            }
        };
    }, []);

    // Show "Load Security Feeds" button before loading starts
    if (!loadingStarted) {
        return (
            <div style={{
                ...styles.loadingOverlay,
                cursor: 'pointer'
            }} onClick={enableAudioAndStartLoading}>
                <div style={styles.loadingText}>LOAD SECURITY FEEDS</div>
                <div style={{ fontSize: '0.5em', marginTop: '1em' }}>
                    Click to initialize system and enable audio
                </div>
            </div>
        );
    }

    // Show loading progress
    // if (!isLoaded) {
    //     return (
    //         <div style={styles.loadingOverlay}>
    //             <div style={styles.loadingText}>LOADING... {loadingProgress}%</div>
    //             <div style={styles.progressBarContainer}>
    //                 <div style={{ ...styles.progressBar, width: `${loadingProgress}%` }}></div>
    //             </div>
    //             <div style={styles.loadingFile}>{loadingFile}</div>
    //         </div>
    //     );
    // }

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
                            {...(videoSources[screenNum].split('/').pop().toLowerCase().includes('loop') ? { loop: true } : {})}
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