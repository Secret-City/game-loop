import { WS_URL } from './map.js'; // Adjust the import path as necessary

let socket = null;
const subscribers = new Set();
let connectionStatus = 'DISCONNECTED'; // 'DISCONNECTED', 'CONNECTING', 'CONNECTED', 'ERROR'

const connect = (urlOrPath) => {
    let targetUrl;
    if (urlOrPath.startsWith('ws://') || urlOrPath.startsWith('wss://')) {
        targetUrl = urlOrPath;
    } else {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = window.location.host;
        targetUrl = `${protocol}//${host}${urlOrPath}`;
    }

    console.log('Connecting to WebSocket at:', targetUrl);
    if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
        if (socket.url === targetUrl) {
            return; // Already connected or connecting to the same URL
        }
        // If connecting to a different URL, you might want to close the old one first.
        // For simplicity here, we assume this is handled by context (e.g., page navigation).
    }

    socket = new WebSocket(targetUrl);
    connectionStatus = 'CONNECTING';
    notifySubscribers({ type: 'status', payload: connectionStatus });

    socket.onopen = () => {
        connectionStatus = 'CONNECTED';
        console.log('WebSocket connection established');
        notifySubscribers({ type: 'status', payload: connectionStatus });
    };

    socket.onmessage = (event) => {
        // console.log('Raw WebSocket message received:', event.data); // Log raw data
        try {
            const message = JSON.parse(event.data.toString());
            // console.log('Parsed WebSocket message:', message); // Log parsed message
            notifySubscribers(message); // Notify all subscribers with the parsed message
        } catch (error) {
            console.error('Error parsing WebSocket message:', error, event.data);
            // Notify with raw data if parsing fails, or a specific error message
            notifySubscribers({ type: 'raw_message', payload: event.data.toString() });
        }
    };

    socket.onerror = (error) => {
        connectionStatus = 'ERROR';
        console.error('WebSocket error:', error);
        notifySubscribers({ type: 'status', payload: connectionStatus, error });
    };

    socket.onclose = () => {
        connectionStatus = 'DISCONNECTED';
        console.log('WebSocket connection closed');
        notifySubscribers({ type: 'status', payload: connectionStatus });
        setTimeout(() => connect(WS_URL), 5000); // Pass WS_URL on reconnect
    };
};

const sendMessage = (message) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify(message));
    } else {
        console.warn('WebSocket is not connected. Message not sent:', message);
        // Optionally queue messages to send upon reconnection
    }
};

const subscribe = (callback) => {
    subscribers.add(callback);
    // Immediately notify new subscriber of current status
    callback({ type: 'status', payload: connectionStatus });
    return () => {
        subscribers.delete(callback);
    };
};

const notifySubscribers = (message) => {
    subscribers.forEach(callback => {
        try {
            callback(message);
        } catch (error) {
            console.error('Error in subscriber callback:', error);
        }
    });
};

// Initialize connection when the service is loaded
if (WS_URL) {
    connect(WS_URL);
} else {
    console.error("WebSocket URL is not defined. Please configure WS_URL in map.js");
}

// Heartbeat: Send ping every 30 seconds to keep the connection alive
setInterval(() => {
    if (socket?.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: 'ping' }));
    }
}, 30000);

export const websocketService = {
    connect,
    sendMessage,
    subscribe,
    getStatus: () => connectionStatus,
};
