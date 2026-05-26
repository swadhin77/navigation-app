// /src/utils/geoutil.js

import { toRadians, toDegrees } from "./converters";

// Haversine distance (meters)
export function distanceMeters(lat1, lon1, lat2, lon2) {
  const R = 6371e3;
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(toRadians(lat1)) *
    Math.cos(toRadians(lat2)) *
    Math.sin(dLon/2) *
    Math.sin(dLon/2);

  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Bearing for map rotation / arrow
export function bearingDegrees(lat1, lon1, lat2, lon2) {
  const y = Math.sin(toRadians(lon2 - lon1)) * Math.cos(toRadians(lat2));
  const x =
    Math.cos(toRadians(lat1)) * Math.sin(toRadians(lat2)) -
    Math.sin(toRadians(lat1)) *
    Math.cos(toRadians(lat2)) *
    Math.cos(toRadians(lon2 - lon1));

  return (toDegrees(Math.atan2(y, x)) + 360) % 360;
}

// For map camera alignment
export function headingToMapRotation(heading) {
  return 360 - heading;
}
