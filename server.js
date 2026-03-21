const express = require('express');
const http = require('http');
const { WebSocketServer } = require('ws');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Create a new room
app.get('/api/create-room', (req, res) => {
  const roomId = uuidv4().slice(0, 8);
  res.json({ roomId });
});

// Redirect room URLs to the app
app.get('/room/:roomId', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Room management
const rooms = new Map();

wss.on('connection', (ws) => {
  let currentRoom = null;
  let userId = uuidv4().slice(0, 6);
  let userRole = null; // 'host' or 'guest'

  ws.on('message', (data) => {
    try {
      const msg = JSON.parse(data);

      switch (msg.type) {
        case 'join-room': {
          const { roomId, role, name } = msg;
          currentRoom = roomId;
          userRole = role;

          if (!rooms.has(roomId)) {
            rooms.set(roomId, new Map());
          }

          const room = rooms.get(roomId);

          // Max 2 people per room
          if (room.size >= 2) {
            ws.send(JSON.stringify({ type: 'error', message: 'Кімната вже заповнена' }));
            return;
          }

          room.set(userId, { ws, role, name: name || (role === 'host' ? 'Хост' : 'Гість') });

          ws.send(JSON.stringify({
            type: 'joined',
            userId,
            role,
            participants: Array.from(room.values()).map(p => ({ role: p.role, name: p.name }))
          }));

          // Notify others in room
          room.forEach((peer, peerId) => {
            if (peerId !== userId) {
              peer.ws.send(JSON.stringify({
                type: 'peer-joined',
                peerId: userId,
                peerRole: role,
                peerName: name || (role === 'host' ? 'Хост' : 'Гість')
              }));
            }
          });

          console.log(`[${roomId}] ${role} joined (${room.size}/2)`);
          break;
        }

        case 'offer':
        case 'answer':
        case 'ice-candidate':
        case 'screen-stream':
        case 'volume': {
          // Forward WebRTC signaling to the other peer
          if (currentRoom && rooms.has(currentRoom)) {
            const room = rooms.get(currentRoom);
            room.forEach((peer, peerId) => {
              if (peerId !== userId) {
                peer.ws.send(JSON.stringify({
                  ...msg,
                  from: userId
                }));
              }
            });
          }
          break;
        }

        case 'chat': {
          if (currentRoom && rooms.has(currentRoom)) {
            const room = rooms.get(currentRoom);
            const sender = room.get(userId);
            room.forEach((peer, peerId) => {
              if (peerId !== userId) {
                peer.ws.send(JSON.stringify({
                  type: 'chat',
                  message: msg.message,
                  from: sender?.name || 'Анонім'
                }));
              }
            });
          }
          break;
        }
      }
    } catch (e) {
      console.error('Message parse error:', e);
    }
  });

  ws.on('close', () => {
    if (currentRoom && rooms.has(currentRoom)) {
      const room = rooms.get(currentRoom);
      const user = room.get(userId);
      room.delete(userId);

      // Notify remaining participants
      room.forEach((peer) => {
        peer.ws.send(JSON.stringify({
          type: 'peer-left',
          peerId: userId,
          peerRole: userRole
        }));
      });

      // Clean up empty rooms
      if (room.size === 0) {
        rooms.delete(currentRoom);
        console.log(`[${currentRoom}] Room deleted (empty)`);
      }
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🎬 Watch Together running on port ${PORT}`);
});
