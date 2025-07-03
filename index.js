import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import fs from 'fs';
import path from 'path';

const httpServer = createServer((req, res) => {
    // Serve static files (index.html, main.js, etc.)
    let filePath = '.' + req.url;
    if (filePath === './') {
        filePath = './index.html';
    }

    const extname = String(path.extname(filePath)).toLowerCase();
    const mimeTypes = {
        '.html': 'text/html',
        '.js': 'text/javascript',
        '.css': 'text/css',
        // Add other MIME types as needed
    };

    const contentType = mimeTypes[extname] || 'application/octet-stream';

    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code == 'ENOENT') {
                fs.readFile('./404.html', (error, content) => {
                    res.writeHead(404, { 'Content-Type': 'text/html' });
                    res.end(content, 'utf-8');
                });
            } else {
                res.writeHead(500);
                res.end('Sorry, check with the site admin for error: ' + error.code + ' ..\n');
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
});

const wss = new WebSocketServer({ server: httpServer });

wss.on('connection', (ws) => {
    console.log('[+] Client connected');

    ws.on('message', (message) => {
        console.log(`📡 Received message: ${message}`);
        // Assuming message is JSON like { type: 'drone_position', payload: { x, y } }
        // Broadcast to all connected clients
        wss.clients.forEach((client) => {
            if (client.readyState === ws.OPEN) {
                client.send(message.toString());
            }
        });
    });

    ws.on('close', () => {
        console.log('[-] Client disconnected');
    });

    ws.on('error', (error) => {
        console.error('WebSocket error:', error);
    });
});

const PORT = process.env.PORT || 3030;
httpServer.listen(PORT, () => {
    console.log(`🚀 HTTP and WebSocket server listening on port ${PORT}`);
});