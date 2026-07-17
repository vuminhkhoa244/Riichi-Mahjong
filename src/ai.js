import { allTiles } from "./tiles.js";
import { state } from "./state.js";

export function chooseAiDiscard(player) {
  const hand = [...player.tiles];
  const counts = new Map();
  hand.forEach((tile) => counts.set(tile, (counts.get(tile) || 0) + 1));
  const discardCandidates = hand.map((tile, index) => ({ tile, index }));

  const scoreTiles = discardCandidates.map((candidate) => {
    const testHand = hand.filter((_, index) => index !== candidate.index);
    const analysis = analyzeTilePreference(testHand, candidate.tile, counts);
    return { ...candidate, score: analysis.score };
  });

  const sorted = scoreTiles.sort((left, right) => left.score - right.score);
  const preferred = sorted[0];

  if (player.aiStyle === "aggressive") {
    return preferred;
  }

  if (player.aiStyle === "defensive") {
    const safe = sorted.find((entry) => !entry.tile.includes(state.discard[state.discard.length - 1] || ""));
    return safe || preferred;
  }

  return sorted[Math.floor(sorted.length * 0.35)] || preferred;
}

export function analyzeTilePreference(hand, tile, counts) {
  const readyTile = findReadyTile(hand);
  const melds = countMelds(counts);
  const pairs = countPairs(counts);
  const isDangerous = tile.endsWith("m") || tile.endsWith("p") || tile.endsWith("s");

  let score = 0;
  if (readyTile === tile) {
    score -= 5;
  }
  if (counts.get(tile)) {
    score += 1;
  }
  score += melds * 0.6;
  score += pairs * 0.3;
  score += isDangerous ? 0.2 : 0;
  return { score };
}

function findReadyTile(hand) {
  const candidateTiles = allTiles.slice();
  return candidateTiles.find((tile) => isComplete([...hand, tile]));
}

function isComplete(hand) {
  const counts = new Map();
  hand.forEach((tile) => counts.set(tile, (counts.get(tile) || 0) + 1));
  return canBuildHand(counts, 4);
}

function canBuildHand(counts, meldsLeft) {
  if (meldsLeft === 0) {
    return [...counts.keys()].some((tile) => counts.get(tile) >= 2);
  }

  const tileKeys = [...counts.keys()].filter((key) => counts.get(key) > 0);

  for (const tile of tileKeys) {
    if (counts.get(tile) >= 3) {
      const nextCounts = new Map(counts);
      nextCounts.set(tile, nextCounts.get(tile) - 3);
      if (canBuildHand(nextCounts, meldsLeft - 1)) {
        return true;
      }
    }

    const [rankText, suit] = splitTile(tile);
    const rank = Number(rankText);
    const sequence = [tile, `${rank + 1}${suit}`, `${rank + 2}${suit}`];
    if (
      rank <= 7 &&
      counts.get(sequence[0]) > 0 &&
      counts.get(sequence[1]) > 0 &&
      counts.get(sequence[2]) > 0
    ) {
      const nextCounts = new Map(counts);
      nextCounts.set(sequence[0], nextCounts.get(sequence[0]) - 1);
      nextCounts.set(sequence[1], nextCounts.get(sequence[1]) - 1);
      nextCounts.set(sequence[2], nextCounts.get(sequence[2]) - 1);
      if (canBuildHand(nextCounts, meldsLeft - 1)) {
        return true;
      }
    }
  }

  if (meldsLeft === 1) {
    return [...counts.keys()].some((tile) => counts.get(tile) >= 2);
  }

  return false;
}

function countMelds(counts) {
  const workingCounts = new Map(counts);
  let melds = 0;

  while (true) {
    let found = false;
    const tileKeys = [...workingCounts.keys()].filter((key) => workingCounts.get(key) > 0);

    for (const tile of tileKeys) {
      if (workingCounts.get(tile) >= 3) {
        workingCounts.set(tile, workingCounts.get(tile) - 3);
        melds += 1;
        found = true;
        break;
      }

      const [rankText, suit] = splitTile(tile);
      const rank = Number(rankText);
      const sequence = [tile, `${rank + 1}${suit}`, `${rank + 2}${suit}`];
      if (
        rank <= 7 &&
        workingCounts.get(sequence[0]) > 0 &&
        workingCounts.get(sequence[1]) > 0 &&
        workingCounts.get(sequence[2]) > 0
      ) {
        workingCounts.set(sequence[0], workingCounts.get(sequence[0]) - 1);
        workingCounts.set(sequence[1], workingCounts.get(sequence[1]) - 1);
        workingCounts.set(sequence[2], workingCounts.get(sequence[2]) - 1);
        melds += 1;
        found = true;
        break;
      }
    }

    if (!found) {
      return melds;
    }
  }
}

function countPairs(counts) {
  let pairs = 0;
  counts.forEach((value) => {
    if (value >= 2) {
      pairs += 1;
    }
  });
  return pairs;
}

function splitTile(tile) {
  const match = tile.match(/^(\d+)([mps])$/);
  if (match) {
    return [match[1], match[2]];
  }
  return [NaN, tile];
}
