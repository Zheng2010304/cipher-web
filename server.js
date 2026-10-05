const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// In-memory storage for all users' results
const allResults = [];

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Send existing results to new user
  socket.emit('init', allResults);

  // When a user decodes a code
  socket.on('decode', (data) => {
    const entry = {
      id: Date.now() + Math.random(),
      user: data.user || 'Anonymous',
      code: data.code,
      result: data.result,
      timestamp: new Date().toISOString()
    };
    allResults.push(entry);

    // Broadcast to ALL users (including sender)
    io.emit('newResult', entry);
  });

  // When a user clears their session
  socket.on('clearLine', (data) => {
    const entry = {
      id: Date.now() + Math.random(),
      user: data.user || 'Anonymous',
      code: '[CLEAR]',
      result: '--- 开始新的一行 ---',
      timestamp: new Date().toISOString()
    };
    allResults.push(entry);
    io.emit('newResult', entry);
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log(`Open this URL in any browser to use the app`);
});
