// Ember Pact — everything the player sees: hands, life bars, the table,
// floating damage numbers, and the title / win / loss screens.
import { SUITS, SUIT_PATHS, cardById, kindLabel } from './cards.js';

const $ = (id) => document.getElementById(id);

export function suitEmblem(suitKey, size = 64) {
  const suit = SUITS[suitKey];
  const isStroke = suit.shape === 'flake';
  const stroke = isStroke ? suit.color : 'none';
  const fill = isStroke ? 'none' : suit.color;
  const width = isStroke ? 5 : 0;
  return `<svg viewBox="0 0 64 64" width="${size}" height="${size}" aria-hidden="true">`
    + `<path d="${SUIT_PATHS[suit.shape]}" fill="${fill}" stroke="${stroke}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"/>`
    + `</svg>`;
}

export function cardElement(card, opts = {}) {
  const suit = SUITS[card.suit];
  const el = document.createElement('div');
  el.className = `card suit-${card.suit}${opts.unplayable ? ' unplayable' : ''}${opts.selected ? ' selected' : ''}${opts.played ? ' played' : ''}${opts.pactGlow ? ' pact-glow' : ''}`;
  el.dataset.cardId = card.id;
  let pips = '';
  for (let i = 0; i < 3; i++) pips += `<span class="pip${i < card.cost ? ' on' : ''}"></span>`;
  el.innerHTML = `
    <div class="card-top"><span class="card-name">${card.name}</span><span class="cost">${pips}</span></div>
    <div class="card-art">${suitEmblem(card.suit)}</div>
    <div class="card-value-row"><span class="card-value">${card.value}</span><span class="card-value-label">${kindLabel(card.kind)}</span></div>
    <div class="card-text">${card.text}</div>
    <div class="card-suit"><span class="suit-dot">${suitEmblem(card.suit, 12)}</span>${suit.name}</div>`;
  if (opts.pactTag) el.insertAdjacentHTML('beforeend', `<span class="pact-tag">${opts.pactTag}</span>`);
  if (opts.onClick) el.addEventListener('click', opts.onClick);
  return el;
}

function renderHandInto(container, hand, opts) {
  container.innerHTML = '';
  hand.forEach((id, i) => {
    const card = cardById(id);
    container.appendChild(cardElement(card, {
      unplayable: opts.isPlayer && card.cost > opts.energy,
      selected: opts.isPlayer && opts.selected === i,
      onClick: opts.isPlayer ? () => opts.onPlay(i) : undefined,
    }));
  });
}

function renderRivalBacks(container, count) {
  container.innerHTML = '';
  for (let i = 0; i < count; i++) {
    const back = document.createElement('div');
    back.className = 'card-back';
    container.appendChild(back);
  }
}

function energyPips(energy, max) {
  let html = '';
  for (let i = 0; i < max; i++) html += `<span class="pip${i < energy ? ' on' : ''}"></span>`;
  return html;
}

export function renderAll(state, ui) {
  const p = state.player, r = state.rival;
  $('player-life-fill').style.width = `${(p.hp / p.maxHp) * 100}%`;
  $('rival-life-fill').style.width = `${(r.hp / r.maxHp) * 100}%`;
  $('player-life-text').textContent = `${p.hp} / ${p.maxHp}`;
  $('rival-life-text').textContent = `${r.hp} / ${r.maxHp}`;
  $('player-block').hidden = p.block <= 0;
  $('rival-block').hidden = r.block <= 0;
  $('player-block').textContent = `WARD ${p.block}`;
  $('rival-block').textContent = `WARD ${r.block}`;
  $('energy-pips').innerHTML = energyPips(p.energy, p.maxEnergy);
  $('player-deck').textContent = `Deck ${p.deck.length} · Discard ${p.discard.length}`;
  $('rival-deck').textContent = `Deck ${r.deck.length} · Discard ${r.discard.length}`;
  $('round-label').textContent = `Round ${state.turn}`;
  $('turn-banner').textContent = state.phase === 'playing' ? (state.aiBusy ? 'Vex is answering…' : 'Your turn — play a card') : state.phase === 'won' ? 'Victory' : state.phase === 'lost' ? 'Defeat' : 'Ember Pact';
  $('turn-banner').classList.toggle('yours', state.phase === 'playing');
  $('end-turn-btn').disabled = state.phase !== 'playing' || state.aiBusy;

  const pact = p.lastSuit ? SUITS[p.lastSuit] : null;
  const pactEl = $('pact-meter');
  pactEl.textContent = pact ? `Pact: last played ${pact.name} — play ${pact.name} again for +2` : 'Pact: play two cards of one suit in a row for +2';
  pactEl.classList.toggle('hot', !!pact);

  const tele = $('telegraph');
  if (state.phase === 'playing') {
    const suit = SUITS[state.telegraph];
    tele.innerHTML = `Vex gathers <span class="tele-suit" style="color:${suit.color}">${suit.name}</span>…<br>Expect a ${suit.name.toLowerCase()} card next turn.`;
  } else {
    tele.innerHTML = '';
  }

  renderHandInto($('player-hand'), p.hand, { isPlayer: true, energy: p.energy, selected: ui.selected, onPlay: ui.onPlayCard });
  renderRivalBacks($('rival-hand'), r.hand.length);

  const zone = $('played-zone');
  zone.innerHTML = '';
  for (const ev of state.lastPlayed.slice(-2)) {
    const label = ev.doubled ? 'SURGE ×2' : ev.pact ? 'PACT +2' : null;
    zone.appendChild(cardElement(ev.card, { played: true, pactGlow: ev.doubled || ev.pact, pactTag: label }));
  }
  if (state.lastPlayed.length === 0) {
    zone.innerHTML = '<div style="color:var(--ink-dim);font-style:italic">Cards played this turn appear here.</div>';
  }

  const logEl = $('log');
  logEl.innerHTML = state.log.slice(-6).map((l) => `<p>${l.text}</p>`).join('');
  $('status').textContent = `You ${p.hp} life, Vex ${r.hp} life, round ${state.turn}.`;
}

