// Ember Pact — keyboard and mouse input. Keys 1-5 play a card, arrows move
// the selection, Enter/Space plays the selected card, E ends the turn,
// M mutes, R restarts from an end screen.
export function attachInput(hooks) {
  const { onPlayCard, onEndTurn, onRestart, onMute, onSelect } = hooks;

  document.addEventListener('keydown', (ev) => {
    if (ev.repeat) return;
    const key = ev.key;
    if (key >= '1' && key <= '5') { onPlayCard(Number(key) - 1); return; }
    if (key === 'ArrowLeft' || key === 'ArrowRight') {
      onSelect(key === 'ArrowRight' ? 1 : -1);
      ev.preventDefault();
      return;
    }
    if (key === 'Enter' || key === ' ') { onSelect(0); ev.preventDefault(); return; }
    if (key === 'e' || key === 'E') { onEndTurn(); return; }
    if (key === 'm' || key === 'M') { onMute(); return; }
    if (key === 'r' || key === 'R') { onRestart(); return; }
    if (key === 'Escape') { onSelect(-99); return; }
  });

  document.addEventListener('pointerdown', () => hooks.onFirstGesture?.(), { once: true });
}
