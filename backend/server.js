const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const {
  createRoom,
  joinRoom,
  getRoom,
  removePlayer,
  checkSOS,
  resetRoom,
} = require("./gameStore");

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

  socket.on("makeMove", ({ code, index, letter }) => {
    const room = getRoom(code);
    if (!room) return;
    if (room.turn !== socket.id) return;
    if (room.board[index] !== null) return;

    room.board[index] = letter;
    const result = checkSOS(room.board, room.gridSize, index);

    if (result.count > 0) {
      room.scores[socket.id] = (room.scores[socket.id] || 0) + result.count;
    } else {
      const otherPlayer = room.players.find((id) => id !== socket.id);
      room.turn = otherPlayer;
    }

    const isFull = room.board.every((cell) => cell !== null);

    io.to(code).emit("moveMade", {
      board: room.board,
      turn: room.turn,
      scores: room.scores,
      gameOver: isFull,
      sosCells: result.cells,
    });
  });

  socket.on("rematchRequest", (code) => {
    const room = getRoom(code);
    if (!room) return;
    socket.to(code).emit("rematchOffer", { fromId: socket.id });
  });

  socket.on("rematchAccept", (code) => {
    const room = resetRoom(code);
    if (!room) return;
    io.to(code).emit("rematchStarted", room);
  });

  socket.on("rematchDecline", (code) => {
    socket.to(code).emit("rematchDeclined");
  });

  socket.on("disconnect", () => {
    console.log("Oyuncu ayrıldı:", socket.id);
    const result = removePlayer(socket.id);
    if (result && result.room) {
      io.to(result.code).emit("opponentLeft");
    }
  });
});

server.listen(PORT, () => {
  console.log(`Sunucu ${PORT} portunda çalışıyor`);
});
