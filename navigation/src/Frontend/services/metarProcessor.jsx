// /src/services/metarProcessor.js

export function processMETAR(raw) {
  if (!raw) return null;

  const visibilityMeters = raw?.visibility?.meters || 10000;
  const windSpeed = raw?.wind_speed?.value || 0;
  const windDirection = raw?.wind_direction?.value || 0;

  // Convert visibility to fog density for engine
  const fogDensity = visibilityToFog(visibilityMeters);

  return {
    visibilityMeters,
    fogDensity,           // 0 → clear, 1 → dense fog
    windSpeed,
    windDirection
  };
}

// Helper conversion function
function visibilityToFog(vis) {
  // vis common range: 200m → 10000m
  if (vis > 8000) return 0.0;
  if (vis > 4000) return 0.2;
  if (vis > 2000) return 0.4;
  if (vis > 1000) return 0.6;
  if (vis > 500)  return 0.8;
  return 1.0;
}
