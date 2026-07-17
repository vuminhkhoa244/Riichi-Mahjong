# Riichi Mahjong Prototype

This workspace now contains a lightweight browser-based riichi mahjong prototype focused on the core loop of the game:

- dealing a starting hand
- drawing and discarding tiles
- checking whether a hand is ready
- advancing through a simple turn-based round with AI opponents
- declaring riichi and showing simple yaku/scoring hints
- displaying round results and outcome summaries
- using slightly smarter AI discard choices and smoother turn animations

## What is included

- a playable single-page web app
- basic wall and discard handling
- a simple ready-hand check
- turn flow with three AI players
- smarter discard heuristics for the opponents
- a more polished table layout with light animation feedback

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

1. Start a new round.
2. Click Draw tile on your turn.
3. Select one tile from your hand and discard it.
4. Use Riichi check to see whether your current hand looks ready.
5. The round continues with the AI players taking turns.

## Notes

This is still an early prototype. The next steps will focus on more authentic riichi mechanics such as:

- richer hand evaluation and yaku detection
- a more faithful scoring system
- more varied opponent personalities and tactics
- turn history and more game state
