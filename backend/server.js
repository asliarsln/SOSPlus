const express = require("express");
const http = require("http");
const path = require("path");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

app.use(express.static(path.join(__dirname, "../frontend")));

const rooms = {};

function generateRoomCode() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let code;
  do {
    code = Array.from(
      { length: 4 },
      () => chars[Math.floor(Math.random() * chars.length)],
    ).join("");
  } while (rooms[code]);
  return code;
}

function createsSOS(board, size, idx, letter) {
  const testBoard = [...board];
  testBoard[idx] = { letter, playerId: null };
  const r = Math.floor(idx / size);
  const c = idx % size;
  const dirs = [
    [0, 1],
    [1, 0],
    [1, 1],
    [1, -1],
  ];

  const get = (rr, cc) => {
    if (rr >= 0 && rr < size && cc >= 0 && cc < size) {
      const cell = testBoard[rr * size + cc];
      return cell ? cell.letter : null;
    }
    return null;
  };

  for (const [dr, dc] of dirs) {
    for (let start = -2; start <= 0; start++) {
      const positions = [0, 1, 2].map((k) => [
        r + dr * (start + k),
        c + dc * (start + k),
      ]);
      const valid = positions.every(
        ([rr, cc]) => rr >= 0 && rr < size && cc >= 0 && cc < size,
      );
      if (!valid) continue;
      const letters = positions.map(([rr, cc]) => get(rr, cc));
      if (letters[0] === "S" && letters[1] === "O" && letters[2] === "S") {
        return true;
      }
    }
  }
  return false;
}

function placeNeutralLetters(size, confidence) {
  const total = size * size;
  const board = new Array(total).fill(null);
  let placed = 0;
  let attempts = 0;

  while (placed < confidence && attempts < 500) {
    const idx = Math.floor(Math.random() * total);
    if (board[idx] === null) {
      const letter = Math.random() < 0.5 ? "S" : "O";
      if (!createsSOS(board, size, idx, letter)) {
        board[idx] = { letter, playerId: null };
        placed++;
      }
    }
    attempts++;
  }
  return board;
}

function checkSOS(board, size, idx) {
  const r = Math.floor(idx / size);
  const c = idx % size;
  const dirs = [
    [0, 1],
    [1, 0],
    [1, 1],
    [1, -1],
  ];

  const get = (rr, cc) => {
    if (rr >= 0 && rr < size && cc >= 0 && cc < size) {
      const cell = board[rr * size + cc];
      return cell ? cell.letter : null;
    }
    return null;
  };

  const getIdx = (rr, cc) => rr * size + cc;
  let sosCount = 0;
  const sosCells = [];

  for (const [dr, dc] of dirs) {
    for (let start = -2; start <= 0; start++) {
      const positions = [0, 1, 2].map((k) => [
        r + dr * (start + k),
        c + dc * (start + k),
      ]);
      const valid = positions.every(
        ([rr, cc]) => rr >= 0 && rr < size && cc >= 0 && cc < size,
      );
      if (!valid) continue;

      const letters = positions.map(([rr, cc]) => get(rr, cc));
      if (letters[0] === "S" && letters[1] === "O" && letters[2] === "S") {
        const indices = positions.map(([rr, cc]) => getIdx(rr, cc));
        if (indices.includes(idx)) {
          sosCount++;
          sosCells.push(...indices);
        }
      }
    }
  }

  return { sosCount, sosCells: [...new Set(sosCells)] };
}

function checkGameOver(board) {
  return board.every((cell) => cell !== null);
}

