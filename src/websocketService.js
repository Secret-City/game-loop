const WS_URL = 'ws://localhost:3000';

let socket = null;
const subscribers = new Set();
let connectionStatus = 'DISCONNECTED'; // 'DISCONNECTED', 'CONNECTING', 'CONNECTED', 'ERROR'

const connect = () => {
    if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
        return; // Already connected or connecting
    }

    socket = new WebSocket(WS_URL);
    connectionStatus = 'CONNECTING';
    notifySubscribers({ type: 'status', payload: connectionStatus });

    socket.onopen = () => {
        connectionStatus = 'CONNECTED';
        console.log('WebSocket connection established');
        notifySubscribers({ type: 'status', payload: connectionStatus });
    };

    socket.onmessage = (event) => {
        try {
            const message = JSON.parse(event.data.toString());
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
        // Optional: implement reconnection logic here
        // setTimeout(connect, 5000); // Attempt to reconnect after 5 seconds
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
connect();

export const websocketService = {
    connect,
    sendMessage,
    subscribe,
    getStatus: () => connectionStatus,
};
