// This is browser input capability, not a persisted player preference.
let touchSeen = false;
const touchSubscribers = new Set<() => void>();

export function noteTouch(event: PointerEvent): void {
  if (event.pointerType !== "touch" || touchSeen) return;
  touchSeen = true;
  touchSubscribers.forEach((notify) => notify());
}

export function touchSnapshot(): boolean {
  return touchSeen || window.matchMedia("(pointer: coarse)").matches;
}

export function subscribeTouch(notify: () => void): () => void {
  const query = window.matchMedia("(pointer: coarse)");
  touchSubscribers.add(notify);
  query.addEventListener("change", notify);
  window.addEventListener("pointerdown", noteTouch, true);
  return () => {
    touchSubscribers.delete(notify);
    query.removeEventListener("change", notify);
    window.removeEventListener("pointerdown", noteTouch, true);
  };
}
