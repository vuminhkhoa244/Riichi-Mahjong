# Riichi Mahjong Prototype

A lightweight browser-based riichi mahjong prototype focused on the core flow of a riichi mahjong round: deal, draw, discard, call melds, and test whether a hand is ready to win.

## What is included

- A playable single-page web app with modular ES modules
- Full tile set: man (circles), sou (bamboo), pin (characters), and honor tiles (winds + dragons)
- PNG tile assets with proper mahjong tile visuals
- Turn-based round with three AI opponents
- Calls: **Chi**, **Pon**, **Kan**, and **Ron** with proper turn-order priority (Ron > Pon/Kan > Chi)
- Riichi declaration blocks Chi/Pon/Kan; only Ron or Tsumo wins are allowed after riichi
- Richer yaku detection and basic han/fu scoring
- Round results and outcome summaries
- Smart AI discard heuristics
- Sorted hand display: honors → man → sou → pin
- Scrollable layout with polished dark theme

## Run locally on Windows

From the project folder, start a simple local server:

```bash
python -m http.server 8000
```

Then open:

```text
http://127.0.0.1:8000/
```

## How to play

1. Click **Start new round** to deal a fresh hand.
2. On your turn, click **Draw tile**.
3. Select a tile from your hand to discard it.
4. When an opponent discards a tile, use the call buttons to claim **Chi** (sequence), **Pon** (triplet), **Kan** (quad), or **Ron** (win on discard). Click **Pass** to skip.
5. Use **Declare riichi** to check whether your current hand looks ready.
6. After declaring riichi, you can only win by **Ron** or self-draw (Tsumo). Chi, Pon, and Kan are disabled.
7. The round continues with the AI players taking turns until someone wins or the wall empties.

## Future updates

- **Better AI**: add opponent call reactions, defensive play (furiten, safe tile awareness), and varied personalities.
- **Visual meld display**: show called melds on the table with the correct tiles instead of only listing them in the sidebar.
- **Dora indicator**: expose the dora tile and track dora in scoring.
- **Game history and replay**: record round events and allow reviewing past hands.
- **Sound and animations**: add tile click, call, and win feedback effects.
