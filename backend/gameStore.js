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
  rooms[code] = {
    code,
    gridSize,
    players: [hostSocketId],
    maxPlayers: 2,
    started: false,
    board: null,
    turn: null,
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

module.exports = { createRoom, joinRoom, getRoom, removePlayer };
