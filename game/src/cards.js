// Ember Pact — the four suits and the card pool. Suits are told apart by
// colour AND shape (flame, snowflake, bolt, leaf), never by text alone.
// kind: attack deals damage, guard gains ward (block), spark surges,
// drain deals damage and heals half of it.
export const SUITS = {
  flame: { key: 'flame', name: 'Flame', color: '#e5484d', shape: 'flame' },
  frost: { key: 'frost', name: 'Frost', color: '#3e9bff', shape: 'flake' },
  spark: { key: 'spark', name: 'Spark', color: '#c98f00', shape: 'bolt' },
  thorn: { key: 'thorn', name: 'Thorn', color: '#3fbf6f', shape: 'leaf' },
};

// SVG emblem paths per suit shape, drawn inside every card's art window.
export const SUIT_PATHS = {
  flame: 'M32 4 C40 16 52 24 52 38 A20 20 0 1 1 12 38 C12 30 18 26 20 18 C24 24 26 26 28 26 C28 18 28 10 32 4 Z',
  flake: 'M32 6 V58 M6 32 H58 M13 13 L51 51 M51 13 L13 51 M32 6 L26 14 M32 6 L38 14 M32 58 L26 50 M32 58 L38 50 M6 32 L14 26 M6 32 L14 38 M58 32 L50 26 M58 32 L50 38',
  bolt: 'M36 4 L14 36 H28 L24 60 L48 26 H32 Z',
  leaf: 'M50 6 C22 10 10 28 12 52 C34 50 50 34 50 6 Z M20 44 C28 34 38 24 46 14',
};

export const CARD_POOL = [
  { id: 'cinder-fang',   name: 'Cinder Fang',   suit: 'flame', kind: 'attack', cost: 1, value: 4, text: 'Deal 4 damage.' },
  { id: 'ember-lash',    name: 'Ember Lash',    suit: 'flame', kind: 'attack', cost: 2, value: 6, text: 'Deal 6 damage.' },
  { id: 'wildfire',      name: 'Wildfire',      suit: 'flame', kind: 'attack', cost: 3, value: 8, text: 'Deal 8 damage.' },
  { id: 'ash-spit',      name: 'Ash Spit',      suit: 'flame', kind: 'attack', cost: 0, value: 2, text: 'Deal 2 damage. Free.' },
  { id: 'glacier-wall',  name: 'Glacier Wall',  suit: 'frost', kind: 'guard',  cost: 1, value: 5, text: 'Gain 5 ward.' },
  { id: 'rime-shield',   name: 'Rime Shield',   suit: 'frost', kind: 'guard',  cost: 2, value: 8, text: 'Gain 8 ward.' },
  { id: 'hoarfrost',     name: 'Hoarfrost',     suit: 'frost', kind: 'guard',  cost: 0, value: 3, text: 'Gain 3 ward. Free.' },
  { id: 'frostbite',     name: 'Frostbite',     suit: 'frost', kind: 'attack', cost: 1, value: 3, text: 'Deal 3 damage. Chills.' },
  { id: 'stormcall',     name: 'Stormcall',     suit: 'spark', kind: 'spark',  cost: 1, value: 4, text: 'Deal 4. Double if your last card was Spark.' },
  { id: 'volt-arc',      name: 'Volt Arc',      suit: 'spark', kind: 'spark',  cost: 2, value: 5, text: 'Deal 5. Double if your last card was Spark.' },
  { id: 'chain-surge',   name: 'Chain Surge',   suit: 'spark', kind: 'spark',  cost: 3, value: 7, text: 'Deal 7. Double if your last card was Spark.' },
  { id: 'static-snap',   name: 'Static Snap',   suit: 'spark', kind: 'spark',  cost: 0, value: 2, text: 'Deal 2. Double if your last card was Spark.' },
  { id: 'bramble-snare', name: 'Bramble Snare', suit: 'thorn', kind: 'drain',  cost: 1, value: 4, text: 'Deal 4, heal 2.' },
  { id: 'bloodroot',     name: 'Bloodroot',     suit: 'thorn', kind: 'drain',  cost: 2, value: 5, text: 'Deal 5, heal 3.' },
  { id: 'thorn-whip',    name: 'Thorn Whip',    suit: 'thorn', kind: 'attack', cost: 1, value: 5, text: 'Deal 5 damage.' },
  { id: 'seedling',      name: 'Seedling',      suit: 'thorn', kind: 'guard',  cost: 1, value: 4, text: 'Gain 4 ward. Heal 2.' },
];

export function cardById(id) {
  return CARD_POOL.find((c) => c.id === id);
}

// A 30-card deck: two copies of most cards, one of the heavy finishers.
export function deckList() {
  const counts = {
    'cinder-fang': 3, 'ember-lash': 2, 'wildfire': 1, 'ash-spit': 2,
    'glacier-wall': 3, 'rime-shield': 2, 'hoarfrost': 2, 'frostbite': 2,
    'stormcall': 2, 'volt-arc': 2, 'chain-surge': 1, 'static-snap': 2,
    'bramble-snare': 2, 'bloodroot': 1, 'thorn-whip': 2, 'seedling': 1,
  };
  const list = [];
  for (const [id, n] of Object.entries(counts)) {
    for (let i = 0; i < n; i++) list.push(id);
  }
  return list;
}

export function kindLabel(kind) {
  return { attack: 'Strike', guard: 'Ward', spark: 'Surge', drain: 'Drain' }[kind];
}
