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
    createdAt: Date.now(),
  };
  return rooms[code];
}

function joinRoom(code, socketId) {
  const room = rooms[code];
  if (!room) return { error: "Room Not Found" };
  if (room.players.length >= room.maxPlayers) return { error: "Room Full" };
  if (room.started) return { error: "Game Already Started" };
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
    if (room.players.includes(socketId)) {
      room.players = room.players.filter((id) => id !== socketId);
      if (room.players.length === 0) {
        delete rooms[code];
      } else {
        room.started = false;
      }
      return { code, room: rooms[code] || null };
    }
  }
  return null;
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
  let bonusPoints = 0;
  let sosCells = [];

  function getIndex(r, c) {
    if (r < 0 || r >= size || c < 0 || c >= size) return null;
    return r * size + c;
  }

  function getCell(r, c) {
    const idx = getIndex(r, c);
    return idx === null ? null : board[idx];
  }

  const placedCell = board[index];
  const placedLetter = placedCell ? placedCell.letter : null;

  function calcPoints(idx1, idx2, idx3) {
    const c1 = board[idx1];
    const c2 = board[idx2];
    const c3 = board[idx3];
    const sameOwner =
      c1.playerId === c2.playerId && c2.playerId === c3.playerId;
    return sameOwner ? 3 : 1;
  }

  for (const [dr, dc] of directions) {
    if (placedLetter === "O") {
      const idxBefore = getIndex(row - dr, col - dc);
      const idxAfter = getIndex(row + dr, col + dc);
      const before = getCell(row - dr, col - dc);
      const after = getCell(row + dr, col + dc);
      if (before?.letter === "S" && after?.letter === "S") {
        foundCount++;
        bonusPoints += calcPoints(idxBefore, index, idxAfter);
        sosCells.push(idxBefore, index, idxAfter);
      }
    }

    if (placedLetter === "S") {
      const idxMid = getIndex(row + dr, col + dc);
      const idxEnd = getIndex(row + 2 * dr, col + 2 * dc);
      const mid = getCell(row + dr, col + dc);
      const end = getCell(row + 2 * dr, col + 2 * dc);
      if (mid?.letter === "O" && end?.letter === "S") {
        foundCount++;
        bonusPoints += calcPoints(index, idxMid, idxEnd);
        sosCells.push(index, idxMid, idxEnd);
      }
    }
  }

  return { count: foundCount, points: bonusPoints, cells: sosCells };
}

function resetRoom(code) {
  const room = rooms[code];
  if (!room) return null;
  room.board = Array(room.gridSize * room.gridSize).fill(null);
  room.scores = {};
  room.players.forEach((id) => (room.scores[id] = 0));
  room.turn = room.players[0];
  return room;
}

function cleanupOldRooms() {
  const now = Date.now();
  const THIRTY_MINUTES = 30 * 60 * 1000;
  for (const code in rooms) {
    if (now - rooms[code].createdAt > THIRTY_MINUTES) {
      delete rooms[code];
    }
  }
}

setInterval(cleanupOldRooms, 10 * 60 * 1000);

module.exports = {
  createRoom,
  joinRoom,
  getRoom,
  removePlayer,
  checkSOS,
  resetRoom,
};
