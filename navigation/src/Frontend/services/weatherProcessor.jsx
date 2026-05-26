// /src/services/weatherProcessor.js

export function processWeather(raw) {
  if (!raw) return null;

  const {
    weather,
    main,
    wind,
    clouds,
    rain,
    snow,
    visibility
  } = raw;

  const weatherType = weather?.[0]?.main || "Clear";

  const rainIntensity = rain?.["1h"] || 0;
  const snowIntensity = snow?.["1h"] || 0;

  return {
    type: weatherType,                         // "Rain", "Snow", "Clear", etc
    temperature: main?.temp ?? null,
    humidity: main?.humidity ?? null,
    windSpeed: wind?.speed ?? 0,
    cloudCoverage: clouds?.all ?? 0,           // % clouds
    rainIntensity,                             // mm/hr
    snowIntensity,                             // mm/hr
    wetness: Math.min(rainIntensity * 0.1, 1),  // 0 to 1 scale for road wetness
    visibility: visibility ?? 10000            // meters (OpenWeather gives raw)
  };
}
