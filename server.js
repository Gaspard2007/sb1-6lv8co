import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*', // In production, replace with your client's URL
    methods: ['GET', 'POST']
  }
});

const connectedUsers = new Set();

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);
  connectedUsers.add(socket.id);

  // Broadcast to all clients that a new user has joined
  io.emit('userJoined', { userId: socket.id, totalUsers: connectedUsers.size });

  // Handle user movement
  socket.on('updatePosition', (position) => {
    socket.broadcast.emit('userMoved', { userId: socket.id, position });
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    connectedUsers.delete(socket.id);
    io.emit('userLeft', { userId: socket.id, totalUsers: connectedUsers.size });
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Socket.IO server running on port ${PORT}`);
});