const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const { createRoom, joinRoom, getRoom, removePlayer } = require("./gameStore");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

const PORT = 3000;

app.get("/", (req, res) => {
  res.send("SOS oyunu sunucusu çalışıyor!");
});

io.on("connection", (socket) => {
  console.log("Yeni bir oyuncu bağlandı:", socket.id);

  socket.on("createRoom", (gridSize) => {
    const room = createRoom(socket.id, gridSize);
    socket.join(room.code);
    socket.emit("roomCreated", room);
  });

  socket.on("joinRoom", (code) => {
    const result = joinRoom(code, socket.id);
    if (result.error) {
      socket.emit("joinError", result.error);
      return;
    }
    socket.join(code);
    io.to(code).emit("playerJoined", result.room);
  });

  socket.on("disconnect", () => {
    console.log("Oyuncu ayrıldı:", socket.id);
    removePlayer(socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`Sunucu ${PORT} portunda çalışıyor`);
});
