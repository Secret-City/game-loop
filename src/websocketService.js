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
        // console.log('WebSocket Service: Raw message received:', event.data);
        try {
            const message = JSON.parse(event.data);
            // console.log('WebSocket Service: Parsed message:', message);
            notifySubscribers(message);
        } catch (error) {
            console.error('Error parsing WebSocket message:', error, event.data);
            notifySubscribers({ type: 'raw_message', payload: event.data });
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
        setTimeout(() => connect(targetUrl), 5000); // Pass targetUrl on reconnect
    };
};

const sendMessage = (message) => {
    console.log('WebSocket Service: Attempting to send message:', message, 'Socket state:', socket?.readyState, 'Status:', connectionStatus);
    if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify(message));
        console.log('WebSocket Service: Message sent successfully');
    } else {
        console.warn('WebSocket is not connected. Message not sent:', message, 'Socket:', socket, 'Ready state:', socket?.readyState);
        // Optionally queue messages to send upon reconnection
    }
};

const subscribe = (callback, urlOrPath = 'ws://towerloop:1880/ws/dronemaze') => {
    console.log('WebSocket Service: Subscribe called with URL:', urlOrPath, 'Current status:', connectionStatus);
    console.log('WebSocket Service: Current subscribers count before adding:', subscribers.size);
    subscribers.add(callback);
    console.log('WebSocket Service: Current subscribers count after adding:', subscribers.size);

    // Connect if not already connected or connecting
    if (connectionStatus === 'DISCONNECTED' || connectionStatus === 'ERROR') {
        console.log('WebSocket Service: Connecting because status is:', connectionStatus);
        connect(urlOrPath);
    }

    // Immediately notify new subscriber of current status
    callback({ type: 'status', payload: connectionStatus });
    return () => {
        console.log('WebSocket Service: Unsubscribing callback, subscribers before removal:', subscribers.size);
        subscribers.delete(callback);
        console.log('WebSocket Service: Subscribers after removal:', subscribers.size);
    };
};

const notifySubscribers = (message) => {
    // console.log('WebSocket Service: Notifying', subscribers.size, 'subscribers with message:', message);
    subscribers.forEach((callback, index) => {
        try {
            // console.log('WebSocket Service: Calling subscriber', index + 1);
            callback(message);
        } catch (error) {
            console.error('Error in subscriber callback:', error);
        }
    });
};

// Initialize connection when the service is loaded - now handled by first subscriber
// Connection will be established when the first component subscribes

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
