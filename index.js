const express = require('express');
const http = require('http');
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});

// 介绍所的“登记表”
const helpers = new Map(); // 用来存放已连接的 Helper (Key: helperId, Value: socket)

io.on('connection', (socket) => {
  console.log('A client connected:', socket.id);

  // --- 新增：处理 Helper 的登记 ---
  socket.on('helper-register', (helperId) => {
    console.log(`Helper registered: ${helperId} with socket ID: ${socket.id}`);
    helpers.set(helperId, socket); // 把 Helper 登记在案

    // 告诉 Helper 它登记成功了
    socket.emit('register-success', `Successfully registered as ${helperId}`);
    
    socket.on('disconnect', () => {
      console.log(`Helper ${helperId} disconnected.`);
      helpers.delete(helperId); // Helper 离线了，从登记表移除
    });
  });

  // --- 新增：处理手机的配对请求 ---
  socket.on('client-pair', (helperId) => {
    const helperSocket = helpers.get(helperId);
    if (helperSocket) {
      console.log(`Pairing client ${socket.id} with helper ${helperId}`);
      // 核心逻辑：让它们互相加入一个“私人房间”
      const room = `room-${helperId}`;
      socket.join(room); // 手机加入房间
      helperSocket.join(room); // Helper 也加入同一个房间

      // 分别通知它们配对成功
      socket.emit('pair-success', `Paired with helper ${helperId}`);
      helperSocket.emit('pair-success', `Paired with client ${socket.id}`);
    } else {
      console.log(`Pairing failed: Helper ${helperId} not found.`);
      socket.emit('pair-fail', `Helper ${helperId} not found.`);
    }
  });

  // --- 改造：讯息发送逻辑 ---
  socket.on('message-from-client', (data) => {
    // 不再是广播，而是只在自己的“私人房间”里发送
    const rooms = Array.from(socket.rooms);
    if (rooms.length > 1) { // 检查是否已加入房间 (预设房间是 socket.id)
      const privateRoom = rooms[1];
      console.log(`Relaying message in room ${privateRoom}:`, data);
      socket.to(privateRoom).emit('message-to-client', data);
    }
  });

  socket.on('disconnect', () => {
    console.log('A client disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log(`Server listening on port ${PORT}`));