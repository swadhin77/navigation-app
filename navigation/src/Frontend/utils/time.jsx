// /src/utils/time.js

export function toLocalTime(ts) {
  return new Date(ts).toLocaleTimeString();
}

export function toLocalDate(ts) {
  return new Date(ts).toLocaleDateString();
}

export function now() {
  return Date.now();
}

// format HH:MM
export function formatClock(ts = Date.now()) {
  const d = new Date(ts);
  return `${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`;
}

// min interval check for loops
export function hasIntervalPassed(last, intervalMs) {
  return (Date.now() - last) >= intervalMs;
}
