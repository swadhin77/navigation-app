// /src/utils/transform.js

import { clamp } from "./converters";

// Visibility to fog for engine
export function visibilityToFog(visMeters) {
  const fog = 1 - Math.min(visMeters / 10000, 1);
  return clamp(fog, 0, 1);
}

// Rain to wetness
export function rainToWetness(rainMm) {
  const wet = Math.min(rainMm * 0.1, 1);
  return clamp(wet);
}

// Traffic slowdown calculation
export function congestionToSlowdown(density) {
  return clamp(1 - density * 0.5, 0.5, 1);
}
