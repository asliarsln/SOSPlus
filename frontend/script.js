const socket = io("http://localhost:3000");

const statusEl = document.getElementById("status");
const roomInfoEl = document.getElementById("roomInfo");
const errorMsgEl = document.getElementById("errorMsg");
const gridSlider = document.getElementById("gridSize");
const gridLabel = document.getElementById("gridValueLabel");
const gridLabel2 = document.getElementById("gridValueLabel2");

let currentTurn = null;
let currentRoomCode = null;
let myGridSize = null;
let myPlayerId = null;

gridSlider.addEventListener("input", () => {
  gridLabel.textContent = gridSlider.value;
  gridLabel2.textContent = gridSlider.value;
});

socket.on("connect", () => {
  statusEl.textContent = "Sunucuya bağlandı! ID: " + socket.id;
  myPlayerId = socket.id;
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
    updateGameInfo(room.turn, room.scores);
    renderBoard(room.board, room.gridSize);
  }
});

socket.on("joinError", (message) => {
  errorMsgEl.textContent = message;
});

socket.on("moveMade", ({ board, turn, scores, gameOver, sosCells }) => {
  updateGameInfo(turn, scores);
  renderBoard(board, myGridSize, sosCells);
  if (gameOver) {
    showGameOver(scores);
  }
});

function renderBoard(board, size, sosCells = []) {
  document.getElementById("lobby").style.display = "none";
  document.getElementById("gameInfo").style.display = "block";

  let gridDiv = document.getElementById("gameGrid");
  if (!gridDiv) {
    gridDiv = document.createElement("div");
    gridDiv.id = "gameGrid";
    document.body.appendChild(gridDiv);
  }
  gridDiv.style.gridTemplateColumns = `repeat(${size}, 50px)`;
  gridDiv.innerHTML = "";

  const isMyTurn = currentTurn === myPlayerId;

  board.forEach((cell, index) => {
    const cellDiv = document.createElement("div");
    cellDiv.className = "cell";
    if (sosCells.includes(index)) {
      cellDiv.classList.add("sos-highlight");
    }
    if (!isMyTurn) {
      cellDiv.classList.add("cell-disabled");
    }
    cellDiv.textContent = cell || "";
    cellDiv.addEventListener("click", (e) => openLetterMenu(e, index));
    gridDiv.appendChild(cellDiv);
  });
}

function updateGameInfo(turn, scores) {
  currentTurn = turn;
  const turnIndicator = document.getElementById("turnIndicator");
  const scoreBoard = document.getElementById("scoreBoard");

  if (turn === myPlayerId) {
    turnIndicator.textContent = "🟢 Sıra sende!";
    turnIndicator.style.color = "limegreen";
  } else {
    turnIndicator.textContent = "⏳ Rakibin sırası...";
    turnIndicator.style.color = "gray";
  }

  scoreBoard.innerHTML = "";
  for (const playerId in scores) {
    const label = playerId === myPlayerId ? "Sen" : "Rakip";
    const scoreLine = document.createElement("p");
    scoreLine.textContent = `${label}: ${scores[playerId]} puan`;
    scoreBoard.appendChild(scoreLine);
  }
}

function showGameOver(scores) {
  const turnIndicator = document.getElementById("turnIndicator");
  const myScore = scores[myPlayerId] || 0;
  const otherPlayerId = Object.keys(scores).find((id) => id !== myPlayerId);
  const otherScore = scores[otherPlayerId] || 0;

  let resultText;
  if (myScore > otherScore) resultText = "🎉 Kazandın!";
  else if (myScore < otherScore) resultText = "😔 Kaybettin.";
  else resultText = "🤝 Berabere!";

  turnIndicator.textContent = `Oyun bitti — ${resultText}`;
  turnIndicator.style.color = "orange";

  document.getElementById("rematchBtn").style.display = "inline-block";
}

function openLetterMenu(event, index) {
  const existingMenu = document.getElementById("letterMenu");
  if (existingMenu) existingMenu.remove();

  if (currentTurn !== myPlayerId) {
    return;
  }

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

document.getElementById("rematchBtn").addEventListener("click", () => {
  socket.emit("rematchRequest", currentRoomCode);
  document.getElementById("rematchBtn").style.display = "none";
  document.getElementById("turnIndicator").textContent =
    "Rakibin onayı bekleniyor...";
});

socket.on("rematchOffer", () => {
  const turnIndicator = document.getElementById("turnIndicator");
  turnIndicator.innerHTML = `
    Rakibin tekrar oynamak istiyor!
    <button id="acceptRematchBtn">Kabul Et</button>
    <button id="declineRematchBtn">Reddet</button>
  `;

  document.getElementById("acceptRematchBtn").onclick = () => {
    socket.emit("rematchAccept", currentRoomCode);
  };

  document.getElementById("declineRematchBtn").onclick = () => {
    socket.emit("rematchDecline", currentRoomCode);
    turnIndicator.textContent = "Rövanş reddedildi.";
  };
});

socket.on("rematchStarted", (room) => {
  updateGameInfo(room.turn, room.scores);
  renderBoard(room.board, room.gridSize);
});

socket.on("rematchDeclined", () => {
  document.getElementById("turnIndicator").textContent =
    "Rakip rövanşı reddetti.";
  document.getElementById("rematchBtn").style.display = "inline-block";
});
