[![make.fun](https://make.fun/badge/best-card-game-20261122-1826.svg)](https://make.fun/bounty/best-card-game-20261122-1826)
[![rank](https://make.fun/badge/best-card-game-20261122-1826/kaybae46/best-card-game-20261122-1826-entry/rank.svg)](https://make.fun/bounty/best-card-game-20261122-1826)
[![reward](https://make.fun/badge/best-card-game-20261122-1826/kaybae46/best-card-game-20261122-1826-entry/reward.svg)](https://make.fun/bounty/best-card-game-20261122-1826)

# Ember Pact — a duel of burning cards

An original card game built for the [make.fun best card game bounty](https://make.fun/bounty/best-card-game-20261122-1826). You are the Emberwarden, duelling Ashcaller Vex across a green felt table with a 30-card deck of burning cards. First to 0 life loses.

## How to play

Serve `game/` with any static server (or run `node serve.ts`) and open http://localhost:8080. The game plays offline in desktop Chrome — no network requests, no build step.

- **Goal:** reduce Vex to 0 life before yours runs out. Both start at 40 life.
- **Each round** you get 3 ember and draw a card. Play cards by clicking them or pressing **1–5**, then press **End turn** (**E**). Vex answers, and a new round begins.
- **Suits** (told apart by colour *and* shape): **Flame** (red flame) strikes, **Frost** (blue snowflake) wards, **Spark** (gold bolt) surges, **Thorn** (green leaf) drains life back to you.
- **The Pact:** play two cards of one suit in a row and the second gains **+2**. A Spark played after a Spark deals **double**.
- **Read Vex:** the telegraph shows which suit Vex favours next turn — ward against Flame, race against Thorn.
- **Empty deck:** drawing from an empty deck burns you for 2. Finish the duel before the cards run out.

## Controls

| Input | Action |
| --- | --- |
| Click a card / **1–5** | Play that card |
| **←** / **→** | Move card selection |
| **Enter** / **Space** | Play the selected card |
| **E** | End turn |
| **M** | Mute / unmute sound |
| **R** | Play again (on the win/loss screen) |

All sound is synthesized live with WebAudio — no audio files.

## Layout

- `game/index.html` — the table
- `game/css/style.css` — table, cards and motion
- `game/src/rng.js` — seeded random numbers
- `game/src/cards.js` — the four suits and the card pool
- `game/src/deck.js` — deck, hand and discard piles
- `game/src/ai.js` — Ashcaller Vex: telegraphs and card choices
- `game/src/state.js` — the duel's state machine
- `game/src/render.js` — hands, life bars, overlays, floating damage
- `game/src/audio.js` — synthesized sound effects
- `game/src/input.js` — keyboard and mouse input
- `game/src/shots.js` — deterministic screenshot scenes (`?shot=title|table|win|loss`)
- `game/src/main.js` — bootstrap
- `main.ts` — the make.fun hand-in program (Node 22, standard library only)
- `screenshots/` — 4 real renders of the game: table, title, win, loss

## License

MIT — see [LICENSE](LICENSE).
