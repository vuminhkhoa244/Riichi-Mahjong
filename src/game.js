import { state } from "./state.js";
import { allTiles } from "./tiles.js";
import { analyzeHand, createCountMap, findReadyTile, isComplete } from "./analysis.js";
import { chooseAiDiscard } from "./ai.js";
import { render } from "./render.js";

export function shuffle(array) {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function buildDeck() {
  const deck = [];
  for (let i = 0; i < 4; i += 1) {
    for (const tile of allTiles) {
      deck.push(tile);
    }
  }
  return shuffle(deck);
}

export function createPlayers() {
  return [
    { name: "You", tiles: [], isHuman: true, lastDiscard: null, aiStyle: "human" },
    { name: "South", tiles: [], isHuman: false, lastDiscard: null, aiStyle: "aggressive" },
    { name: "West", tiles: [], isHuman: false, lastDiscard: null, aiStyle: "balanced" },
    { name: "North", tiles: [], isHuman: false, lastDiscard: null, aiStyle: "defensive" },
  ];
}

export function getHumanPlayer() {
  return state.players.find((player) => player.isHuman);
}

export function isHumanTurn() {
  return state.players[state.currentTurn]?.isHuman;
}

const TILE_ORDER = {
  ton: 0,
  nan: 1,
  shaa: 2,
  pei: 3,
  haku: 4,
  chun: 5,
  hatsu: 6,
  m: 7,
  s: 8,
  p: 9,
};

export function sortHand(hand) {
  return [...hand].sort((a, b) => {
    const orderA = TILE_ORDER[a.slice(-1)] ?? 99;
    const orderB = TILE_ORDER[b.slice(-1)] ?? 99;
    if (orderA !== orderB) {
      return orderA - orderB;
    }
    const rankA = Number(a.slice(0, -1));
    const rankB = Number(b.slice(0, -1));
    return rankA - rankB;
  });
}

export function getTileCountInHand(player, tile) {
  return player.tiles.filter((t) => t === tile).length;
}

export function canPon(player, tile) {
  return !player.isHuman ? false : getTileCountInHand(player, tile) >= 2 && state.riichiActive === false;
}

export function canKan(player, tile) {
  return !player.isHuman ? false : getTileCountInHand(player, tile) >= 3;
}

export function canRon(hand, tile) {
  return isComplete([...hand, tile]);
}

export function findChiSequence(hand, tile) {
  const suit = tile.slice(-1);
  if (!['m', 'p', 's'].includes(suit)) return null;

  const rank = parseInt(tile.slice(0, -1), 10);
  if (Number.isNaN(rank)) return null;

  const sequences = [];

  if (rank <= 7) {
    sequences.push([tile, `${rank + 1}${suit}`, `${rank + 2}${suit}`]);
  }
  if (rank >= 2 && rank <= 8) {
    sequences.push([`${rank - 1}${suit}`, tile, `${rank + 1}${suit}`]);
  }
  if (rank >= 3) {
    sequences.push([`${rank - 2}${suit}`, `${rank - 1}${suit}`, tile]);
  }

  for (const seq of sequences) {
    const needed = seq.filter((t) => t !== tile);
    if (needed.every((t) => hand.includes(t))) {
      return seq;
    }
  }

  return null;
}

export function canChi(hand, tile) {
  if (state.riichiActive) return false;
  return findChiSequence(hand, tile) !== null;
}

export function declarePon(tile) {
  const player = getHumanPlayer();
  const countToRemove = 2;
  let removed = 0;
  player.tiles = player.tiles.filter((t) => {
    if (t === tile && removed < countToRemove) {
      removed += 1;
      return false;
    }
    return true;
  });
  state.melds.push({ type: "pon", tile, player: player.name });
  state.currentTurn = 0;
  state.turnPhase = "discard";
  state.selectedTile = null;
  setStatus(`Pon called on ${tile}. Discard a tile.`);
  render();
}

export function declareKan(tile) {
  const player = getHumanPlayer();
  const countToRemove = 3;
  let removed = 0;
  player.tiles = player.tiles.filter((t) => {
    if (t === tile && removed < countToRemove) {
      removed += 1;
      return false;
    }
    return true;
  });
  state.melds.push({ type: "kan", tile, player: player.name });
  state.currentTurn = 0;
  state.turnPhase = "discard";
  state.selectedTile = null;
  setStatus(`Kan called on ${tile}. Discard a tile.`);
  render();
}

export function declareChi(tile) {
  const player = getHumanPlayer();
  const seq = findChiSequence(player.tiles, tile);
  if (!seq) return;

  const toRemove = seq.filter((t) => t !== tile);
  const remaining = [...player.tiles];
  for (const t of toRemove) {
    const idx = remaining.indexOf(t);
    if (idx !== -1) {
      remaining.splice(idx, 1);
    }
  }
  player.tiles = remaining;

  state.melds.push({ type: "chi", tile, player: player.name, sequence: seq });
  state.currentTurn = 0;
  state.turnPhase = "discard";
  state.selectedTile = null;
  setStatus(`Chi called on ${tile}. Discard a tile.`);
  render();
}

export function declareRon(tile) {
  const player = getHumanPlayer();
  state.roundStarted = false;
  const analysis = analyzeHand([...player.tiles, tile]);
  state.roundResult = {
    winner: "You",
    reason: "complete",
    winningTile: tile,
    scoreEstimate: analysis.scoreEstimate,
    yakuHints: analysis.yakuHints,
  };
  state.melds.push({ type: "ron", tile, player: player.name });
  setStatus(`Ron! You won with ${tile}!`);
  render();
}

export function checkForCalls(tile, discardedByPlayerIndex) {
  const human = getHumanPlayer();
  if (!human || discardedByPlayerIndex === 0) {
    return;
  }

  state.pendingCall = {
    tile,
    canPon: canPon(human, tile),
    canKan: canKan(human, tile),
    canRon: canRon(human.tiles, tile),
    canChi: canChi(human.tiles, tile),
    chiSequence: findChiSequence(human.tiles, tile),
  };

  if (state.pendingCall.canPon || state.pendingCall.canKan || state.pendingCall.canRon || state.pendingCall.canChi) {
    render();
  }
}

export function passCall() {
  state.pendingCall = null;
  advanceTurn();
}

export function handleCall(action) {
  if (!state.pendingCall) return;
  const { tile } = state.pendingCall;

  if (action === "pon" && state.pendingCall.canPon) {
    state.pendingCall = null;
    declarePon(tile);
    return;
  }

  if (action === "kan" && state.pendingCall.canKan) {
    state.pendingCall = null;
    declareKan(tile);
    return;
  }

  if (action === "ron" && state.pendingCall.canRon) {
    state.pendingCall = null;
    declareRon(tile);
    return;
  }

  if (action === "chi" && state.pendingCall.canChi) {
    state.pendingCall = null;
    declareChi(tile);
    return;
  }

  passCall();
}

export function startRound() {
  state.deck = buildDeck();
  state.players = createPlayers();
  state.discard = [];
  state.currentTurn = 0;
  state.turnPhase = "draw";
  state.selectedTile = null;
  state.lastDrawnTile = null;
  state.riichiChecked = false;
  state.riichiActive = false;
  state.roundStarted = true;
  state.roundResult = null;
  state.actionLog = [];

  for (let i = 0; i < 13; i += 1) {
    for (const player of state.players) {
      player.tiles.push(state.deck.pop());
    }
  }

  const human = getHumanPlayer();
  if (human) {
    human.tiles = sortHand(human.tiles);
  }

  addActionLog("Round started. Your turn to draw.");
  setStatus("Round started. Your turn to draw.");
  render();
}

export function drawTile() {
  if (!state.roundStarted) {
    startRound();
    return;
  }

  if (!isHumanTurn()) {
    setStatus("It is not your turn yet.");
    return;
  }

  if (state.turnPhase !== "draw") {
    setStatus("You already drew this turn.");
    return;
  }

  if (!state.deck.length) {
    setStatus("The wall is empty.");
    return;
  }

  const player = getHumanPlayer();
  const tile = state.deck.pop();
  player.tiles.push(tile);
  player.tiles = sortHand(player.tiles);
  addActionLog(`You drew ${tile}.`);
  state.selectedTile = null;
  state.turnPhase = "discard";
  state.riichiChecked = false;
  state.lastDrawnTile = tile;

  if (isComplete(player.tiles)) {
    state.roundStarted = false;
    const analysis = analyzeHand(player.tiles);
    state.roundResult = {
      winner: "You",
      reason: "complete",
      winningTile: tile,
      scoreEstimate: analysis.scoreEstimate,
      yakuHints: analysis.yakuHints,
    };
    setStatus(`You drew ${tile} and completed your hand!`);
    render();
    return;
  }

  const analysis = analyzeHand(player.tiles);
  setStatus(`Drew ${tile}. ${analysis.ready ? `Ready with ${analysis.readyTile}.` : "Choose a tile to discard."}`);
  render();
}

export function selectTile(tile) {
  if (!state.roundStarted || !isHumanTurn() || state.turnPhase !== "discard") {
    return;
  }

  if (state.selectedTile === tile) {
    state.selectedTile = null;
  } else {
    state.selectedTile = tile;
  }
  render();
}

export function discardSelected() {
  if (!state.roundStarted || !isHumanTurn() || state.turnPhase !== "discard") {
    return;
  }

  if (!state.selectedTile) {
    setStatus("Select a tile from your hand before discarding.");
    return;
  }

  const player = getHumanPlayer();
  const index = player.tiles.indexOf(state.selectedTile);
  if (index === -1) {
    setStatus("That tile is no longer in your hand.");
    return;
  }

  const [discardedTile] = player.tiles.splice(index, 1);
  player.tiles = sortHand(player.tiles);
  addActionLog(`You discarded ${discardedTile}.`);
  player.lastDiscard = discardedTile;
  state.discard.push(discardedTile);
  state.selectedTile = null;
  state.riichiChecked = false;
  state.riichiActive = false;

  setStatus(`Discarded ${discardedTile}.`);
  render();

  const discardedByPlayerIndex = state.players.indexOf(player);
  checkForCalls(discardedTile, discardedByPlayerIndex);

  if (!state.pendingCall) {
    window.setTimeout(() => {
      if (!state.deck.length) {
        state.roundStarted = false;
        state.roundResult = {
          winner: "None",
          reason: "wall-empty",
          winningTile: null,
          scoreEstimate: 0,
          yakuHints: ["Round finished"],
        };
        setStatus("The wall is empty. The round ends.");
        render();
        return;
      }

      advanceTurn();
    }, 350);
  }
}

export function advanceTurn() {
  state.currentTurn = (state.currentTurn + 1) % state.players.length;
  if (state.players[state.currentTurn].isHuman) {
    state.turnPhase = "draw";
    setStatus("Your turn. Draw a tile.");
    render();
    return;
  }

  render();
  window.setTimeout(() => runAiTurn(state.currentTurn), 500);
}

export function runAiTurn(playerIndex) {
  if (!state.roundStarted) {
    return;
  }

  const player = state.players[playerIndex];
  if (!state.deck.length) {
    state.roundStarted = false;
    setStatus("The wall is empty. The round ends.");
    render();
    return;
  }

  const tile = state.deck.pop();
  player.tiles.push(tile);

  const discardDecision = chooseAiDiscard(player);
  const [discardedTile] = player.tiles.splice(discardDecision.index, 1);
  addActionLog(`${player.name} discarded ${discardedTile}.`);
  player.lastDiscard = discardedTile;
  state.discard.push(discardedTile);

  const discardedByPlayerIndex = state.players.indexOf(player);
  checkForCalls(discardedTile, discardedByPlayerIndex);

  if (state.pendingCall) {
    render();
    return;
  }

  if (isComplete(player.tiles)) {
    state.roundStarted = false;
    const analysis = analyzeHand(player.tiles);
    state.roundResult = {
      winner: player.name,
      reason: "complete",
      winningTile: tile,
      scoreEstimate: analysis.scoreEstimate,
      yakuHints: analysis.yakuHints,
    };
    setStatus(`${player.name} won with ${tile}!`);
    render();
    return;
  }

  state.currentTurn = (playerIndex + 1) % state.players.length;
  if (state.players[state.currentTurn].isHuman) {
    state.turnPhase = "draw";
    setStatus("Your turn. Draw a tile.");
    render();
  } else {
    window.setTimeout(() => runAiTurn(state.currentTurn), 650);
  }
}

export function riichiCheck() {
  if (!state.roundStarted) {
    return;
  }

  const player = getHumanPlayer();
  const analysis = analyzeHand(player.tiles, true);
  state.riichiChecked = true;
  if (analysis.ready) {
    state.riichiActive = true;
    setStatus(`Riichi declared. Your hand is ready for ${analysis.readyTile}.`);
  } else {
    state.riichiActive = false;
    setStatus("Riichi not declared. Your hand is not ready yet.");
  }
  render();
}

export function addActionLog(message) {
  state.actionLog.unshift(message);
  state.actionLog = state.actionLog.slice(0, 8);
}

export function setStatus(message) {
  const statusEl = document.getElementById("status");
  if (statusEl) {
    statusEl.textContent = message;
  }
}
