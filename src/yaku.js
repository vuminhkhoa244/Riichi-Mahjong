import { allTiles } from "./tiles.js";
import { createCountMap, splitTile } from "./analysis.js";

const HONOR_NAMES = {
  ton: "East",
  nan: "South",
  shaa: "West",
  pei: "North",
  haku: "White",
  chun: "Red",
  hatsu: "Green",
};

export function detectYaku(hand, melds, isRiichi, isTsumo) {
  const yaku = [];
  const counts = createCountMap(hand);

  const allMelds = [...melds];
  const closedMelds = allMelds.filter((m) => m.player === "You");
  const openMelds = allMelds.filter((m) => m.player !== "You");
  const hasOpenMeld = openMelds.length > 0;

  const isClosed = !hasOpenMeld;

  const suitCounts = { m: 0, p: 0, s: 0, honor: 0 };
  counts.forEach((count, tile) => {
    const suit = tile.slice(-1);
    if (["m", "p", "s"].includes(suit)) {
      suitCounts[suit] += count;
    } else {
      suitCounts.honor += count;
    }
  });

  const nonHonorSuits = ["m", "p", "s"].filter((s) => suitCounts[s] > 0);
  if (nonHonorSuits.length === 1) {
    yaku.push({ name: "Honitsu", han: isClosed ? 3 : 2 });
    if (suitCounts.honor === 0) {
      yaku.push({ name: "Chinitsu", han: isClosed ? 6 : 5 });
    }
  }

  const allTilesInHand = [];
  counts.forEach((count, tile) => {
    for (let i = 0; i < count; i += 1) {
      allTilesInHand.push(tile);
    }
  });

  const hasTerminal = allTilesInHand.some((t) => {
    const match = t.match(/^(1|9)([mps])$/);
    return !!match;
  });
  const hasHonor = allTilesInHand.some((t) => ["ton", "nan", "shaa", "pei", "haku", "chun", "hatsu"].includes(t));

  if (!hasTerminal && !hasHonor) {
    yaku.push({ name: "Tanyao", han: 1 });
  }

  const dragonSets = [];
  const windSets = [];
  allMelds.forEach((meld) => {
    const tile = meld.tile;
    if (["haku", "chun", "hatsu"].includes(tile)) {
      dragonSets.push(tile);
    } else if (["ton", "nan", "shaa", "pei"].includes(tile)) {
      windSets.push(tile);
    }
  });

  counts.forEach((count, tile) => {
    if (["haku", "chun", "hatsu"].includes(tile) && count >= 3) {
      dragonSets.push(tile);
    } else if (["ton", "nan", "shaa", "pei"].includes(tile) && count >= 3) {
      windSets.push(tile);
    }
  });

  const uniqueDragons = [...new Set(dragonSets)];
  const uniqueWinds = [...new Set(windSets)];

  if (uniqueDragons.length > 0) {
    yaku.push({ name: "Yakuhai (Dragon)", han: uniqueDragons.length });
  }
  if (uniqueWinds.length > 0) {
    yaku.push({ name: "Yakuhai (Wind)", han: uniqueWinds.length });
  }

  const pairCount = [...counts.values()].filter((c) => c >= 2).length;
  if (pairCount === 7) {
    yaku.push({ name: "Chiitoi", han: 2 });
  }

  const tripletCount = [...counts.values()].filter((c) => c >= 3).length;
  if (tripletCount === 4) {
    yaku.push({ name: "Toitoi", han: 2 });
  }

  const closedPairs = [...counts.entries()].filter(([t, c]) => c === 2);
  const chiitoiReady = closedPairs.length === 6 && [...counts.values()].filter((c) => c === 1).length === 1;
  if (chiitoiReady && isClosed) {
    yaku.push({ name: "Chiitoi-ready", han: 1 });
  }

  const sameTileSequences = [];
  const seen = new Set();
  allMelds.forEach((meld) => {
    if (meld.type === "chi" && meld.sequence && !seen.has(meld.sequence.join(","))) {
      sameTileSequences.push(meld.sequence);
      seen.add(meld.sequence.join(","));
    }
  });

  const seqCounts = {};
  sameTileSequences.forEach((seq) => {
    const key = seq.sort().join(",");
    seqCounts[key] = (seqCounts[key] || 0) + 1;
  });

  Object.entries(seqCounts).forEach(([key, count]) => {
    if (count >= 2 && isClosed) {
      yaku.push({ name: "Iipeikou", han: 1 });
    }
  });

  if (isRiichi) {
    yaku.push({ name: "Riichi", han: 1 });
    if (isTsumo && isClosed) {
      yaku.push({ name: "Menzen Tsumo", han: 1 });
    }
  } else if (isTsumo && isClosed) {
    yaku.push({ name: "Menzen Tsumo", han: 1 });
  }

  if (isClosed && allMelds.length === 0) {
    yaku.push({ name: "Pinfu", han: 1 });
  }

  return yaku;
}

export function calculateScore(yakuList, isTsumo, baseFu = 30) {
  const han = yakuList.reduce((sum, y) => sum + y.han, 0);
  if (han >= 13) return { label: "Yakuman", points: 32000 };
  if (han >= 11) return { label: "Sanbaiman", points: 24000 };
  if (han >= 8) return { label: "Baiman", points: 16000 };
  if (han >= 6) return { label: "Haneman", points: 12000 };
  if (han >= 5) return { label: "Mangan", points: 8000 };

  const fu = isTsumo ? 20 : baseFu;
  const score = Math.floor(fu * Math.pow(2, 2 + han));
  const rounded = Math.ceil(score / 100) * 100;

  return {
    label: `${han} han / ${fu} fu`,
    points: Math.max(rounded, 1000),
  };
}
