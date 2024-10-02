const express = require('express');
const http = require('http');
const WebSocket = require('ws');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });


app.use(express.json());

// WebSocket connection to receive notifications
wss.on('connection', (ws) => {
    console.log('Client connected');

    // Listen for messages from the client if needed
    ws.on('message', (message) => {
        const messageString = message.toString();

        console.log('Notification:', messageString);
    });

});

server.listen(9303, () => {
  console.log('User service running on port 9303');
});