export function floatText(text, kind, targetId) {
  const layer = $('float-layer');
  const target = document.getElementById(targetId);
  if (!target) return;
  const rect = target.getBoundingClientRect();
  const el = document.createElement('div');
  el.className = `float-text ${kind}`;
  el.textContent = text;
  el.style.left = `${rect.left + rect.width / 2 - 30}px`;
  el.style.top = `${rect.top - 10}px`;
  layer.appendChild(el);
  setTimeout(() => el.remove(), 1200);
}

export function shakeTable() {
  const table = $('table');
  table.classList.remove('shake');
  void table.offsetWidth;
  table.classList.add('shake');
}

export function emberBurst(count = 42) {
  const app = $('app');
  for (let i = 0; i < count; i++) {
    const e = document.createElement('div');
    e.className = 'ember';
    e.style.left = `${Math.random() * 100}%`;
    e.style.top = `${-Math.random() * 12}px`;
    e.style.animationDelay = `${Math.random() * 1.2}s`;
    app.appendChild(e);
    setTimeout(() => e.remove(), 4200);
  }
}

function overlay(html, cls = '') {
  const ov = $('overlay');
  ov.hidden = false;
  $('overlay-card').className = `overlay-card ${cls}`;
  $('overlay-card').innerHTML = html;
}

export function hideOverlay() {
  $('overlay').hidden = true;
}

export function showTitle(onStart) {
  overlay(`
    <h1>EMBER PACT</h1>
    <p class="subtitle">A duel of burning cards — you against Ashcaller Vex.</p>
    <div class="rules">
      <p><b>Goal:</b> reduce Vex to 0 life before yours runs out. Both of you start at <b>40 life</b>.</p>
      <p><b>Each round</b> you get 3 ember and draw a card. Play cards by clicking them or pressing <b>1–5</b>, then <b>End turn</b>.</p>
      <p><b>Suits:</b> <span style="color:#e5484d"><b>Flame</b></span> strikes, <span style="color:#3e9bff"><b>Frost</b></span> wards, <span style="color:#c98f00"><b>Spark</b></span> surges, <span style="color:#3fbf6f"><b>Thorn</b></span> drains life back.</p>
      <p><b>The Pact:</b> play two cards of one suit in a row for <b>+2</b>. A Spark after a Spark deals <b>double</b>.</p>
      <p><b>Read Vex:</b> the telegraph shows which suit Vex favours next — ward against Flame, race against Thorn.</p>
    </div>
    <button id="start-btn" class="big-btn" type="button">Seal the pact — Play</button>
    <div class="keys-hint">Mouse: click a card · Keyboard: <kbd>1</kbd>–<kbd>5</kbd> play · <kbd>←</kbd><kbd>→</kbd> select · <kbd>Enter</kbd> play · <kbd>E</kbd> end turn</div>
  `);
  $('start-btn').addEventListener('click', onStart);
}

export function showHelp(onClose) {
  overlay(`
    <h2>How to play</h2>
    <div class="rules">
      <p><b>Goal:</b> reduce Vex to 0 life. You both start at <b>40 life</b> with a 30-card deck.</p>
      <p><b>Your turn:</b> you have 3 ember. Each card costs ember (diamonds, top right). Play as many as you can afford, then press <b>End turn</b> — Vex answers, and you draw a card.</p>
      <p><b>Suits:</b> Flame strikes, Frost wards (block absorbs damage until your next turn), Spark surges, Thorn drains life back to you.</p>
      <p><b>The Pact:</b> two cards of one suit in a row: the second gains <b>+2</b>. Spark after Spark deals <b>double</b>.</p>
      <p><b>Telegraph:</b> Vex shows the suit it favours next turn — plan around it.</p>
      <p><b>Empty deck:</b> drawing from an empty deck burns you for 2. Finish the duel before the cards run out.</p>
    </div>
    <button id="close-help-btn" class="big-btn" type="button">Back to the table</button>
  `);
  $('close-help-btn').addEventListener('click', onClose);
}

export function showEnd(state, onAgain, onTitle) {
  const won = state.phase === 'won';
  const s = state.stats;
  overlay(`
    <h1>${won ? 'VICTORY' : 'DEFEAT'}</h1>
    <h2>${won ? 'The pact is yours.' : 'Your embers fade.'}</h2>
    <p class="subtitle">${won
      ? 'Vex kneels in the ash. The table remembers your name, Emberwarden.'
      : 'Vex keeps the table tonight. Shuffle up — the pact can be sealed again.'}</p>
    <div class="stat-grid">
      <div class="stat"><b>${s.turns || 1}</b><span>rounds</span></div>
      <div class="stat"><b>${s.cardsPlayed}</b><span>cards played</span></div>
      <div class="stat"><b>${s.damageDealt}</b><span>damage dealt</span></div>
      <div class="stat"><b>${s.pacts}</b><span>pacts sealed</span></div>
    </div>
    <button id="again-btn" class="big-btn" type="button">Play again <kbd>R</kbd></button>
    <button id="title-btn" class="big-btn ghost" type="button">Title screen</button>
  `, won ? 'win-card' : 'lose-card');
  $('again-btn').addEventListener('click', onAgain);
  $('title-btn').addEventListener('click', onTitle);
  if (won) emberBurst();
}
