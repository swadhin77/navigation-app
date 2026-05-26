import { useEffect, useState } from "react";
export default function useLocation() {
  const [location, setLocation] = useState({
    lat: null,
    lng: null,
    error: null,
  });
  useEffect(() => {
	const isBatterySaver = navigator.connection?.saveData || false;
    if (!navigator.geolocation) {
      setLocation((l) => ({
        ...l,
        error: "Geolocation not supported",
      }));
      return;
    }

	let lastSent = 0;
	let lastUIUpdate = 0;

	// 🔥 ADD THIS
	let lastLat = null;
	let lastLng = null;
	let lastMoveTime = Date.now();

	const BACKEND_INTERVAL = isBatterySaver ? 10000 : 5000;
	const UI_INTERVAL = isBatterySaver ? 2000 : 1000;

    const watchId = navigator.geolocation.watchPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;

        const now = Date.now();

        // ✅ 1. FAST UI UPDATE (every 1 sec)
        if (now - lastUIUpdate > UI_INTERVAL) {
          setLocation({
            lat,
            lng,
            error: null,
          });

          lastUIUpdate = now;
        }

		// ============================
		// 🚀 MOVEMENT DETECTION
		// ============================
		let moved = false;

		if (lastLat && lastLng) {
		  const dist = Math.sqrt(
		    Math.pow(lat - lastLat, 2) + Math.pow(lng - lastLng, 2)
		  );

		  if (dist > 0.00005) { // ~5 meters
		    moved = true;
		    lastMoveTime = now;
		  }
		}

		lastLat = lat;
		lastLng = lng;

		// ============================
		// 🧠 IDLE DETECTION
		// ============================
		const isIdle = now - lastMoveTime > 15000;

		// ============================
		// ⚡ ADAPTIVE INTERVAL
		// ============================
		let dynamicInterval = BACKEND_INTERVAL;

		const speed = pos.coords.speed || 0;
		const speedKmh = speed * 3.6;

		if (speedKmh > 40) {
		  dynamicInterval = 2000;
		} else if (speedKmh > 10) {
		  dynamicInterval = 3000;
		} else if (isIdle) {
		  dynamicInterval = 10000;
		}

		// ============================
		// 📡 BACKEND SEND
		// ============================
		if (now - lastSent > dynamicInterval) {
		  try {
		    const geo = await reverseGeocode(lat, lng);

		    await sendLocation({
		      lat,
		      lng,
		      address: geo.address,
		      pincode: geo.pincode,
		      type: isIdle ? "IDLE" : "AUTO",
		      speed: Math.round(speedKmh),
		      time: new Date().toLocaleTimeString("en-GB"),
		    });

		    console.log("📡 Smart send:", lat, lng, "interval:", dynamicInterval);

		    lastSent = now;
		  } catch (err) {
		    console.error("Location send error:", err);
		  }
		}
      },
      (err) => {
        setLocation((l) => ({
          ...l,
          error: err.message,
        }));
      },
	  {
	    enableHighAccuracy: !isBatterySaver,
	    maximumAge: isBatterySaver ? 5000 : 0,
	    timeout: 15000,
	  }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, []);
  return location;
}