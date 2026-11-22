// Ember Pact — the duel's state machine. One round = player plays cards,
// then Vex answers, then both draw. First to 0 life loses; an empty deck
// bites for 2 fatigue. A card played right after another of the same suit
// gains +2 (the Pact); a Spark played after a Spark deals double.
import { cardById } from './cards.js';
import { makeSide, drawCards, discardCard } from './deck.js';
import { makeRng, hashSeed } from './rng.js';
import { choosePlays, chooseTelegraph } from './ai.js';

export const MAX_HP = 40;
export const HAND_SIZE = 5;

export function newGame(seedText = 'ember') {
  const rng = makeRng(hashSeed(seedText));
  const state = {
    seed: seedText,
    rng,
    phase: 'title', // title | playing | won | lost
    turn: 1,
    player: makeSide(rng),
    rival: makeSide(rng),
    telegraph: chooseTelegraph(rng),
    lastPlayed: [], // {by, card, pact, value} shown on the table
    log: [],
    stats: { damageDealt: 0, damageTaken: 0, cardsPlayed: 0, pacts: 0, turns: 0 },
    aiBusy: false,
  };
  drawCards(state.player, HAND_SIZE, rng);
  drawCards(state.rival, HAND_SIZE, rng);
  return state;
}

export function startGame(state) {
  state.phase = 'playing';
  state.log = [{ who: '', text: 'The pact is sealed. Your move, Emberwarden.' }];
}

export function pactBonus(side, card) {
  if (side.lastSuit === card.suit) return 2;
  return 0;
}

export function resolveValue(side, card) {
  let value = card.value + pactBonus(side, card);
  let doubled = false;
  if (card.kind === 'spark' && side.lastSuit === 'spark') {
    value = card.value * 2 + pactBonus(side, card);
    doubled = true;
  }
  return { value, doubled, pact: pactBonus(side, card) > 0 };
}

export function dealDamage(state, target, amount, source) {
  const blocked = Math.min(target.block, amount);
  target.block -= blocked;
  const through = amount - blocked;
  target.hp = Math.max(0, target.hp - through);
  if (source === 'player') state.stats.damageDealt += through;
  if (source === 'rival') state.stats.damageTaken += through;
  return { blocked, through };
}

export function heal(side, amount) {
  const before = side.hp;
  side.hp = Math.min(side.maxHp, side.hp + amount);
  return side.hp - before;
}

// Play one card from a side's hand. Returns the event for the renderer.
export function playCard(state, who, handIndex) {
  const side = who === 'player' ? state.player : state.rival;
  const foe = who === 'player' ? state.rival : state.player;
  const card = cardById(side.hand[handIndex]);
  if (!card || card.cost > side.energy || state.phase !== 'playing') return null;
  side.energy -= card.cost;
  discardCard(side, handIndex);
  const { value, doubled, pact } = resolveValue(side, card);
  let event = { by: who, card, value, doubled, pact, blocked: 0, through: 0, healed: 0 };
  if (card.kind === 'attack' || card.kind === 'spark') {
    const r = dealDamage(state, foe, value, who);
    event.blocked = r.blocked; event.through = r.through;
  } else if (card.kind === 'guard') {
    side.block += value;
    if (card.id === 'seedling') event.healed = heal(side, 2);
  } else if (card.kind === 'drain') {
    const r = dealDamage(state, foe, value, who);
    event.blocked = r.blocked; event.through = r.through;
    event.healed = heal(side, Math.ceil(value / 2));
  }
  if (pact) state.stats.pacts += who === 'player' ? 1 : 0;
  side.lastSuit = card.suit;
  state.stats.cardsPlayed += who === 'player' ? 1 : 0;
  state.lastPlayed.push(event);
  if (state.lastPlayed.length > 4) state.lastPlayed.shift();
  checkEnd(state);
  return event;
}

export function checkEnd(state) {
  if (state.rival.hp <= 0) state.phase = 'won';
  else if (state.player.hp <= 0) state.phase = 'lost';
}

// End the player's turn: Vex plays, then a new round begins.
export function endTurn(state) {
  if (state.phase !== 'playing' || state.aiBusy) return [];
  state.aiBusy = true;
  const events = [];
  // Vex's ward from last round has served its turn: it fades now, before
  // Vex answers, so the player's next strikes land clean.
  state.rival.block = 0;
  const plays = choosePlays(state, state.rng);
  // Remove by descending index so earlier picks stay valid.
  for (const idx of plays.slice().sort((a, b) => b - a)) {
    const ev = playCard(state, 'rival', idx);
    if (ev) events.push(ev);
    if (state.phase !== 'playing') break;
  }
  state.aiBusy = false;
  if (state.phase === 'playing') {
    state.turn += 1;
    state.stats.turns = state.turn;
    state.player.energy = state.player.maxEnergy;
    state.rival.energy = state.rival.maxEnergy;
    // Your ward absorbed Vex's answers this round; it fades as the new
    // round begins. Vex's new ward, if any, stands until your strikes land.
    state.player.block = 0;
    const drew = drawCards(state.player, 1, state.rng);
    if (drew.fatigued) {
      state.player.hp = Math.max(0, state.player.hp - 2);
      state.log.push({ who: 'system', text: 'Your deck is empty — the pact burns you for 2.' });
    }
    const drewRival = drawCards(state.rival, 1, state.rng);
    if (drewRival.fatigued) {
      state.rival.hp = Math.max(0, state.rival.hp - 2);
      state.log.push({ who: 'system', text: 'Vex deck is empty — the pact burns Vex for 2.' });
    }
    state.telegraph = chooseTelegraph(state.rng);
    checkEnd(state);
  }
  return events;
}

export function logLine(state, who, text) {
  state.log.push({ who, text });
  if (state.log.length > 8) state.log.shift();
}
