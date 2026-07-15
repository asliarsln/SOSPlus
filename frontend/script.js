const socket = io("http://localhost:3000");

const roomInfoEl = document.getElementById("roomInfo");
const errorMsgEl = document.getElementById("errorMsg");
const gridSlider = document.getElementById("gridSize");
const gridLabel = document.getElementById("gridValueLabel");
const gridLabel2 = document.getElementById("gridValueLabel2");
const confidenceSlider = document.getElementById("confidenceSlider");
const confidenceLabel = document.getElementById("confidenceLabel");

let currentTurn = null;
let currentRoomCode = null;
let myGridSize = null;
let myPlayerId = null;
let changeMode = false;
let myChangesLeft = 1;

gridSlider.addEventListener("input", () => {
  gridLabel.textContent = gridSlider.value;
  gridLabel2.textContent = gridSlider.value;
});

confidenceSlider.addEventListener("input", () => {
  confidenceLabel.textContent = confidenceSlider.value;
});

socket.on("connect", () => {
  myPlayerId = socket.id;
});

socket.on("disconnect", () => {
  console.log("Disconnected from server");
});

document.getElementById("createBtn").addEventListener("click", () => {
  const gridSize = parseInt(gridSlider.value);
  const confidence = parseInt(confidenceSlider.value);
  socket.emit("createRoom", { gridSize, confidence });
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
  roomInfoEl.textContent = `Room created! Code: ${room.code} — Invite a friend!`;
  updateChangeBadge(room.changesLeft);
});

socket.on("playerJoined", (room) => {
  errorMsgEl.textContent = "";
  currentRoomCode = room.code;
  myGridSize = room.gridSize;
  roomInfoEl.textContent = `Player: ${room.players.length}/${room.maxPlayers} — Room: ${room.code}`;
  updateChangeBadge(room.changesLeft);
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

socket.on("changesUpdated", (changesLeft) => {
  updateChangeBadge(changesLeft);
});

function updateChangeBadge(changesLeft) {
  myChangesLeft = changesLeft[myPlayerId] ?? 0;
  document.getElementById("changeBadge").textContent = myChangesLeft;
}

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
    if (cell) {
      cellDiv.textContent = cell.letter;
      if (cell.playerId === null) {
        cellDiv.classList.add("neutral-letter");
      } else {
        cellDiv.classList.add(
          cell.playerId === myPlayerId ? "my-letter" : "opponent-letter",
        );
      }
    }
    cellDiv.addEventListener("click", (e) => {
      if (changeMode) {
        handleChangeClick(index);
      } else {
        openLetterMenu(e, index);
      }
    });
    gridDiv.appendChild(cellDiv);
  });
}

function updateGameInfo(turn, scores) {
  currentTurn = turn;
  const turnIndicator = document.getElementById("turnIndicator");
  const scoreBoard = document.getElementById("scoreBoard");

  if (turn === myPlayerId) {
    turnIndicator.textContent = "🟢 Your turn!";
    turnIndicator.style.color = "limegreen";
  } else {
    turnIndicator.textContent = "⏳ Opponent's turn...";
    turnIndicator.style.color = "gray";
  }

  scoreBoard.innerHTML = "";
  for (const playerId in scores) {
    const label = playerId === myPlayerId ? "You" : "Opponent";
    const scoreLine = document.createElement("p");
    scoreLine.textContent = `${label}: ${scores[playerId]} points`;
    scoreBoard.appendChild(scoreLine);
  }
}

function showGameOver(scores) {
  const turnIndicator = document.getElementById("turnIndicator");
  const myScore = scores[myPlayerId] || 0;
  const otherPlayerId = Object.keys(scores).find((id) => id !== myPlayerId);
  const otherScore = scores[otherPlayerId] || 0;

  let resultText;
  if (myScore > otherScore) resultText = "🎉 You Won!";
  else if (myScore < otherScore) resultText = "😔 You Lost.";
  else resultText = "🤝 It's a Draw!";

  turnIndicator.textContent = `Game Over — ${resultText}`;
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

function handleChangeClick(index) {
  const cellDiv = document.querySelectorAll("#gameGrid .cell")[index];
  if (cellDiv.textContent === "") return;
  socket.emit("changeLetter", { code: currentRoomCode, index });
  changeMode = false;
  document.getElementById("changeBtn").classList.remove("active-change");
}

document.getElementById("changeBtn").addEventListener("click", () => {
  if (myChangesLeft <= 0) return;
  changeMode = !changeMode;
  document
    .getElementById("changeBtn")
    .classList.toggle("active-change", changeMode);
});

document.getElementById("rematchBtn").addEventListener("click", () => {
  socket.emit("rematchRequest", currentRoomCode);
  document.getElementById("rematchBtn").style.display = "none";
  document.getElementById("turnIndicator").textContent =
    "Rematch request sent, waiting for opponent's response...";
});

socket.on("rematchOffer", () => {
  const turnIndicator = document.getElementById("turnIndicator");
  turnIndicator.innerHTML = `
    Opponent wants a rematch!
    <button id="acceptRematchBtn">Accept</button>
    <button id="declineRematchBtn">Decline</button>
  `;

  document.getElementById("acceptRematchBtn").onclick = () => {
    socket.emit("rematchAccept", currentRoomCode);
  };

  document.getElementById("declineRematchBtn").onclick = () => {
    socket.emit("rematchDecline", currentRoomCode);
    turnIndicator.textContent = "Rematch declined.";
  };
});

socket.on("rematchStarted", (room) => {
  updateGameInfo(room.turn, room.scores);
  renderBoard(room.board, room.gridSize);
  updateChangeBadge(room.changesLeft);
});

socket.on("rematchDeclined", () => {
  document.getElementById("turnIndicator").textContent =
    "Opponent declined the rematch.";
  document.getElementById("rematchBtn").style.display = "inline-block";
});

socket.on("opponentLeft", () => {
  const turnIndicator = document.getElementById("turnIndicator");
  turnIndicator.textContent = "⚠️ Opponent's connection lost.";
  turnIndicator.style.color = "red";
  document.getElementById("rematchBtn").style.display = "none";
  document.getElementById("mainMenuBtn").style.display = "inline-block";

  const gridDiv = document.getElementById("gameGrid");
  if (gridDiv) {
    gridDiv.querySelectorAll(".cell").forEach((cell) => {
      cell.classList.add("cell-disabled");
    });
  }
});

document.getElementById("mainMenuBtn").addEventListener("click", () => {
  resetToLobby();
});

function resetToLobby() {
  currentRoomCode = null;
  myGridSize = null;
  currentTurn = null;
  changeMode = false;

  document.getElementById("gameInfo").style.display = "none";
  document.getElementById("rematchBtn").style.display = "none";
  document.getElementById("mainMenuBtn").style.display = "none";

  const gridDiv = document.getElementById("gameGrid");
  if (gridDiv) gridDiv.remove();

  document.getElementById("lobby").style.display = "block";
  roomInfoEl.textContent = "";
  errorMsgEl.textContent = "";
  document.getElementById("joinCodeInput").value = "";
}
