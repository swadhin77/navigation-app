/**
 * Build a human-readable route message
 */
export function buildRouteMessage({
  fromText,
  toText,
  stops = [],
  distance,
  duration,
}) {
  let message = `📍 Route Details\n\n`;
  message += `From: ${fromText}\n`;
  message += `To: ${toText}\n\n`;

  if (stops.length > 0) {
    message += `Stops:\n`;
    stops.forEach((s, i) => {
      if (s?.name) {
        message += `${i + 1}. ${s.name}\n`;
      }
    });
    message += `\n`;
  }

  if (distance) {
    message += `Distance: ${(distance / 1000).toFixed(1)} km\n`;
  }

  if (duration) {
    message += `Duration: ${Math.round(duration / 60)} min\n`;
  }

  return message;
}

/**
 * Build a Google Maps fallback link
 * This opens the same route in Google Maps
 */
export function buildGoogleMapsLink({
  fromText,
  toText,
  stops = [],
}) {
  const baseUrl = "https://www.google.com/maps/dir/?api=1";

  // Encode origin & destination
  const origin = encodeURIComponent(fromText);
  const destination = encodeURIComponent(toText);

  // Waypoints (place names)
  const waypoints = stops
    .filter((s) => s?.name)
    .map((s) => encodeURIComponent(s.name))
    .join("|");

  let url = `${baseUrl}&origin=${origin}&destination=${destination}`;

  if (waypoints) {
    url += `&waypoints=${waypoints}`;
  }

  // Force driving mode
  url += `&travelmode=driving`;

  return url;
}

/**
 * Generate only the Google Maps shareable link
 */
export function generateShareableLink(routeData) {
  return buildGoogleMapsLink(routeData);
}

/**
 * Copy route link to clipboard
 */
export async function copyRouteLink(routeData) {
  try {
    const link = buildAppRouteLink(routeData);
    await navigator.clipboard.writeText(link);
    alert("Route link copied! Anyone can open it in the app.");
  } catch (err) {
    console.error(err);
    alert("Unable to copy route link. Route data missing.");
  }
}



/**
 * Share the route using native share (mobile)
 * or copy to clipboard (desktop fallback)
 */
export async function shareRoute(routeData) {
  const message = buildRouteMessage(routeData);
  const mapsLink = buildGoogleMapsLink(routeData);

  const finalText = `${message}\n🔗 Open in Maps:\n${mapsLink}`;

  // ✅ Modern browsers (Android / iOS)
  if (navigator.share) {
    try {
      await navigator.share({
        title: "Shared Route",
        text: finalText,
      });

      // Optional: success log or toast
      console.log("Route shared successfully");
    } catch (err) {
      // User cancelled share dialog (not an error)
      console.log("Share cancelled by user");
    }
  } else {
    // ✅ Desktop fallback
    try {
      await navigator.clipboard.writeText(finalText);
      alert("Route copied to clipboard. You can paste and share it.");
    } catch (err) {
      alert("Unable to copy route. Please try again.");
    }
  }
}
/**
 * Build YOUR APP route link (SAFE)
 */
export function buildAppRouteLink(routeData) {
  const points = routeData?.points || [];

  if (!Array.isArray(points) || points.length < 2) {
    throw new Error("Invalid route points");
  }

  const cleanPoints = points
    .filter(p => typeof p.lat === "number" && typeof p.lng === "number")
    .map(p => ({
      name: p.name || "",
      lat: p.lat,
      lng: p.lng,
    }));

  const encoded = encodeURIComponent(JSON.stringify(cleanPoints));

  return `${window.location.origin}/route?points=${encoded}`;
}
