// Ember Pact — bootstrap: build the duel, wire input, drive the table.
// URL params: ?shot=title|table|win|loss&seed=<text> renders a fixed scene
// for screenshots; otherwise a fresh duel starts on the title screen.
import { newGame, startGame, playCard, endTurn, logLine } from './state.js';
import { buildShotState } from './shots.js';
import { renderAll, floatText, shakeTable, showTitle, showHelp, showEnd, hideOverlay, emberBurst } from './render.js';
import { attachInput } from './input.js';
import { playSound, toggleMute, isMuted, unlockAudio } from './audio.js';
import { cardById } from './cards.js';

const params = new URLSearchParams(location.search);
const shot = params.get('shot');
const seed = params.get('seed') || `ember-${Date.now().toString(36)}`;

let state = shot ? buildShotState(shot, seed) : newGame(seed);
let helpOpen = false;
const ui = { selected: 0, onPlayCard: playPlayerCard, onSelect: moveSelection };

if (shot) document.body.classList.add('shot-mode');

function refresh() {
  renderAll(state, ui);
  if (state.phase === 'won' || state.phase === 'lost') {
    showEnd(state, restartPlaying, restartToTitle);
    playSound(state.phase === 'won' ? 'win' : 'loss');
  }
}

function describeEvent(ev) {
  const who = ev.by === 'player' ? '<b>You</b>' : '<b>Vex</b>';
  const card = ev.card;
  if (card.kind === 'guard') return `${who} raised ${card.name} (+${ev.value} ward).`;
  if (card.kind === 'drain') return `${who} played ${card.name}: ${ev.through} damage, healed ${ev.healed}.`;
  const pact = ev.doubled ? ' — SURGE ×2!' : ev.pact ? ' — Pact +2!' : '';
  const blocked = ev.blocked > 0 ? ` (${ev.blocked} warded)` : '';
  return `${who} played ${card.name}: ${ev.through} damage${blocked}.${pact}`;
}

function showEvent(ev) {
  logLine(state, '', describeEvent(ev));
  const target = ev.by === 'player' ? 'rival-fighter' : 'player-fighter';
  if (ev.card.kind === 'guard') {
    floatText(`+${ev.value} WARD`, 'ward', ev.by === 'player' ? 'player-fighter' : 'rival-fighter');
    playSound('ward');
  } else {
    if (ev.through > 0) {
      floatText(`-${ev.through}`, 'dmg', target);
      playSound('hit');
      if (ev.through >= 7) shakeTable();
    }
    if (ev.healed > 0) floatText(`+${ev.healed}`, 'heal', ev.by === 'player' ? 'player-fighter' : 'rival-fighter');
  }
  if (ev.doubled || ev.pact) {
    floatText(ev.doubled ? 'SURGE ×2!' : 'PACT +2', 'pact', target);
    playSound('pact');
  }
}

function playPlayerCard(i) {
  if (helpOpen || state.phase !== 'playing' || state.aiBusy) return;
  if (i < 0 || i >= state.player.hand.length) return;
  const card = cardById(state.player.hand[i]);
  if (card.cost > state.player.energy) { playSound('click'); return; }
  ui.selected = i;
  const ev = playCard(state, 'player', i);
  if (!ev) return;
  playSound('play');
  showEvent(ev);
  renderAll(state, ui);
  if (state.phase !== 'playing') refresh();
}

function moveSelection(delta) {
  if (helpOpen) return;
  if (state.phase === 'playing') {
    const n = state.player.hand.length;
    if (n === 0) return;
    if (delta === 0) { playPlayerCard(ui.selected); return; }
    if (delta === -99) { ui.selected = 0; renderAll(state, ui); return; }
    ui.selected = (ui.selected + delta + n) % n;
    playSound('click');
    renderAll(state, ui);
  }
}

function endPlayerTurn() {
  if (helpOpen || state.phase !== 'playing' || state.aiBusy) return;
  playSound('turn');
  const events = endTurn(state);
  // Reveal Vex's answers one at a time so the table reads like a duel.
  events.forEach((ev, i) => {
    setTimeout(() => { showEvent(ev); renderAll(state, ui); }, 420 * (i + 1));
  });
  setTimeout(() => { renderAll(state, ui); if (state.phase !== 'playing') refresh(); }, 420 * (events.length + 1));
  renderAll(state, ui);
}

function restartPlaying() {
  state = newGame(`ember-${Date.now().toString(36)}`);
  ui.selected = 0;
  startGame(state);
  hideOverlay();
  playSound('deal');
  renderAll(state, ui);
}

function restartToTitle() {
  state = newGame(`ember-${Date.now().toString(36)}`);
  ui.selected = 0;
  hideOverlay();
  showTitle(beginPlaying);
  renderAll(state, ui);
}

function beginPlaying() {
  unlockAudio();
  startGame(state);
  hideOverlay();
  playSound('deal');
  renderAll(state, ui);
}

document.getElementById('end-turn-btn').addEventListener('click', endPlayerTurn);
document.getElementById('mute-btn').addEventListener('click', () => {
  const muted = toggleMute();
  document.getElementById('mute-btn').textContent = muted ? 'Sound: Off' : 'Sound: On';
});
document.getElementById('help-btn').addEventListener('click', () => {
  helpOpen = true;
  playSound('click');
  showHelp(() => {
    helpOpen = false;
    hideOverlay();
    if (state.phase === 'title') showTitle(beginPlaying);
  });
});

attachInput({
  onPlayCard: playPlayerCard,
  onEndTurn: endPlayerTurn,
  onRestart: () => { if (state.phase === 'won' || state.phase === 'lost') restartPlaying(); },
  onMute: () => document.getElementById('mute-btn').click(),
  onSelect: moveSelection,
  onFirstGesture: unlockAudio,
});

if (shot === 'title') {
  showTitle(beginPlaying);
  renderAll(state, ui);
} else if (shot === 'win' || shot === 'loss') {
  renderAll(state, ui);
  showEnd(state, restartPlaying, restartToTitle);
  if (shot === 'win') emberBurst(30);
} else if (shot === 'table') {
  // A live duel: no overlay — the table itself is the shot.
  renderAll(state, ui);
} else {
  showTitle(beginPlaying);
  renderAll(state, ui);
}

// Test hooks: the browser play-test drives the duel through these.
window.__ember = {
  get state() { return state; },
  playCard: (i) => playPlayerCard(i),
  endTurn: endPlayerTurn,
  begin: beginPlaying,
  restart: restartPlaying,
  forceWin: () => { state.rival.hp = 0; state.phase = 'won'; refresh(); },
  forceLoss: () => { state.player.hp = 0; state.phase = 'lost'; refresh(); },
  newSeed: (s) => { state = newGame(s); renderAll(state, ui); },
};
