// /src/services/trafficProcessor.js

export function processTraffic(raw) {
  if (!raw) return null;

  const incidents = raw?.TRAFFICITEMS?.TRAFFICITEM || [];

  let congestionLevel = 0;
  let slowdownFactor = 1;

  incidents.forEach(item => {
    const severity = item?.TRAFFICITEMDETAIL?.INCIDENTSEVERITY;
    
    if (severity === "severe") congestionLevel += 3;
    else if (severity === "major") congestionLevel += 2;
    else if (severity === "minor") congestionLevel += 1;
  });

  // Normalize congestion level
  const density = Math.min(congestionLevel / 10, 1);

  // affects speed
  slowdownFactor = 1 - density * 0.5; // 50% reduction max

  return {
    incidents,
    congestionLevel,
    density,          // 0 to 1
    slowdownFactor,   // 1 → normal, 0.5 → heavy traffic
  };
}
