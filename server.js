const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

//Message

io.of("/default").on("connection", (socket) => {
  console.log("Default chat - connected:", socket.id);

  socket.on("joinRoom", (roomId) => {
    socket.join(roomId);
    console.log(`Default chat - ${socket.id} joined room ${roomId}`);
  });

  socket.on("sendMessage", (data) => {
    const roomId = data.chatGroupId;
    io.of("/default").to(roomId).emit("receiveMessage", data);
  });

  socket.on("disconnect", () => {
    console.log("Default chat - disconnected:", socket.id);
  });
});

io.of("/agent").on("connection", (socket) => {
  console.log("Agent chat - connected:", socket.id);

  socket.on("joinRoom", (roomId) => {
    socket.join(roomId);
    console.log(`Agent chat - ${socket.id} joined room ${roomId}`);
  });

  socket.on("sendMessage", (data) => {
    const roomId = data.chatGroupId;
    io.of("/agent").to(roomId).emit("receiveMessage", data);
  });

  socket.on("disconnect", () => {
    console.log("Agent chat - disconnected:", socket.id);
  });
});

server.listen(process.env.PORT || 3000, () => {
  console.log("Server running");
});
