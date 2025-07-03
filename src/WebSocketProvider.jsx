import { createContext, useContext, useEffect } from 'react';
import * as ws from './websocketService';

const WSContext = createContext(ws);

export const WebSocketProvider = ({ children }) => {
    useEffect(() => {
        ws.connect();
        return () => ws.disconnect();
    }, []);

    return (
        <WSContext.Provider value={ws}>
            {children}
        </WSContext.Provider>
    );
};

export const useWS = () => useContext(WSContext);