import React, { useEffect, useRef, useState } from "react";
import "./LiveLocation.css";
import { useLocationData } from "../context/LocationProvider";
const DURATIONS = {
  "15min": 15 * 60,
  "1hour": 60 * 60,
};

export default function LiveLocation({ open, onClose }) {
  const [status, setStatus] = useState("idle"); 
  const [error, setError] = useState("");
  const loc = useLocationData();
  const [locationLink, setLocationLink] = useState("");
  const [duration, setDuration] = useState("15min");
  const [remaining, setRemaining] = useState(0);

  const watchIdRef = useRef(null);
  const timerRef = useRef(null);

  const buildLink = (lat, lng) =>
    `https://www.google.com/maps?q=${lat},${lng}`;

  const stopSharing = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const startSharing = () => {
    if (!navigator.geolocation) {
      setError("Geolocation not supported");
      setStatus("error");
      return;
    }

    setStatus("loading");
    setError("");

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;

		setLocationLink(buildLink(latitude, longitude));

		sendLocation({
		  lat: latitude,
		  lng: longitude,
		  timestamp: Date.now(),
		});
        setRemaining(DURATIONS[duration]);
        setStatus("ready");
        // Countdown
        timerRef.current = setInterval(() => {
          setRemaining((prev) => {
            if (prev <= 1) {
              stopSharing();
              setStatus("expired");
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      },
      () => {
        setError("Location permission denied or unavailable");
        setStatus("error");
      },
      {
        enableHighAccuracy: false, // 🔑 prevents timeout on desktop
        timeout: 30000,
        maximumAge: 10000,
      }
    );
  };
  useEffect(() => {
    if (loc.lat != null && loc.lng != null && status === "ready") {
      setLocationLink(buildLink(loc.lat, loc.lng));
    }
  }, [loc, status]);
  useEffect(() => {
    if (open) startSharing();
    return stopSharing;
    // ⚠️ DO NOT depend on duration
  }, [open]);

  if (!open) return null;

  return (
    <div className="live-location-backdrop">
      <div className="live-location-sheet">
        <div className="live-location-header">
          <button className="back-btn" onClick={onClose}>←</button>
          <span>Share live location</span>
        </div>
 
        <div className="duration-row">
          <button
            className={duration === "15min" ? "active" : ""}
            onClick={() => setDuration("15min")}
          >
            15 min
          </button>
          <button
            className={duration === "1hour" ? "active" : ""}
            onClick={() => setDuration("1hour")}
          >
            1 hour
          </button>
        </div>

        {status === "loading" && (
          <div className="center">
            <div className="spinner" />
            <p>Fetching location…</p>
          </div>
        )}

        {status === "error" && (
          <div className="center">
            <p className="error">{error}</p>
            <button className="retry-btn" onClick={startSharing}>
              Retry
            </button>
          </div>
        )}

        {status === "expired" && (
          <div className="center">
            <p className="error">Link expired</p>
            <button className="retry-btn" onClick={startSharing}>
              Start again
            </button>
          </div>
        )}

        {status === "ready" && (
          <>
            <p className="info">
              Expires in {Math.floor(remaining / 60)}:
              {String(remaining % 60).padStart(2, "0")}
            </p>

            <input className="location-input" value={locationLink} readOnly />

            <button
              className="share-btn"
              onClick={() =>
                navigator.share
                  ? navigator.share({
                      title: "My live location",
                      text: "Track me here",
                      url: locationLink,
                    })
                  : navigator.clipboard.writeText(locationLink)
              }
            >
              Share location
            </button>

            <button
              className="copy-btn"
              onClick={() => navigator.clipboard.writeText(locationLink)}
            >
              Copy link
            </button>
          </>
        )}
      </div>
    </div>
  );
}
