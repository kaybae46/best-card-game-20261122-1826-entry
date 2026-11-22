// Ember Pact — deck, hand and discard piles.
import { shuffle } from './rng.js';
import { deckList } from './cards.js';

export function makeSide(rng) {
  const deck = shuffle(rng, deckList());
  return {
    hp: 40, maxHp: 40, block: 0,
    energy: 3, maxEnergy: 3,
    deck, hand: [], discard: [],
    lastSuit: null, pactStreak: 0,
  };
}

export function drawCards(side, n, rng) {
  const drawn = [];
  for (let i = 0; i < n; i++) {
    if (side.deck.length === 0) {
      if (side.discard.length === 0) return { drawn, fatigued: true };
      side.deck = shuffle(rng, side.discard);
      side.discard = [];
    }
    drawn.push(side.deck.pop());
  }
  side.hand.push(...drawn);
  while (side.hand.length > 7) side.discard.push(side.hand.pop());
  return { drawn, fatigued: false };
}

export function discardCard(side, handIndex) {
  const [id] = side.hand.splice(handIndex, 1);
  side.discard.push(id);
  return id;
}
