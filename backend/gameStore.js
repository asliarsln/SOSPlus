const rooms = {};

function generateRoomCode() {
  let code;
  do {
    code = Math.random().toString(36).substring(2, 6).toUpperCase();
  } while (rooms[code]);
  return code;
}

function createRoom(hostSocketId, gridSize) {
  const code = generateRoomCode();
  const board = Array(gridSize * gridSize).fill(null);
  rooms[code] = {
    code,
    gridSize,
    players: [hostSocketId],
    maxPlayers: 2,
    started: false,
    board,
    turn: hostSocketId,
    scores: {},
  };
  return rooms[code];
}

function joinRoom(code, socketId) {
  const room = rooms[code];
  if (!room) return { error: "Oda bulunamadı" };
  if (room.players.length >= room.maxPlayers) return { error: "Oda dolu" };
  if (room.started) return { error: "Oyun zaten başladı" };
  room.players.push(socketId);
  room.scores[socketId] = 0;
  room.scores[room.players[0]] = room.scores[room.players[0]] || 0;
  if (room.players.length === room.maxPlayers) {
    room.started = true;
  }
  return { room };
}

function getRoom(code) {
  return rooms[code];
}

function removePlayer(socketId) {
  for (const code in rooms) {
    const room = rooms[code];
    room.players = room.players.filter((id) => id !== socketId);
    if (room.players.length === 0) delete rooms[code];
  }
}

function checkSOS(board, size, index) {
  const row = Math.floor(index / size);
  const col = index % size;
  const directions = [
    [0, 1],
    [0, -1],
    [1, 0],
    [-1, 0],
    [1, 1],
    [1, -1],
    [-1, 1],
    [-1, -1],
  ];

  let foundCount = 0;

  function getCell(r, c) {
    if (r < 0 || r >= size || c < 0 || c >= size) return null;
    return board[r * size + c];
  }

  for (const [dr, dc] of directions) {
    const pattern = [
      getCell(row - dr, col - dc),
      getCell(row, col),
      getCell(row + dr, col + dc),
    ];
    if (pattern[0] === "S" && pattern[1] === "O" && pattern[2] === "S") {
      foundCount++;
    }
  }

  return foundCount;
}

module.exports = { createRoom, joinRoom, getRoom, removePlayer, checkSOS };
