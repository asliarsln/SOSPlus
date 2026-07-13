const socket = io("http://localhost:3000");

const statusEl = document.getElementById("status");
const roomInfoEl = document.getElementById("roomInfo");
const errorMsgEl = document.getElementById("errorMsg");
const gridSlider = document.getElementById("gridSize");
const gridLabel = document.getElementById("gridValueLabel");
const gridLabel2 = document.getElementById("gridValueLabel2");

gridSlider.addEventListener("input", () => {
  gridLabel.textContent = gridSlider.value;
  gridLabel2.textContent = gridSlider.value;
});

socket.on("connect", () => {
  statusEl.textContent = "Sunucuya bağlandı! ID: " + socket.id;
});

socket.on("disconnect", () => {
  statusEl.textContent = "Bağlantı kesildi.";
});

document.getElementById("createBtn").addEventListener("click", () => {
  const gridSize = parseInt(gridSlider.value);
  socket.emit("createRoom", gridSize);
});

document.getElementById("joinBtn").addEventListener("click", () => {
  const code = document
    .getElementById("joinCodeInput")
    .value.toUpperCase()
    .trim();
  if (code) {
    socket.emit("joinRoom", code);
  }
});

socket.on("roomCreated", (room) => {
  errorMsgEl.textContent = "";
  roomInfoEl.textContent = `Oda kuruldu! Kod: ${room.code} (Grid: ${room.gridSize}x${room.gridSize}) — Arkadaşını davet et!`;
});

socket.on("playerJoined", (room) => {
  errorMsgEl.textContent = "";
  roomInfoEl.textContent = `Odaya katılan oyuncu sayısı: ${room.players.length}/${room.maxPlayers} — Oda: ${room.code}`;
});

socket.on("joinError", (message) => {
  errorMsgEl.textContent = message;
});
