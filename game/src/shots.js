// Ember Pact — deterministic states for screenshots. ?shot=title|table|win|loss
// builds a fixed scene from a seed, so the four screenshots are real renders
// of the game's own code in a known state.
import { newGame, startGame, playCard, endTurn } from './state.js';
import { drawCards } from './deck.js';
import { cardById } from './cards.js';

function scriptedMidGame(state, seedText) {
  // Play several real rounds with the seeded RNG: the player plays its
  // cheapest affordable card, then Vex answers, until round 5.
  let guard = 0;
  while (state.phase === 'playing' && state.turn < 5 && guard < 12) {
    guard++;
    const p = state.player;
    let played = false;
    for (let i = 0; i < p.hand.length; i++) {
      const card = cardById(p.hand[i]);
      if (card.cost <= p.energy) { playCard(state, 'player', i); played = true; break; }
    }
    if (state.phase !== 'playing') break;
    if (!played || p.energy <= 0) endTurn(state);
    if (state.phase === 'playing' && p.energy > 0 && played) {
      // Spend remaining ember on a second card when possible.
      for (let i = 0; i < p.hand.length; i++) {
        const card = cardById(p.hand[i]);
        if (card.cost <= p.energy) { playCard(state, 'player', i); break; }
      }
      endTurn(state);
    }
  }
  // Refill the player's hand so the cover shows a full hand, then leave
  // one fresh card on the table so the cover shows a play in flight.
  if (state.phase === 'playing') {
    const p = state.player;
    drawCards(p, 5 - p.hand.length, state.rng);
    for (let i = 0; i < p.hand.length; i++) {
      const card = cardById(p.hand[i]);
      if (card.cost <= p.energy) { playCard(state, 'player', i); break; }
    }
    p.block = 4;
    state.rival.block = 3;
    state.log = [
      { who: '', text: '<b>You</b> played Glacier Wall (+5 ward).' },
      { who: '', text: '<b>Vex</b> gathers Flame — a burning strike is coming.' },
      { who: '', text: `Round ${state.turn} — your move, Emberwarden.` },
    ];
    return state;
  }
  // The duel ended during the script: rebuild a fixed mid-game table
  // instead, so the cover always shows a live duel.
  const fixed = newGame(seedText);
  startGame(fixed);
  fixed.turn = 6;
  fixed.player.hp = 32; fixed.rival.hp = 26;
  fixed.player.block = 4; fixed.rival.block = 3;
  fixed.player.energy = 2;
  fixed.player.hand = ['cinder-fang', 'glacier-wall', 'stormcall', 'bramble-snare', 'volt-arc'];
  fixed.rival.hand = ['ember-lash', 'rime-shield', 'frostbite', 'thorn-whip', 'static-snap'];
  fixed.telegraph = 'flame';
  fixed.lastPlayed = [{
    by: 'player', card: cardById('ember-lash'), value: 8, doubled: false, pact: true,
    blocked: 3, through: 5, healed: 0,
  }];
  fixed.log = [
    { who: '', text: '<b>You</b> played Ember Lash: 5 damage (3 warded). — Pact +2!' },
    { who: '', text: '<b>Vex</b> raised Rime Shield (+8 ward).' },
    { who: '', text: 'Round 6 — your move, Emberwarden.' },
  ];
  return fixed;
}

export function buildShotState(shot, seedText) {
  const state = newGame(seedText);
  if (shot === 'title') return state;
  startGame(state);
  if (shot === 'table') return scriptedMidGame(state, seedText);
  if (shot === 'win') {
    state.rival.hp = 0;
    state.player.hp = 23;
    state.player.block = 2;
    state.phase = 'won';
    state.stats = { damageDealt: 44, damageTaken: 17, cardsPlayed: 14, pacts: 5, turns: 9 };
    state.lastPlayed = [{
      by: 'player', card: cardById('wildfire'), value: 8, doubled: false, pact: true,
      blocked: 0, through: 8, healed: 0,
    }];
    return state;
  }
  if (shot === 'loss') {
    state.player.hp = 0;
    state.rival.hp = 16;
    state.rival.block = 5;
    state.phase = 'lost';
    state.stats = { damageDealt: 24, damageTaken: 40, cardsPlayed: 11, pacts: 2, turns: 8 };
    state.lastPlayed = [{
      by: 'rival', card: cardById('ember-lash'), value: 6, doubled: false, pact: false,
      blocked: 0, through: 6, healed: 0,
    }];
    return state;
  }
  return state;
}
