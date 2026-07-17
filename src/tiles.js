export const allTiles = [];
for (const suit of ["m", "p", "s"]) {
  for (let rank = 1; rank <= 9; rank += 1) {
    allTiles.push(`${rank}${suit}`);
  }
}
for (const honor of ["ton", "nan", "shaa", "pei", "haku", "chun", "hatsu"]) {
  allTiles.push(honor);
}

export function createTileSvg(tile) {
  const honorMap = {
    ton: "Ton.png",
    nan: "Nan.png",
    shaa: "Shaa.png",
    pei: "Pei.png",
    haku: "Haku.png",
    chun: "Chun.png",
    hatsu: "Hatsu.png",
  };

  if (honorMap[tile]) {
    return `Regular/${honorMap[tile]}`;
  }

  const rankText = tile.slice(0, -1);
  const suit = tile.slice(-1);
  const fileName = suit === "m" ? `Man${rankText}.png` : suit === "p" ? `Pin${rankText}.png` : `Sou${rankText}.png`;
  return `Regular/${fileName}`;
}

export function createBackTileSvg() {
  return `Regular/Back.png`;
}
