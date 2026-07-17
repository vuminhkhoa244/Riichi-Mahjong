import { allTiles } from "./tiles.js";

export function createCountMap(hand) {
  const counts = new Map();
  hand.forEach((tile) => {
    counts.set(tile, (counts.get(tile) || 0) + 1);
  });
  return counts;
}

export function splitTile(tile) {
  const match = tile.match(/^(\d+)([mps])$/);
  if (match) {
    return [match[1], match[2]];
  }
  return [NaN, tile];
}

export function cloneCounts(counts) {
  const next = new Map();
  counts.forEach((value, key) => {
    next.set(key, value);
  });
  return next;
}

export function hasPair(counts) {
  return [...counts.keys()].some((tile) => counts.get(tile) >= 2);
}

export function findPair(counts) {
  return [...counts.keys()].some((tile) => counts.get(tile) >= 2);
}

export function canBuildHand(counts, meldsLeft) {
  if (meldsLeft === 0) {
    return hasPair(counts);
  }

  const tileKeys = [...counts.keys()].filter((key) => counts.get(key) > 0);

  for (const tile of tileKeys) {
    if (counts.get(tile) >= 3) {
      const nextCounts = cloneCounts(counts);
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
      const nextCounts = cloneCounts(counts);
      nextCounts.set(sequence[0], nextCounts.get(sequence[0]) - 1);
      nextCounts.set(sequence[1], nextCounts.get(sequence[1]) - 1);
      nextCounts.set(sequence[2], nextCounts.get(sequence[2]) - 1);
      if (canBuildHand(nextCounts, meldsLeft - 1)) {
        return true;
      }
    }
  }

  if (meldsLeft === 1) {
    return findPair(counts);
  }

  return false;
}

export function isComplete(hand) {
  const counts = createCountMap(hand);
  return canBuildHand(counts, 4);
}

export function findReadyTile(hand) {
  const candidateTiles = allTiles.slice();
  return candidateTiles.find((tile) => isComplete([...hand, tile]));
}

export function countMelds(counts) {
  const workingCounts = cloneCounts(counts);
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

export function countPairs(counts) {
  let pairs = 0;
  counts.forEach((value) => {
    if (value >= 2) {
      pairs += 1;
    }
  });
  return pairs;
}

export function analyzeHand(hand, riichiActive = false) {
  const counts = createCountMap(hand);
  const readyTile = findReadyTile(hand);
  const complete = isComplete(hand);
  const melds = countMelds(counts);
  const pairs = countPairs(counts);
  const yakuHints = [];
  if (riichiActive) {
    yakuHints.push("Riichi");
  }
  if (readyTile) {
    yakuHints.push("Ready hand");
  }
  if (melds >= 2) {
    yakuHints.push("Tanyao");
  }
  if (pairs >= 1 && readyTile) {
    yakuHints.push("Pair-based hand");
  }
  if (complete) {
    yakuHints.push("Winning hand");
  }

  const scoreEstimate = complete
    ? 8000 + (riichiActive ? 2000 : 0) + melds * 300
    : readyTile
      ? 1800 + melds * 250 + (riichiActive ? 900 : 0)
      : 500 + melds * 120;

  return {
    complete,
    ready: Boolean(readyTile),
    readyTile,
    melds,
    pairs,
    scoreEstimate,
    yakuHints,
  };
}
