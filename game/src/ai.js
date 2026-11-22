// Ember Pact — Ashcaller Vex, the rival AI. Vex telegraphs the suit it
// favours next turn, so the player can read the intent and counter it
// (guard against Flame, race against Thorn). Vex mostly honours its
// telegraph, sometimes bluffs, and plays to win: lethal when it sees it,
// ward when it is hurting, drain when it is bleeding.
import { cardById, SUITS } from './cards.js';
import { pick } from './rng.js';

export const SUIT_KEYS = Object.keys(SUITS);

export function chooseTelegraph(rng) {
  return pick(rng, SUIT_KEYS);
}

// Score a card in the AI's hand for the current board.
export function scoreCard(card, ai, player) {
  let score = card.value;
  if (card.kind === 'attack' || card.kind === 'spark' || card.kind === 'drain') {
    if (player.hp <= card.value) score += 100; // lethal
    if (player.block > 0 && card.value <= player.block) score -= 3; // wasted on ward
  }
  if (card.kind === 'guard') {
    // Ward hard when Vex is bleeding or the player threatens lethal.
    const threat = player.hand.reduce((m, id) => Math.max(m, cardById(id).value), 0);
    score = ai.hp <= 12 ? card.value + 8 : card.value - 2;
    if (ai.hp <= threat + 4) score += 10;
    if (ai.block >= 8) score -= 5;
  }
  if (card.kind === 'drain') score += ai.hp <= 18 ? 4 : 1;
  if (card.kind === 'spark' && ai.lastSuit === 'spark') score += 6; // chained surge
  return score;
}

// Pick the cards Vex plays this turn: spend its 3 ember on the best-valued
// plays, favouring the telegraphed suit so its plan stays readable.
export function choosePlays(state, rng) {
  const ai = state.rival;
  const hand = ai.hand.map((id, i) => ({ id, i, card: cardById(id) }));
  const scored = hand.map((h) => {
    let score = scoreCard(h.card, ai, state.player);
    if (h.card.suit === state.telegraph) score += 2; // honour the telegraph
    return { ...h, score };
  });
  scored.sort((a, b) => b.score - a.score);
  const plays = [];
  let energy = ai.energy;
  for (const h of scored) {
    if (plays.length >= 3) break;
    if (h.card.cost > energy) continue;
    if (h.score < -2) continue; // never play a card that hurts the plan
    if (h.score < 0 && plays.length > 0) continue;
    plays.push(h.i);
    energy -= h.card.cost;
  }
  // A little unpredictability: sometimes Vex holds a card back.
  if (plays.length > 1 && rng() < 0.15) plays.pop();
  return plays;
}
