let listeners = [];

export function onRateLimit(fn) {
  listeners.push(fn);
  return () => { listeners = listeners.filter(l => l !== fn); };
}

export function triggerRateLimit() {
  listeners.forEach(fn => fn());
}
