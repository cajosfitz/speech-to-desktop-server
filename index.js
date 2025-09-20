const express = require('express');
const http = require('http');
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // 允许任何来源
    methods: ["GET", "POST"]
  }
});

io.on('connection', (socket) => {
  console.log('A client connected:', socket.id);
  socket.on('message-from-client', (data) => {
    console.log(`Received message from ${socket.id}:`, data);
    socket.broadcast.emit('message-to-client', data);
  });
  socket.on('disconnect', () => {
    console.log('A client disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log(`Server listening on port ${PORT}`));