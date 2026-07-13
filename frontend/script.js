const socket = io("http://localhost:3000");

const statusEl = document.getElementById("status");
const roomInfoEl = document.getElementById("roomInfo");
const errorMsgEl = document.getElementById("errorMsg");
const gridSlider = document.getElementById("gridSize");
const gridLabel = document.getElementById("gridValueLabel");
const gridLabel2 = document.getElementById("gridValueLabel2");

let currentRoomCode = null;
let myGridSize = null;

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
  currentRoomCode = room.code;
  myGridSize = room.gridSize;
  roomInfoEl.textContent = `Oda kuruldu! Kod: ${room.code} — Arkadaşını davet et!`;
});

socket.on("playerJoined", (room) => {
  errorMsgEl.textContent = "";
  currentRoomCode = room.code;
  myGridSize = room.gridSize;
  roomInfoEl.textContent = `Oyuncu: ${room.players.length}/${room.maxPlayers} — Oda: ${room.code}`;
  if (room.started) {
    renderBoard(room.board, room.gridSize);
  }
});

socket.on("joinError", (message) => {
  errorMsgEl.textContent = message;
});

function renderBoard(board, size) {
  document.getElementById("lobby").style.display = "none";
  let gridDiv = document.getElementById("gameGrid");
  if (!gridDiv) {
    gridDiv = document.createElement("div");
    gridDiv.id = "gameGrid";
    document.body.appendChild(gridDiv);
  }
  gridDiv.style.gridTemplateColumns = `repeat(${size}, 50px)`;
  gridDiv.innerHTML = "";

  board.forEach((cell, index) => {
    const cellDiv = document.createElement("div");
    cellDiv.className = "cell";
    cellDiv.textContent = cell || "";
    cellDiv.addEventListener("click", (e) => openLetterMenu(e, index));
    gridDiv.appendChild(cellDiv);
  });
}

function openLetterMenu(event, index) {
  const existingMenu = document.getElementById("letterMenu");
  if (existingMenu) existingMenu.remove();

  const cell = event.target;
  if (cell.textContent !== "") return;

  const menu = document.createElement("div");
  menu.id = "letterMenu";
  menu.className = "letter-menu";

  const btnS = document.createElement("button");
  btnS.textContent = "S";
  btnS.onclick = () => sendMove(index, "S");

  const btnO = document.createElement("button");
  btnO.textContent = "O";
  btnO.onclick = () => sendMove(index, "O");

  menu.appendChild(btnS);
  menu.appendChild(btnO);

  const rect = cell.getBoundingClientRect();
  menu.style.position = "absolute";
  menu.style.left = rect.left + "px";
  menu.style.top = rect.top - 45 + "px";

  document.body.appendChild(menu);
}

function sendMove(index, letter) {
  socket.emit("makeMove", { code: currentRoomCode, index, letter });
  document.getElementById("letterMenu")?.remove();
}

socket.on("moveMade", ({ board, turn, scores, gameOver }) => {
  renderBoard(board, myGridSize);
  if (gameOver) {
    alert("Oyun bitti! Skorlar: " + JSON.stringify(scores));
  }
});