io.on("connection", (socket) => {
  socket.on("createRoom", ({ gridSize, confidence }) => {
    const code = generateRoomCode();
    const board = placeNeutralLetters(gridSize, confidence || 0);

    rooms[code] = {
      code,
      gridSize,
      board,
      players: [socket.id],
      maxPlayers: 2,
      started: false,
      turn: null,
      scores: { [socket.id]: 0 },
      changesLeft: { [socket.id]: 1 },
      lastActivity: Date.now(),
    };

    socket.join(code);
    socket.emit("roomCreated", rooms[code]);
  });

  socket.on("joinRoom", (code) => {
    const room = rooms[code];

    if (!room) {
      socket.emit("joinError", "Room Not Found");
      return;
    }
    if (room.players.length >= room.maxPlayers) {
      socket.emit("joinError", "Room Full");
      return;
    }

    room.players.push(socket.id);
    room.scores[socket.id] = 0;
    room.changesLeft[socket.id] = 1;
    room.lastActivity = Date.now();

    socket.join(code);

    if (room.players.length === room.maxPlayers) {
      room.started = true;
      room.turn = room.players[0];
    }

    io.to(code).emit("playerJoined", room);
  });

  socket.on("makeMove", ({ code, index, letter }) => {
    const room = rooms[code];
    if (!room || !room.started) return;
    if (room.turn !== socket.id) return;
    if (room.board[index] !== null) return;

    room.board[index] = { letter, playerId: socket.id };
    room.lastActivity = Date.now();

    const { sosCount, sosCells } = checkSOS(room.board, room.gridSize, index);
    if (sosCount > 0) {
      room.scores[socket.id] += sosCount;
    }

    const gameOver = checkGameOver(room.board);

    if (!gameOver) {
      if (sosCount > 0) {
        room.turn = socket.id;
      } else {
        const otherPlayer = room.players.find((id) => id !== socket.id);
        room.turn = otherPlayer;
      }
    }

    io.to(code).emit("moveMade", {
      board: room.board,
      turn: room.turn,
      scores: room.scores,
      gameOver,
      sosCells,
    });
  });

  socket.on("changeLetter", ({ code, index }) => {
    const room = rooms[code];
    if (!room || !room.started) return;
    if (!room.changesLeft[socket.id] || room.changesLeft[socket.id] <= 0)
      return;

    const cell = room.board[index];
    if (!cell) return;

    const newLetter = cell.letter === "S" ? "O" : "S";
    room.board[index] = { letter: newLetter, playerId: cell.playerId };
    room.changesLeft[socket.id] -= 1;
    room.lastActivity = Date.now();

    const { sosCount, sosCells } = checkSOS(room.board, room.gridSize, index);
    if (sosCount > 0) {
      room.scores[socket.id] += sosCount;
    }

    const gameOver = checkGameOver(room.board);

    io.to(code).emit("moveMade", {
      board: room.board,
      turn: room.turn,
      scores: room.scores,
      gameOver,
      sosCells,
    });
    io.to(code).emit("changesUpdated", room.changesLeft);
  });

  socket.on("rematchRequest", (code) => {
    const room = rooms[code];
    if (!room) return;
    const otherPlayer = room.players.find((id) => id !== socket.id);
    if (otherPlayer) {
      io.to(otherPlayer).emit("rematchOffer");
    }
  });

  socket.on("rematchAccept", (code) => {
    const room = rooms[code];
    if (!room) return;

    room.board = placeNeutralLetters(room.gridSize, 0);
    room.scores = {};
    room.changesLeft = {};
    room.players.forEach((id) => {
      room.scores[id] = 0;
      room.changesLeft[id] = 1;
    });
    room.turn = room.players[0];
    room.started = true;
    room.lastActivity = Date.now();

    io.to(code).emit("rematchStarted", room);
  });

  socket.on("rematchDecline", (code) => {
    const room = rooms[code];
    if (!room) return;
    const otherPlayer = room.players.find((id) => id !== socket.id);
    if (otherPlayer) {
      io.to(otherPlayer).emit("rematchDeclined");
    }
  });

  socket.on("disconnect", () => {
    for (const code in rooms) {
      const room = rooms[code];
      if (room.players.includes(socket.id)) {
        const otherPlayer = room.players.find((id) => id !== socket.id);
        if (otherPlayer) {
          io.to(otherPlayer).emit("opponentLeft");
        }
        delete rooms[code];
        break;
      }
    }
  });
});

setInterval(
  () => {
    const now = Date.now();
    for (const code in rooms) {
      if (now - rooms[code].lastActivity > 30 * 60 * 1000) {
        delete rooms[code];
      }
    }
  },
  5 * 60 * 1000,
);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}.`);
});
