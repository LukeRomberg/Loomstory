// Tiny pub/sub for whether *any* in-app navigation is currently pending.
// Both <Link>-based and router.push-based navigation feed this so the
// GlobalNavigationOverlay can render a single loading state.
//
// Ref-counted so concurrent transitions don't race each other into false.

let count = 0;
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((l) => l());
}

export function startNavigation() {
  count += 1;
  if (count === 1) notify();
}

export function endNavigation() {
  if (count === 0) return;
  count -= 1;
  if (count === 0) notify();
}

export function getIsNavigating() {
  return count > 0;
}

export function subscribeNavigation(fn: () => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}
