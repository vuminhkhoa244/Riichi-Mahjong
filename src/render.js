import { state } from "./state.js";
import { getHumanPlayer, isHumanTurn, selectTile, sortHand } from "./game.js";
import { createTileSvg, createBackTileSvg } from "./tiles.js";
import { analyzeHand } from "./analysis.js";

export function render() {
  const handEl = document.getElementById("hand");
  const discardEl = document.getElementById("discard");
  const wallEl = document.getElementById("wall");
  const discardCountEl = document.getElementById("discard-count");
  const wallCountEl = document.getElementById("wall-count");
  const riichiStateEl = document.getElementById("riichi-state");
  const turnLabelEl = document.getElementById("turn-label");
  const phaseLabelEl = document.getElementById("phase-label");
  const discardButton = document.getElementById("discard-btn");
  const drawButton = document.getElementById("draw-btn");
  const riichiButton = document.getElementById("riichi-btn");
  const playersEl = document.getElementById("players");
  const summaryEl = document.getElementById("hand-summary");
  const resultEl = document.getElementById("round-result");
  const actionLogEl = document.getElementById("action-log");
  const yakuEl = document.getElementById("yaku-list");

  const humanPlayer = getHumanPlayer();
  const currentPlayer = state.players[state.currentTurn];
  const analysis = analyzeHand(humanPlayer.tiles, state.riichiActive);

  if (!state.pendingCall && humanPlayer.tiles.length) {
    humanPlayer.tiles = sortHand(humanPlayer.tiles);
  }

  if (handEl) {
    handEl.innerHTML = "";
    humanPlayer.tiles.forEach((tile) => {
      if (!tile) return;
      const button = document.createElement("button");
      const isDrawnTile = state.lastDrawnTile === tile && state.turnPhase === "discard";
      button.className = `tile ${tile.slice(-1)} ${state.selectedTile === tile ? "selected" : ""} ${isDrawnTile ? "draw-highlight" : ""}`;
      button.innerHTML = `<img class="tile-graphic" src="${createTileSvg(tile)}" alt="${tile}" />`;
      button.addEventListener("click", () => selectTile(tile));
      handEl.appendChild(button);
    });
  }

  if (discardEl) {
    discardEl.innerHTML = "";
    state.discard.slice(-8).reverse().forEach((tile, index) => {
      const span = document.createElement("span");
      span.className = `tile small ${tile.slice(-1)} ${index === 0 && state.discard.length ? "animate-discard" : ""}`;
      span.innerHTML = `<img class="tile-graphic" src="${createTileSvg(tile)}" alt="${tile}" />`;
      discardEl.appendChild(span);
    });
  }

  if (playersEl) {
    playersEl.innerHTML = "";
    state.players.forEach((player, index) => {
      const chip = document.createElement("div");
      chip.className = `player-chip ${index === state.currentTurn ? "active" : ""}`;
      chip.innerHTML = `<span>${player.name}</span><strong>${player.tiles.length} tiles</strong>`;
      playersEl.appendChild(chip);
    });
  }

  if (summaryEl) {
    summaryEl.innerHTML = "";
    const summaryEntries = [
      { label: "Status", value: analysis.complete ? "Complete" : analysis.ready ? "Ready" : "In progress" },
      { label: "Ready tile", value: analysis.readyTile || "—" },
      { label: "Melds", value: String(analysis.melds) },
      { label: "Pairs", value: String(analysis.pairs) },
      { label: "Score", value: `${analysis.scoreEstimate} pts` },
    ];
    summaryEntries.forEach((entry) => {
      const item = document.createElement("div");
      item.className = "summary-item";
      item.innerHTML = `<span>${entry.label}</span><strong>${entry.value}</strong>`;
      summaryEl.appendChild(item);
    });
  }

  if (resultEl) {
    resultEl.innerHTML = "";
    if (state.roundResult) {
      const resultItems = [
        { label: "Winner", value: state.roundResult.winner },
        { label: "Reason", value: state.roundResult.reason === "complete" ? "Completed hand" : "Wall exhausted" },
        { label: "Score", value: `${state.roundResult.scoreEstimate} pts` },
        { label: "Tile", value: state.roundResult.winningTile || "—" },
      ];
      resultItems.forEach((entry) => {
        const item = document.createElement("div");
        item.className = "summary-item";
        item.innerHTML = `<span>${entry.label}</span><strong>${entry.value}</strong>`;
        resultEl.appendChild(item);
      });
    } else {
      const fallback = document.createElement("div");
      fallback.className = "result-pill";
      fallback.textContent = "No winner yet — keep playing";
      resultEl.appendChild(fallback);
    }
  }

  if (actionLogEl) {
    actionLogEl.innerHTML = "";
    state.actionLog.forEach((entry) => {
      const item = document.createElement("div");
      item.className = "action-entry";
      item.textContent = entry;
      actionLogEl.appendChild(item);
    });
  }

  if (yakuEl) {
    yakuEl.innerHTML = "";
    const yakuItems = state.roundResult
      ? state.roundResult.yakuHints.length
        ? state.roundResult.yakuHints
        : ["Round finished"]
      : analysis.yakuHints.length
        ? analysis.yakuHints
        : ["No yaku hints yet"];
    yakuItems.forEach((entry) => {
      const item = document.createElement("span");
      item.className = "yaku-pill";
      item.textContent = entry;
      yakuEl.appendChild(item);
    });
  }

  const meldsEl = document.getElementById("melds-list");
  if (meldsEl) {
    meldsEl.innerHTML = "";
    if (state.melds.length) {
      state.melds.forEach((meld) => {
        const item = document.createElement("span");
        item.className = "yaku-pill";
        item.textContent = `${meld.type.toUpperCase()} ${meld.tile}`;
        meldsEl.appendChild(item);
      });
    } else {
      const fallback = document.createElement("div");
      fallback.className = "result-pill";
      fallback.textContent = "No calls yet";
      meldsEl.appendChild(fallback);
    }
  }

  if (wallEl) {
    wallEl.innerHTML = state.deck.length ? `${state.deck.length} tiles remain` : "Wall empty";
  }
  if (discardCountEl) {
    discardCountEl.textContent = state.discard.length;
  }
  if (wallCountEl) {
    wallCountEl.textContent = state.deck.length;
  }
  const discardCountLabel = document.getElementById("discard-count-label");
  if (discardCountLabel) {
    discardCountLabel.textContent = state.discard.length;
  }

  if (turnLabelEl) {
    turnLabelEl.textContent = state.roundStarted ? currentPlayer?.name || "Waiting" : "Not started";
  }
  if (phaseLabelEl) {
    phaseLabelEl.textContent = !state.roundStarted
      ? "Round over"
      : state.turnPhase === "discard" && isHumanTurn()
        ? "Discard"
        : state.turnPhase === "draw" && !isHumanTurn()
          ? "AI turn"
          : state.turnPhase === "draw"
            ? "Draw"
            : "Waiting";
  }
  if (riichiStateEl) {
    riichiStateEl.textContent = state.riichiActive ? "Declared" : state.riichiChecked ? "Ready / not ready" : "No";
  }

  if (drawButton) {
    drawButton.disabled = !state.roundStarted || !isHumanTurn() || state.turnPhase !== "draw" || state.deck.length === 0 || Boolean(state.roundResult) || Boolean(state.pendingCall);
  }
  if (discardButton) {
    discardButton.disabled = !state.roundStarted || !isHumanTurn() || state.turnPhase !== "discard" || !state.selectedTile || Boolean(state.roundResult) || Boolean(state.pendingCall);
  }
  if (riichiButton) {
    riichiButton.disabled = !state.roundStarted || !isHumanTurn() || Boolean(state.roundResult) || Boolean(state.pendingCall);
  }

  const ponButton = document.getElementById("pon-btn");
  const chiButton = document.getElementById("chi-btn");
  const kanButton = document.getElementById("kan-btn");
  const ronButton = document.getElementById("ron-btn");
  const passButton = document.getElementById("pass-call-btn");

  if (state.pendingCall) {
    if (ponButton) ponButton.disabled = !state.pendingCall.canPon;
    if (chiButton) chiButton.disabled = !state.pendingCall.canChi;
    if (kanButton) kanButton.disabled = !state.pendingCall.canKan;
    if (ronButton) ronButton.disabled = !state.pendingCall.canRon;
    if (passButton) passButton.disabled = false;
  } else {
    if (ponButton) ponButton.disabled = true;
    if (chiButton) chiButton.disabled = true;
    if (kanButton) kanButton.disabled = true;
    if (ronButton) ronButton.disabled = true;
    if (passButton) passButton.disabled = true;
  }

  renderOpponentTiles();
}

function renderOpponentTiles() {
  const southEl = document.getElementById("south-hand");
  const westEl = document.getElementById("west-hand");
  const northEl = document.getElementById("north-hand");

  const opponentEls = [
    { el: southEl, playerIndex: 1 },
    { el: westEl, playerIndex: 2 },
    { el: northEl, playerIndex: 3 },
  ];

  opponentEls.forEach(({ el, playerIndex }) => {
    if (el && state.players[playerIndex]) {
      el.innerHTML = "";
      const tileCount = state.players[playerIndex].tiles.length;
      for (let i = 0; i < tileCount; i += 1) {
        const span = document.createElement("span");
        span.className = "tile small back-tile";
        span.innerHTML = `<img class="tile-graphic" src="${createBackTileSvg()}" alt="tile" />`;
        el.appendChild(span);
      }
    }
  });
}
