// /src/utils/converters.js

export const toKnots = (mps) => mps * 1.94384;
export const toMps = (knots) => knots / 1.94384;

export const toKmh = (mps) => mps * 3.6;
export const toMpsFromKmh = (kmh) => kmh / 3.6;

export const toMiles = (km) => km * 0.621371;
export const toKm = (miles) => miles / 0.621371;

export const toDegrees = (rad) => rad * 180 / Math.PI;
export const toRadians = (deg) => deg * Math.PI / 180;

export const clamp = (val, min = 0, max = 1) => Math.max(min, Math.min(max, val));
