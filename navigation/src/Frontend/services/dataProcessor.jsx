// /src/services/dataProcessor.js

import { processWeather } from "./weatherProcessor";
import { processMETAR } from "./metarProcessor";
import { processTraffic } from "./trafficProcessor";

export function combineSimulationData({ weather, metar, traffic }) {
  const w = processWeather(weather);
  const m = processMETAR(metar);
  const t = processTraffic(traffic);

  return {
    weather: w,
    metar: m,
    traffic: t,

    // Simulation Effects
    simulation: {
      fogDensity: m?.fogDensity ?? 0,
      wetness: w?.wetness ?? 0,
      cloudCoverage: w?.cloudCoverage ?? 0,
      windSpeed: w?.windSpeed ?? 0,
      slowdownFactor: t?.slowdownFactor ?? 1,
    },

    // UI/Debug/View layer
    debug: {
      weatherType: w?.type,
      visibility: m?.visibilityMeters ?? w?.visibility,
      congestion: t?.congestionLevel
    }
  };
}
