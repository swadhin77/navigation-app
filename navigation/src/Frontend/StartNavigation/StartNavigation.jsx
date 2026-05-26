import React, { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import { useLocation as useRouterLocation, useNavigate } from "react-router-dom";
import {
	FaVolumeUp,
	FaVolumeMute,
} from "react-icons/fa";
import "./StartNavigation.css";
import MapControls from "../components/MapControls";
import useLocation from "../hooks/useLocation";
import {
  toggle3DView,
  toggleSatelliteView
} from "../../view/mapViewControls";
// Constants
const STEP_COMPLETE_THRESHOLD_M = 35;
const OFF_ROUTE_THRESHOLD_M = 60;
const REROUTE_DEBOUNCE_MS = 4000;
const DIRECTIONS_DEBOUNCE_MS = 700;

export default function StartNavigation() {
	const navigate = useNavigate();
	const location = useRouterLocation();
	// Refs
	const mapContainer = useRef(null);
	const mapRef = useRef(null);
	const userMarkerRef = useRef(null);
	const lastRerouteAtRef = useRef(0);
	const rerouteTimeoutRef = useRef(null);
	const mountedRef = useRef(true);
	const lastGPS = useRef({ lat: null, lng: null });
	const stopMarkersRef = useRef([]); 
	const trackCoordsRef = useRef([]);
	const lastSpeedFetch = useRef(0);
	const [pendingRoute, setPendingRoute] = useState(null); 
	const [pendingDelta, setPendingDelta] = useState(null);
	const [showRoutePopup, setShowRoutePopup] = useState(false);
	const popupTimeoutRef = useRef(null);
	const [weather, setWeather] = useState(null);
	const [nextUpdate, setNextUpdate] = useState(900); // 15 min
	const [weatherPopupOpen, setWeatherPopupOpen] = useState(false);
	const [userLat, setUserLat] = useState(null);
	const [userLng, setUserLng] = useState(null);

	const confirmNewRoute = () => {
	    if (!pendingRoute) return;
	    applyNewRoute(pendingRoute);
	    setPendingDelta(null);
	    setPendingRoute(null);
		rerouteTimeoutRef.current = null;
		durationRef.current = Math.round(pendingRoute.duration || 0);
		if (lastGPS.current.lat && lastGPS.current.lng) {
		    updateRemaining(lastGPS.current.lat, lastGPS.current.lng);
		}
		// clear ghost route
		if (mapRef.current?.getSource("ghost-route-src")) {
		    mapRef.current.getSource("ghost-route-src")
		      .setData({ type: "Feature", geometry: { type: "LineString", coordinates: [] } });
		}
	    setShowRoutePopup(false);
	};
	const spokenRef = useRef({
	  far: false,
	  med: false,
	  close: false,
	  turn: false,
	});


	const rejectNewRoute = () => {
	    setPendingRoute(null);
	    setPendingDelta(null);

   // clear ghost route
   if (mapRef.current?.getSource("ghost-route-src")) {
       mapRef.current.getSource("ghost-route-src")
	        .setData({ type: "Feature", geometry: { type: "LineString", coordinates: [] } });
   }

	    setShowRoutePopup(false);
	};


	// Received state (from /route)
	const {
		routeGeo = null,
		routeSteps = [],
		distance = 0,
		duration = 0,
		voiceEnabled: initialVoice = true,
		destinationCoords = null,
		profile: initialProfile = "driving",
		stops = [],
	} = location.state || {};
	useEffect(() => {
		if (location.state) {
			sessionStorage.setItem(
				"nav_state",
				JSON.stringify(location.state)
			);
		}
	}, []);
	const [isFollowing, setIsFollowing] = useState(true);


	useEffect(() => {
	  if (!userLat || !userLng) return;

	  const now = Date.now();

	  if (now - lastWeatherCallRef.current < 10000) return;

	  lastWeatherCallRef.current = now;

	  fetchWeather();

	}, [userLat, userLng]);
	const fetchWeather = async () => {
	  try {
	    if (!userLat || !userLng) return;

	    const API_KEY = import.meta.env.VITE_WEATHER_API_KEY;

	    const url = `https://api.tomorrow.io/v4/weather/realtime?location=${userLat},${userLng}&apikey=${API_KEY}`;

	    const res = await fetch(url);
	    const data = await res.json();

	    const values = data?.data?.values;

	    if (!values) return;

	    setWeather({
	      city: "Current Location",
	      temp: Math.round(values.temperature),
	      cond: values.weatherCode || "Clear",
	      wind: values.windSpeed || 0,
	      aqi: values.airQualityIndex || 1,
	    });

	    console.log("✅ Weather updated", values);

	  } catch (err) {
	    console.error("❌ Weather fetch error", err);
	  }
	};

	const toRad = (v) => (v * Math.PI) / 180;
	const haversine = (lat1, lng1, lat2, lng2) => {
		const R = 6371000;
		const dLat = toRad(lat2 - lat1);
		const dLng = toRad(lng2 - lng1);
		const a =
			Math.sin(dLat / 2) ** 2 +
			Math.cos(toRad(lat1)) *
			Math.cos(toRad(lat2)) *
			Math.sin(dLng / 2) ** 2;
		return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
	};
	// ===============================
	// 🚦 FETCH TRAFFIC SIGNALS (OSM)
	// ===============================
	async function fetchTrafficSignals(routeCoords) {

	  // ✅ DEBOUNCE START
	  const now = Date.now();

	  // allow only 1 call every 15 seconds
	  if (now - lastTrafficSignalCallRef.current < 15000) {
	    console.log("⛔ Skipping traffic signal API (rate limit protection)");
	    return [];
	  }

	  lastTrafficSignalCallRef.current = now;
	  // ✅ DEBOUNCE END

	  try {
	    if (!routeCoords || routeCoords.length === 0) return [];

	    // 🔥 Take limited points (performance + accuracy)
	    const sampled = routeCoords.filter((_, i) => i % 8 === 0);

	    const queries = sampled.map(
	      ([lng, lat]) =>
	        `node["highway"="traffic_signals"](around:80,${lat},${lng});`
	    ).join("\n");

	    const query = `
	      [out:json][timeout:25];
	      (
	        ${queries}
	      );
	      out body;
	    `;

	    console.log("🚦 Overpass Query:", query);

	    const res = await fetch("https://overpass-api.de/api/interpreter", {
	      method: "POST",
	      body: query,
	    });

	    const text = await res.text();

	    if (text.startsWith("<")) {
	      console.warn("Overpass returned XML error");
	      return [];
	    }

	    const data = JSON.parse(text);

	    console.log("🚦 Signals Found:", data);

	    return data.elements || [];

	  } catch (err) {
	    console.error("❌ Traffic signal fetch error", err);
	    return [];
	  }
	}
	const distToSegment = (p, a, b) => {
		const [px, py] = p;
		const [ax, ay] = a;
		const [bx, by] = b;
		const dx = bx - ax;
		const dy = by - ay;
		if (dx === 0 && dy === 0) return haversine(py, px, ay, ax);
		const t = ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy);
		if (t <= 0) return haversine(py, px, ay, ax);
		if (t >= 1) return haversine(py, px, by, bx);
		const projX = ax + t * dx;
		const projY = ay + t * dy;
		return haversine(py, px, projY, projX);
	};

	const speakInstruction = (text) => {
		if (!voiceEnabled || !text) return;

		window.speechSynthesis.cancel(); // 🔑 clear previous
		const u = new SpeechSynthesisUtterance(text);
		u.lang = "en-US";
		u.rate = 1;
		u.pitch = 1;
		window.speechSynthesis.speak(u);
	};


	/* ✅ ADD THIS IMMEDIATELY AFTER speakInstruction */
	const toggleVoice = () => {
		setVoiceEnabled((prev) => {
			if (prev) {
				window.speechSynthesis.cancel(); // stop speaking immediately
			} else {
				speakInstruction("Voice guidance on");
			}
			return !prev;
		});
	};

	// Build bounding box for incidents
	const buildBBox = (coords) => {
	  let minX = 999, minY = 999, maxX = -999, maxY = -999;
	  coords.forEach(([x, y]) => {
	    if (x < minX) minX = x;
	    if (x > maxX) maxX = x;
	    if (y < minY) minY = y;
	    if (y > maxY) maxY = y;
	  });
	  return [minX, minY, maxX, maxY];
	};

	const formatMeters = (m) =>
		m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${Math.round(m)} m`;

	const formatDuration = (s) => {
		const mins = Math.round(s / 60);
		if (mins < 60) return `${mins} min`;
		return `${Math.floor(mins / 60)} hr ${mins % 60} min`;
	};

	// =====================================
	// SPEED LIMIT DETECTION
	// =====================================
	const fetchSpeedLimit = async (lat, lng) => {
	  try {

	    const token = import.meta.env.VITE_MAPBOX_TOKEN;

	    const url =
	      `https://api.mapbox.com/matching/v5/mapbox/driving/${lng},${lat}?annotations=maxspeed&geometries=geojson&steps=false&access_token=${token}`;

	    const res = await fetch(url);
	    const data = await res.json();

	    const speed =
	      data?.matchings?.[0]?.legs?.[0]?.annotation?.maxspeed?.[0]?.speed;

	    if (speed) {
	      setSpeedLimit(speed);
	    }

	  } catch (err) {
	    console.warn("speed limit fetch error", err);
	  }
	};

	// create a stop marker on the map and keep a ref to it
	const createStopMarker = (stop, label) => {
	  if (!mapRef.current || !stop) return null;

	  const el = document.createElement("div");
	  el.className = "nav-stamp-marker";
	  el.innerText = label;

	  const marker = new mapboxgl.Marker({ element: el, anchor: "bottom" })
	    .setLngLat([stop.lng, stop.lat])
	    .addTo(mapRef.current);

	  return marker;
	};

	// ===============================
	// 🚦 ADD TRAFFIC SIGNAL MARKERS
	// ===============================
	const trafficSignalMarkersRef = useRef([]);
	const lastTrafficSignalCallRef = useRef(0);
	const addTrafficSignalsToMap = (signals) => {
	  if (!mapRef.current) return;

	  // clear old
	  trafficSignalMarkersRef.current.forEach(m => m.remove());
	  trafficSignalMarkersRef.current = [];

	  signals.forEach(signal => {
	    const el = document.createElement("div");
	    el.className = "traffic-signal-marker";

	    el.innerHTML = `
	      <div class="light red"></div>
	      <div class="light yellow"></div>
	      <div class="light green"></div>
	    `;

	    const marker = new mapboxgl.Marker({ element: el })
	      .setLngLat([signal.lng, signal.lat])
	      .addTo(mapRef.current);

	    trafficSignalMarkersRef.current.push(marker);
	  });
	};
	const clearAllStopMarkers = () => {
		try {
			stopMarkersRef.current.forEach((m) => {
				if (m && typeof m.remove === "function") m.remove();
			});
		} catch { }
		stopMarkersRef.current = [];
	};

	// ---------- map init ----------
	useEffect(() => {
		if (!mapContainer.current || !routeFeature) return;
		if (mapRef.current) return;

		mapRef.current = new mapboxgl.Map({
			container: mapContainer.current,
			center: routeFeature.coordinates[0],
			style: "mapbox://styles/mapbox/dark-v11", 
			zoom: 16,
			pitch: 70,
			bearing: 0,
			antialias: true,
		});

		mapRef.current.addControl(new mapboxgl.NavigationControl(), "top-right");

		mapRef.current.on("load", () => {
			mapRef.current.doubleClickZoom.disable();
			mapRef.current.addSource("route-src", {
				type: "geojson",
				data: { type: "Feature", geometry: routeFeature },
			});

			mapRef.current.addLayer({
				id: "route-layer",
				type: "line",
				source: "route-src",
				paint: {
				  "line-color": "#00E5FF",
				  "line-width": 7,
				  "line-blur": 1.2,
				  "line-opacity": 0.95
				},
				layout: { "line-cap": "round", "line-join": "round" },
			});
			mapRef.current.addLayer({
			  id: "route-glow-layer",
			  type: "line",
			  source: "route-src",
			  paint: {
			    "line-color": "#00E5FF",
			    "line-width": 18,
			    "line-opacity": 0.25,
			    "line-blur": 8
			  }
			});
			// ghost route source
			mapRef.current.addSource("ghost-route-src", {
			  type: "geojson",
			  data: { type: "Feature", geometry: { type: "LineString", coordinates: [] } },
			});

			// ghost route layer (dashed, semi-transparent)
			mapRef.current.addLayer({
			  id: "ghost-route-layer",
			  type: "line",
			  source: "ghost-route-src",
			  paint: {
			    "line-color": "#1E90FF",
			    "line-width": 5,
			    "line-opacity": 0.4,
			    "line-dasharray": [2, 2],
			  },
			  layout: { "line-cap": "round", "line-join": "round" },
			});
			mapRef.current.addSource("traffic-src", {
			  type: "geojson",
			  data: { type: "FeatureCollection", features: [] },
			});

			mapRef.current.addLayer({
			  id: "traffic-layer",
			  type: "line",
			  source: "traffic-src",
			  paint: {
			    "line-width": 6,
			    "line-color": ["get", "color"],
			    "line-opacity": 0.9,
			  },
			  layout: { "line-cap": "round", "line-join": "round" },
			});
			mapRef.current.addSource("track-src", {
			  type: "geojson",
			  data: {
			    type: "Feature",
			    geometry: {
			      type: "LineString",
			      coordinates: []
			    }
			  }
			});

			mapRef.current.addLayer({
			  id: "track-layer",
			  type: "line",
			  source: "track-src",
			  paint: {
			    "line-color": "#00FF7F",
			    "line-width": 5,
			    "line-opacity": 0.8
			  }
			});

			// Detect manual map movement → stop following
			mapRef.current.on("dragstart", () => setIsFollowing(false));
			mapRef.current.on("zoomstart", () => setIsFollowing(false));
			mapRef.current.on("rotatestart", () => setIsFollowing(false));

			// user marker (start at first coord)
			const el = document.createElement("div");
			el.className = "user-marker";
			el.style.transition = "transform 0.2s linear";
			el.style.cssText = `
	      width: 38px;
	      height: 38px;
	      background: #2b87ff;
	      border-radius: 50%;
	      border: 4px solid #fff;
	      box-shadow: 0 4px 10px rgba(0,0,0,0.3);
	  `;
			userMarkerRef.current = new mapboxgl.Marker({ element: el, anchor: "center" })
				.setLngLat(routeFeature.coordinates[0])
				.addTo(mapRef.current);

			// Add existing stops as markers (if any)
			clearAllStopMarkers();
			stopsState.forEach((s) => {
				const m = createStopMarker(s);
				if (m) stopMarkersRef.current.push(m);
			});

			// USER TAP ON MAP → Add new stop dynamically
			mapRef.current.on("click", (e) => {
				// if user clicked UI element overlay (optional), you can check e.originalEvent.target
				const { lng, lat } = e.lngLat;
				console.log("Dynamic Stop Added:", lng, lat);
				addDynamicStop(lng, lat);
			});
			startTrafficCheckLoop();
			(async () => {
			  if (routeFeature?.coordinates?.length) {
			    const signals = await fetchTrafficSignals(routeFeature.coordinates);

			    console.log("🚦 Signals:", signals);   // ✅ DEBUG
			    addTrafficSignalsToMap(signals);
			  }
			})();
			// =====================
			// 3D TERRAIN + SKY
			// =====================
			mapRef.current.addSource("mapbox-dem", {
			  type: "raster-dem",
			  url: "mapbox://mapbox.terrain-rgb",
			  tileSize: 512,
			  maxzoom: 14
			});

			mapRef.current.setTerrain({ source: "mapbox-dem", exaggeration: 1.2 });

			mapRef.current.addLayer({
			  id: "sky",
			  type: "sky",
			  paint: {
			    "sky-type": "atmosphere",
			    "sky-atmosphere-sun": [0.0, 0.0],
			    "sky-atmosphere-sun-intensity": 15
			  }
			});

			// =====================
			// 3D BUILDINGS
			// =====================
			const layers = mapRef.current.getStyle().layers;
			const labelLayerId = layers.find(
			  layer => layer.type === "symbol" && layer.layout["text-field"]
			)?.id;

			mapRef.current.addLayer(
			  {
			    id: "3d-buildings",
			    source: "composite",
			    "source-layer": "building",
			    filter: ["==", ["get", "extrude"], "true"],
			    type: "fill-extrusion",
			    minzoom: 15,
			    paint: {
			      "fill-extrusion-color": "#0f172a",
			      "fill-extrusion-height": ["get", "height"],
			      "fill-extrusion-base": ["get", "min_height"],
			      "fill-extrusion-opacity": 0.9
			    }
			  },
			  labelLayerId
			);
		});
		return () => {
			if (mapRef.current) {
			    mapRef.current.off("click");
			}
			if (mapRef.current) {
				try {
					mapRef.current?.off();
					mapRef.current.remove();
				} catch { }
				mapRef.current = null;
			}
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [routeFeature, stopsState]);
	/* =====================================================
	   DRAW STAMPS FOR FROM/STOP/TO
	===================================================== */
	useEffect(() => {
	  if (!mapRef.current) return;

	  clearAllStopMarkers();

	  const arr = [...stopsState];

	  // include final destination as "To"
	  if (destinationCoords) {
	    arr.push({ lat: destinationCoords.lat, lng: destinationCoords.lng, name: "Destination" });
	  }

	  arr.forEach((s, i) => {
	    let label =
	      i === 0 ? "From" :
	      i === arr.length - 1 ? "To" :
	      `Stop ${i}`;

	    const marker = createStopMarker(s, label);
	    if (marker) stopMarkersRef.current.push(marker);
	  });
	}, [stopsState, destinationCoords]);
	const buildTrafficSegments = (route) => {
	  const coords = route.geometry.coordinates;
	  const speeds = route.legs.flatMap(l => l.annotation?.speed || []); // m/s
	  const segs = [];
	  for (let i = 0; i < coords.length - 1; i++) {
	    const speed = speeds[i] || 12; // fallback
		const limit = 15; // approx (optional)
		let color;
		if (speed > limit * 0.9) color = "green";
		else if (speed > limit * 0.5) color = "yellow";
		else color = "red";
	    segs.push({
	      type: "Feature",
	      geometry: { type: "LineString", coordinates: [coords[i], coords[i+1]] },
	      properties: { color },
	    });
	  }
	  return segs;
	};
	// ---------- route apply (after reroute) ----------
	const applyNewRoute = (route) => {
		if (!route || !route.geometry) return;
		const newGeo = route.geometry;
		const newSteps = [];
		route.legs?.forEach((leg) =>
			leg.steps?.forEach((s) =>
				newSteps.push({
					distance: s.distance,
					duration: s.duration,
					maneuver: s.maneuver,
					name: s.name,
					geometry: s.geometry,
					raw: s,
				})
			)
		);

		setRouteFeature(newGeo);
		// 🚦 refresh traffic signals after reroute
		(async () => {
		  const signals = await fetchTrafficSignals(newGeo.coordinates);
		  addTrafficSignalsToMap(signals);
		})();
		const segs = buildTrafficSegments(route);
		if (mapRef.current?.getSource("traffic-src")) {
		  mapRef.current.getSource("traffic-src")
		    .setData({ type: "FeatureCollection", features: segs });
		}
		// Fetch hazards based on route bounding box
		const bbox = buildBBox(newGeo.coordinates);
		fetchIncidents(bbox);

		setStepsState(newSteps);
		setCurrentStepIndex(0);
		spokenRef.current = { far:false, med:false, close:false, turn:false };
		setRouteDistanceRemaining(Math.round(route.distance || 0));
		setRouteDurationRemaining(Math.round(route.duration || 0));
		durationRef.current = Math.round(route.duration || 0);
		if (mapRef.current?.getSource("route-src")) {
			mapRef.current.getSource("route-src").setData({ type: "Feature", geometry: newGeo });
			// update bounds smoothly
			const bounds = new mapboxgl.LngLatBounds();
			newGeo.coordinates.forEach((c) => bounds.extend(c));
			mapRef.current.fitBounds(bounds, { padding: 80 });
		}
	};


	const handleRecenter = () => {
		if (mapRef.current && lastGPS.current.lat) {
			mapRef.current.easeTo({
				center: [lastGPS.current.lng, lastGPS.current.lat],
				zoom: 17.5,
				pitch: 70,
				duration: 600,
			});
		}
		setIsFollowing(true);
	};
	const recenterMap = () => {
	  handleRecenter();
	};
	const toggleTraffic = () => {
	  if (!mapRef.current) return;

	  const newState = !trafficVisible;
	  setTrafficVisible(newState);

	  const visibility = newState ? "visible" : "none";

	  if (mapRef.current.getLayer("traffic-layer")) {
	    mapRef.current.setLayoutProperty(
	      "traffic-layer",
	      "visibility",
	      visibility
	    );
	  }
	};
	// ---------- reroute helper ----------
	const rerouteToStop = async (stop) => {
		if (!stop || !lastGPS.current.lat) return;
		const profileStr = profile === "walking" || profile === "cycling"
			? profile
			: "driving-traffic"; // traffic mode

		const url = `https://api.mapbox.com/directions/v5/mapbox/${profileStr}/${lastGPS.current.lng},${lastGPS.current.lat};${stop.lng},${stop.lat}?geometries=geojson&steps=true&overview=full&annotations=duration,distance,speed&access_token=${import.meta.env.VITE_MAPBOX_TOKEN}`;
		try {
			const res = await fetch(url);
			const data = await res.json();
			if (!data?.routes?.length) return;
			spokenRef.current = { far:false, med:false, close:false, turn:false };
			setPendingRoute(data.routes[0]);
			setShowRoutePopup(true);
			// update ghost route geometry
			const ghostGeo = data.routes[0].geometry;
			if (mapRef.current?.getSource("ghost-route-src")) {
			  mapRef.current.getSource("ghost-route-src")
			    .setData({ type: "Feature", geometry: ghostGeo });
			}

			// compute delta for stop reroute
			if (durationRef.current && data.routes[0].duration) {
			  const diffSec = durationRef.current - data.routes[0].duration;
			  const diffMin = Math.round(diffSec / 60);
			  if (diffMin > 0) {
			     setPendingDelta({ type: "faster", minutes: diffMin });
			  } else if (diffMin < 0) {
			     setPendingDelta({ type: "slower", minutes: Math.abs(diffMin) });
			  } else {
			     setPendingDelta(null);
			  }
			}
			if (popupTimeoutRef.current) clearTimeout(popupTimeoutRef.current);
			popupTimeoutRef.current = setTimeout(() => rejectNewRoute(), 10000);

		} catch (err) {
			console.error("rerouteToStop error", err);
		}
	};

	const performReroute = async (curLat, curLng) => {
		try {
			const dest = destinationCoords
				? [destinationCoords.lng, destinationCoords.lat]
				: routeFeature.coordinates[routeFeature.coordinates.length - 1];
			const profileStr = profile === "walking" || profile === "cycling"
				? profile
				: "driving-traffic";

			const url = `https://api.mapbox.com/directions/v5/mapbox/${profileStr}/${curLng},${curLat};${dest[0]},${dest[1]}?geometries=geojson&steps=true&overview=full&annotations=duration,distance,speed&access_token=${import.meta.env.VITE_MAPBOX_TOKEN}`;
			const res = await fetch(url);
			const data = await res.json();
			if (!data?.routes?.length) return;
			setPendingRoute(data.routes[0]);
			setShowRoutePopup(true);
			// update ghost route geometry
			const ghostGeo = data.routes[0].geometry;
			if (mapRef.current?.getSource("ghost-route-src")) {
			  mapRef.current.getSource("ghost-route-src")
			    .setData({ type: "Feature", geometry: ghostGeo });
			}

			// compute delta for off-route reroute
			if (durationRef.current && data.routes[0].duration) {
			  const diffSec = durationRef.current - data.routes[0].duration;
			  const diffMin = Math.round(diffSec / 60);
			  if (diffMin > 0) {
			    setPendingDelta({ type: "faster", minutes: diffMin });
			  } else if (diffMin < 0) {
			     setPendingDelta({ type: "slower", minutes: Math.abs(diffMin) });
			  } else {
			     setPendingDelta(null);
			  }
			}
			if (popupTimeoutRef.current) clearTimeout(popupTimeoutRef.current);
			popupTimeoutRef.current = setTimeout(() => rejectNewRoute(), 10000);
			spokenRef.current = { far:false, med:false, close:false, turn:false };
		} catch (err) {
			console.error("performReroute error", err);
		}
	};

	// ===============================================================
	// 🔥 SIMULATED GPS — ONLY FOR DEVELOPMENT (Laptop Testing)
	// ===============================================================
	const simIndexRef = useRef(0);

	useEffect(() => {
	  if (!import.meta.env.DEV) return;
	  if (!routeFeature?.coordinates?.length) return;

	  console.log("%cSimulated GPS enabled (DEV only)", "color: orange; font-weight: bold;");

	  const coords = routeFeature.coordinates;

	  // ✅ Initial position (only once)
	  if (simIndexRef.current === 0) {
	    const [lng0, lat0] = coords[0];

	    lastGPS.current = { lat: lat0, lng: lng0 };
	    setUserLat(lat0);
	    setUserLng(lng0);

	    userMarkerRef.current?.setLngLat([lng0, lat0]);

	    if (mapRef.current) {
	      mapRef.current.easeTo({
	        center: [lng0, lat0],
	        zoom: 17,
	        pitch: 60,
	        duration: 0,
	      });
	    }

	    setIsFollowing(true);
	  }

	  const interval = setInterval(() => {
	    const i = simIndexRef.current;

	    if (!coords[i]) return;

	    const [lng, lat] = coords[i];
		setUserLat(lat);
		setUserLng(lng);
	    // ✅ Update GPS
	    lastGPS.current = { lat, lng };
		if (userMarkerRef.current) {
		  const marker = userMarkerRef.current;

		  const start = marker.getLngLat();
		  const end = { lng, lat };

		  const steps = 10;
		  let i = 0;

		  const animate = () => {
		    if (i >= steps) return;

		    const newLng = start.lng + (end.lng - start.lng) * (i / steps);
		    const newLat = start.lat + (end.lat - start.lat) * (i / steps);

		    marker.setLngLat([newLng, newLat]);

		    i++;
		    requestAnimationFrame(animate);
		  };

		  animate();
		}

	    // ✅ Camera follow
	    if (mapRef.current && isFollowing) {
	      mapRef.current.easeTo({
	        center: [lng, lat],
	        zoom: 17,
	        pitch: 60,
	        duration: 800,
	      });
	    }

	    // ✅ Fake speed
	    const fakeSpeed = 6 + Math.random() * 6;

	    const fakePos = {
	      coords: {
	        latitude: lat,
	        longitude: lng,
	        speed: fakeSpeed,
	        heading: 90,
	      },
	    };

	    setNavigationStarted(true);
	    setSpeed(Math.round(fakeSpeed * 3.6));
		// call every 10 sec (avoid spam)
		if (Date.now() - lastSpeedFetch.current > 10000) {
		  lastSpeedFetch.current = Date.now();
		  fetchSpeedLimit(lat, lng);
		}
	    // ✅ Navigation updates
	    updateRemaining(lat, lng);
	    handleStepCompletion(fakePos);
	    checkStopArrival(fakePos);
	    handleOffRoute(fakePos);

	    // ✅ Move forward (NO RESET)
	    simIndexRef.current++;

	    if (simIndexRef.current >= coords.length) {
	      simIndexRef.current = coords.length - 1; // stop at destination
	    }

	  }, 1200); // slightly smoother

	  return () => clearInterval(interval);

	}, [routeFeature]); // ✅ IMPORTANT: removed isFollowing
	

	// ---------- dynamic stop functions ----------
	const addDynamicStop = (lng, lat) => {
		// create a new stop object
		const newStop = {
			name: "Added Stop",
			lng,
			lat,
		};

		// insert new stop after current stop index (so it becomes the next stop)
		const insertAt = Math.max(0, stopIndex + 1);
		const updated = [...stopsState];
		updated.splice(insertAt, 0, newStop);

		// update state (this will re-render and recreate markers in map load block)
		setStopsState(updated);

		// create and store marker for the new stop immediately
		const marker = createStopMarker(newStop);
		if (marker) stopMarkersRef.current.push(marker);

		// speak
		speakInstruction("Added a new stop. Rerouting to the next stop.");

		// reroute to the new stop immediately
		// but only if we have a valid lastGPS
		if (lastGPS.current.lat) {
			// call rerouteToStop with the new stop
			rerouteToStop(newStop);
		}
	};

	const checkStopArrival = (pos) => {
		if (!stopsState?.length) return;
		const userLat = pos.coords.latitude;
		const userLng = pos.coords.longitude;
		const currentStop = stopsState[stopIndex];
		if (!currentStop) return;

		const d = haversine(userLat, userLng, currentStop.lat, currentStop.lng);
		if (d < 30) {
			speakInstruction(`Arrived at ${currentStop.name}`);
			const next = stopIndex + 1;
			const updated = [...stopsState];
			updated.splice(stopIndex, 1);   // remove completed stop
			setStopsState(updated);

			if (next - 1 < updated.length) {
			    setStopIndex(next - 1);
			    rerouteToStop(updated[next - 1]);
			} else {
			    speakInstruction("All stops completed. Heading to final destination.");
			    performReroute(lastGPS.current.lat, lastGPS.current.lng);
			}
		}
	};
	const handleOffRoute = (pos) => {

		if (currentStepIndex >= stepsState.length - 1) return;
		if (!routeFeature?.coordinates?.length) return;
		const user = [pos.coords.longitude, pos.coords.latitude];
		const coords = routeFeature.coordinates;

		let minDist = Infinity;
		for (let i = 0; i < coords.length - 1; i++) {
			const d = distToSegment(user, coords[i], coords[i + 1]);
			if (d < minDist) minDist = d;
		}

		if (minDist > OFF_ROUTE_THRESHOLD_M) {
			const now = Date.now();
			if (now - lastRerouteAtRef.current > REROUTE_DEBOUNCE_MS) {
				lastRerouteAtRef.current = now;
				if (rerouteTimeoutRef.current) clearTimeout(rerouteTimeoutRef.current);
				rerouteTimeoutRef.current = setTimeout(() => {
					performReroute(pos.coords.latitude, pos.coords.longitude);
				}, DIRECTIONS_DEBOUNCE_MS);
			}
		}
	};

	const handleStepCompletion = (pos) => {
		// simple heuristic: if within threshold of maneuver location -> mark step done
		const curStep = stepsState[currentStepIndex];
		if (!curStep) return;

		// Some steps have maneuver.location = [lng, lat]
		const loc =
			curStep.maneuver?.location ||
			(curStep.geometry?.coordinates && curStep.geometry.coordinates[0]);

		if (!loc) return;
		const d = haversine(pos.coords.latitude, pos.coords.longitude, loc[1], loc[0]);
		if (d < STEP_COMPLETE_THRESHOLD_M) {
			const next = currentStepIndex + 1;
			if (next >= stepsState.length) {
			    speakInstruction("You have arrived at your destination");
				setTimeout(()=>{
				   alert("You have arrived at destination");
				},1000);
			    return;
			}

			setCurrentStepIndex(next);
			spokenRef.current = { far: false, med: false, close: false, turn: false };

			const nextInstr =
			    stepsState[next].maneuver?.instruction ||
			    stepsState[next].raw?.maneuver?.instruction;

			speakInstruction(nextInstr);
		}
	};

	const updateRemaining = (lat, lng) => {
		// Basic remaining distance: find nearest point in route and sum remaining segments
		if (!routeFeature?.coordinates?.length) return;
		const coords = routeFeature.coordinates;
		// find nearest index
		let nearestIdx = 0;
		let nearestDist = Infinity;
		for (let i = 0; i < coords.length; i++) {
			const d = haversine(lat, lng, coords[i][1], coords[i][0]);
			if (d < nearestDist) {
				nearestDist = d;
				nearestIdx = i;
			}
		}
		// sum remaining
		let remaining = 0;
		for (let i = nearestIdx; i < coords.length - 1; i++) {
			remaining += haversine(coords[i][1], coords[i][0], coords[i + 1][1], coords[i + 1][0]);
		}
		setRouteDistanceRemaining(Math.round(remaining));
		// approximate duration by proportion of original duration
		// avoid division by zero
		if (distance > 0) {
			setRouteDurationRemaining(Math.round((remaining / Math.max(1, distance)) * duration));
		}
		const cur = stepsState[currentStepIndex];
		// ===== LANE GUIDANCE EXTRACTION =====
		const lanes =
		  cur?.raw?.intersections?.[0]?.lanes ||
		  cur?.intersections?.[0]?.lanes ||
		  [];

		if (lanes.length) {
		  setLaneInfo(lanes);
		} else {
		  setLaneInfo([]);
		}
		if (currentStepIndex >= stepsState.length - 1) return;
		if (!cur) return;

		const maneuverLoc = cur.maneuver?.location || cur.geometry?.coordinates?.[0];
		if (!maneuverLoc) return;

		const dist = Math.round(haversine(lat, lng, maneuverLoc[1], maneuverLoc[0]));
		setStepDistRem(dist);

			   // FAR (Google = >1500m)
			   if (dist > 1500 && !spokenRef.current.far) {
			      speakInstruction(`In ${Math.round(dist/1000)} kilometers, ${cur.maneuver.instruction}`);
			      spokenRef.current.far = true;
			   }

			   // MED (Google = 800m)
			   if (dist <= 1500 && dist > 300 && !spokenRef.current.med) {
			      speakInstruction(`In ${Math.round(dist)} meters, ${cur.maneuver.instruction}`);
			      spokenRef.current.med = true;
			   }

			   // CLOSE (Google = 100m)
			   if (dist <= 300 && dist > 50 && !spokenRef.current.close) {
			      speakInstruction(`In ${Math.round(dist)} meters, ${cur.maneuver.instruction}`);
			      spokenRef.current.close = true;
			   }

			   // TURN (Execute)
			   if (dist <= 40 && !spokenRef.current.turn) {
			      speakInstruction(cur.maneuver.instruction);
			      spokenRef.current.turn = true;
			   }
			};
	const trafficIntervalRef = useRef(null);
	const lastTrafficReroute = useRef(0);
	const durationRef = useRef(routeDurationRemaining);

	useEffect(() => {
		durationRef.current = routeDurationRemaining;
	}, [routeDurationRemaining]);
	// Fetch hazard/incident data
	const fetchIncidents = async (bbox) => {
	  try {
	    const url = `https://api.mapbox.com/traffic/v1/incidents/${bbox.join(",")}?access_token=${import.meta.env.VITE_MAPBOX_TOKEN}`;
	    const res = await fetch(url);
	    const data = await res.json();
	    if (data?.incidents) setIncidents(data.incidents);
	  } catch (err) {
	    console.warn("fetchIncidents error", err);
	  }
	};

	const startTrafficCheckLoop = () => {
		if (trafficIntervalRef.current) return;

		trafficIntervalRef.current = setInterval(async () => {

			if (!lastGPS.current.lat) return;
			if (rerouteTimeoutRef.current) return; // off-route rerouting in progress

			const now = Date.now();
			if (now - lastTrafficReroute.current < 15000) return; // 15 sec cooldown

			const dest = destinationCoords
				? [destinationCoords.lng, destinationCoords.lat]
				: routeFeature.coordinates[routeFeature.coordinates.length - 1];

			const profileStr = profile === "walking" || profile === "cycling"
				? profile
				: "driving-traffic";

			const url = `https://api.mapbox.com/directions/v5/mapbox/${profileStr}/${lastGPS.current.lng},${lastGPS.current.lat};${dest[0]},${dest[1]}?geometries=geojson&steps=true&overview=full&annotations=duration,distance,speed&access_token=${import.meta.env.VITE_MAPBOX_TOKEN}`;

			try {
				const res = await fetch(url);
				const data = await res.json();
				if (!data?.routes?.length) return;

				const newRoute = data.routes[0];
				const segs = buildTrafficSegments(newRoute);
				if (mapRef.current?.getSource("traffic-src")) {
				   mapRef.current.getSource("traffic-src").setData({
				        type: "FeatureCollection",
				        features: segs
				   });
				}
				const newDuration = Math.round(newRoute.duration);
				let diffMin = null;
				if (newDuration + 30 < durationRef.current) {
				    const diffSec = durationRef.current - newDuration;
				    diffMin = Math.round(diffSec / 60);
				}

				if (diffMin !== null) {
				    setPendingDelta({ type: "faster", minutes: diffMin });
				    setPendingRoute(newRoute);

				    // update ghost route
				    const ghostGeo = newRoute.geometry;
				    if (mapRef.current?.getSource("ghost-route-src")) {
				        mapRef.current.getSource("ghost-route-src")
				            .setData({ type: "Feature", geometry: ghostGeo });
				    }

				    setShowRoutePopup(true);

				    if (popupTimeoutRef.current) clearTimeout(popupTimeoutRef.current);
				    popupTimeoutRef.current = setTimeout(() => rejectNewRoute(), 10000);

				    lastTrafficReroute.current = now;
				}
				}
			 catch (err) {
				console.warn("traffic refresh failed", err);
			}

		}, 7000);
	};

	// ---------- cleanup ----------
	useEffect(() => {
		return () => {
			mountedRef.current = false;
			if (rerouteTimeoutRef.current) clearTimeout(rerouteTimeoutRef.current);
			if (popupTimeoutRef.current) clearTimeout(popupTimeoutRef.current);
			window.speechSynthesis.cancel();
			clearAllStopMarkers();
			// remove traffic signals
			trafficSignalMarkersRef.current.forEach(m => m.remove());
			trafficSignalMarkersRef.current = [];
			if (mapRef.current) {
				mapRef.current?.off();
				mapRef.current.remove();
				mapRef.current = null;
			}
			if (trafficIntervalRef.current) clearInterval(trafficIntervalRef.current);
			trafficIntervalRef.current = null;

		};
	}, []);

	// ---------- UI actions ----------
	const handleEndNavigation = () => {

	    // Reroute popup cleanup
	    setShowRoutePopup(false);
	    setPendingRoute(null);
	    setPendingDelta(null);

	    // Ghost route cleanup
	    if (mapRef.current?.getSource("ghost-route-src")) {
	        mapRef.current.getSource("ghost-route-src")
	            .setData({ type: "Feature", geometry: { type: "LineString", coordinates: [] } });
	    }

	    // Stop GPS + voice + traffic
	    window.speechSynthesis.cancel();

	    if (trafficIntervalRef.current) {
	        clearInterval(trafficIntervalRef.current);
	        trafficIntervalRef.current = null;
	    }

	    // Navigate away AFTER cleanup
	    navigate("/dashboard", { state: { navigationEnded: true } });
	};


	// center/format text to show
	const currentStep = stepsState[currentStepIndex] || {};
	const instruction =
		currentStep.maneuver?.instruction ||
		currentStep.raw?.maneuver?.instruction ||
		"Proceed";
		const aqiLabel = (v) => {
		  if (!v) return "-";
		  const map = {
		    1: "Good",
		    2: "Fair",
		    3: "Moderate",
		    4: "Poor",
		    5: "Very Poor",
		  };
		  return map[v] || "-";
		};
	// Render
	return (
		<div className="startnav-screen">
			{/* MAP */}
			<div ref={mapContainer} className="nav-map" />

			{/* TURN CARD */}
			<div className="nav-center">
				<div className="turn-card">
				<div className="instr-large">{instruction}</div>

				{laneInfo.length > 0 && (
				  <div className="lane-guidance">
				    {laneInfo.map((lane, i) => {
				      let arrow = "↑";

				      const dir = lane.indications?.[0];

				      if (dir === "left") arrow = "↰";
				      if (dir === "right") arrow = "↱";
				      if (dir === "straight") arrow = "↑";
				      if (dir === "slight right") arrow = "↗";
				      if (dir === "slight left") arrow = "↖";

				      return (
				        <div
				          key={i}
				          className={`lane-arrow ${lane.valid ? "active" : ""}`}
				        >
				          {arrow}
				        </div>
				      );
				    })}
				  </div>
				)}

				<div className="instr-small">
				{currentStep?.name || "Road"} • {stepDistRem != null ? formatMeters(stepDistRem) : "..."}
				</div>
				</div>
			</div>
			{/* FLOATING CONTROLS */}
			<div className="floating-controls">
			   <button className="float-btn sound" onClick={toggleVoice}>
			      {voiceEnabled ? <FaVolumeUp/> : <FaVolumeMute/>}
			   </button>

			   <div className="speed-panel">

			     <div className={`speed-current ${overspeed ? "overspeed" : ""}`}>
			       {speed}
			       <span>km/h</span>
			     </div>

			     {speedLimit && (
			       <div className="speed-limit">
			         {speedLimit}
			       </div>
			     )}

			   </div>
			</div>

			<MapControls
						     mapRef={mapRef}
						     is3DView={is3DView}
						     setIs3DView={setIs3DView}
						     isSatelliteView={isSatelliteView}
						     setIsSatelliteView={setIsSatelliteView}
						     trafficVisible={trafficVisible}
						     toggleTraffic={toggleTraffic}
						     recenterMap={recenterMap}
						     setShowWeather={setWeatherPopupOpen}
						     isOnline={true}
						     theme="dark"
						     toggle3DView={toggle3DView}
						     toggleSatelliteView={toggleSatelliteView}
						     showLimitedControls={true}
						   />

			{/* BOTTOM BOX */}
			<div className="bottom-center-nav">
			    <div className="nav-row">			    
			    <button className="nav-close-btn" onClick={() => navigate(-1)}>Close</button>

			    <div className="nav-center-mini">
			        <div className="nav-info-distance">{formatMeters(routeDistanceRemaining)}</div>
			        <div className="nav-info-duration">{formatDuration(routeDurationRemaining)}</div>
			    </div>

				{weather && (
				    <div className="nav-weather-compact" onClick={() => setWeatherPopupOpen(true)}>
				        <div className="nav-weather-city">{weather.city}</div>
				        <div className="nav-weather-temp">{weather.temp}°C</div>
				        <div className="nav-weather-cond">{weather.cond}</div>
				    </div>
				)}

			    <button className="nav-start-btn" onClick={handleEndNavigation}>End</button>
				</div>
			</div>

			{!isFollowing && (
				<button className="recenter-btn" onClick={handleRecenter}>
					Re-center
				</button>
			)}

			{/* STEPS OVERLAY */}

			{showRoutePopup && (
			  <div className="route-popup">
			     <div className="route-popup-title">
			        New route available
			     </div>
			    {pendingDelta && (
			      <div className={`route-delta-badge ${pendingDelta.type}`}>
			        {pendingDelta.type === "faster" && `Save ${pendingDelta.minutes} min`}
			        {pendingDelta.type === "slower" && `${pendingDelta.minutes} min slower`}
			      </div>
			    )}

			     <div className="route-popup-actions">
			       <button className="route-btn-yes" onClick={confirmNewRoute}>Use</button>
			       <button className="route-btn-no" onClick={rejectNewRoute}>Keep</button>
			     </div>
			  </div>
			)}
			{weatherPopupOpen && (
			   <div className="weather-popup-overlay" onClick={() => setWeatherPopupOpen(false)}>
			      <div className="weather-popup" onClick={(e)=>e.stopPropagation()}>
			         <div className="weather-popup-title">
			            {weather.city} • {weather.temp}°C {weather.cond}
			         </div>
			         <div className="weather-popup-row">
					 AQI: {aqiLabel(weather.aqi)} | Wind: {weather.wind} km/h
			         </div>
			         <div className="weather-popup-row">
			            Next update: {Math.floor(nextUpdate/60)} min
			            <button onClick={fetchWeather}>Refresh</button>
			         </div>
			      </div>
			   </div>
			)}

		</div>
	);
}
