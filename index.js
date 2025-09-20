const express = require('express');
const http = require('http');
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});

const helpers = new Map();

io.on('connection', (socket) => {
  console.log('A client connected:', socket.id);

  socket.on('helper-register', (helperId) => {
    console.log(`Helper registered: ${helperId} with socket ID: ${socket.id}`);
    helpers.set(helperId, socket);
    socket.emit('register-success', `Successfully registered as ${helperId}`);
    
    socket.on('disconnect', () => {
      console.log(`Helper ${helperId} disconnected.`);
      helpers.delete(helperId);
    });
  });

  socket.on('client-pair', (helperId) => {
    const helperSocket = helpers.get(helperId);
    if (helperSocket) {
      const room = `room-${helperId}`;
      socket.join(room);
      helperSocket.join(room);
      socket.emit('pair-success', `Paired with helper ${helperId}`);
      helperSocket.emit('pair-success', `Paired with client ${socket.id}`);
    } else {
      socket.emit('pair-fail', `Helper ${helperId} not found.`);
    }
  });

  socket.on('message-from-client', (data) => {
    const rooms = Array.from(socket.rooms);
    if (rooms.length > 1) {
      const privateRoom = rooms[1];
      socket.to(privateRoom).emit('message-to-client', data);
    }
  });

  socket.on('disconnect', () => {
    console.log('A client disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log(`Server listening on port ${PORT}`));