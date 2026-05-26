// Route.jsx
import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import mapboxgl from "mapbox-gl";
mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;
import { useTraffic } from "../context/TrafficContext";
import "./Route.css";
import RouteSearchBar from "../RouteSearchBar/RouteSearchBar.jsx";
import MapControls from "../components/MapControls";
import {
 addTerrain,
 addSkyLayer,
 toggle3DView,
 toggleSatelliteView
} from "../../view/mapViewControls";
import useLocationHook from "../hooks/useLocation";
import { shareRoute, copyRouteLink } from "../ShareRoutes/shareRoute";
import { showToast } from "../Other/useToast";
import { useNavigationData } from "../Navigation/NavigationContext";
import { fetchRoute } from "../api/backend"; 

export default function Route() {
	const { lat, lng, error } = useLocationHook();
	const navigate = useNavigate();
	const location = useLocation();
	const [searchParams] = useSearchParams();

	/* =====================================================
	  DATA COMING FROM DASHBOARD (UNCHANGED)
	===================================================== */
	const {
	 destinationCoords = null,
	 destinationText = "",
	 origin = "current-location"
	} = location.state || {};


	/* =====================================================
	  🔑 GOOGLE MAPS STYLE — SINGLE ROUTE MODEL
	===================================================== */
	const [inputPoints, setInputPoints] = useState(
	 location.state?.points || [
	  { id: "from", name: "Current Location" },
	  { id: "to", name: destinationText },
	 ]
	);

	// 2️⃣ Resolved, confirmed points ONLY
	const [resolvedPoints, setResolvedPoints] = useState([]);

	useEffect(() => {
	 if (!destinationCoords) return;
	 if (!lat || !lng) return;

	 setInputPoints([
	  {
	   id: "from",
	   name: "Current Location",
	   lat: lat,
	   lng: lng,
	  },
	  {
	   id: "to",
	   name: destinationText,
	   lat: destinationCoords.lat,
	   lng: destinationCoords.lng,
	  },
	 ]);
	}, [lat, lng, destinationCoords, destinationText]);





	/* =====================================================
	  EXISTING STATES (KEPT)
	===================================================== */
	const [addressDetails, setAddressDetails] = useState(null);
	const parseContext = (ctx = []) => {
	  const out = {
	    street: null,
	    neighborhood: null,
	    locality: null,
	    district: null,
	    city: null,
	    region: null,
	    country: null,
	    postcode: null,
	  };

	  

		return () => {
		   mapRef.current?.off("load");
		   mapRef.current?.off();
		   markersRef.current.forEach(m => m.remove());
		   markersRef.current = [];

		   // ADD THIS
		   routeWeatherMarkersRef.current.forEach(m => m.remove());
		   routeWeatherMarkersRef.current = [];

		   mapRef.current?.remove();
		   mapRef.current = null;
		};
		};

	/* ==================== REBUILD ROUTE USEEFFECT ==================== */
	useEffect(() => {
		let cancelled = false;

		const resolvePoints = async () => {
			const finalPoints = [];

			for (const p of inputPoints) {
				if (p.lat && p.lng) {
					finalPoints.push(p);
					continue;
				}

				if (p.confirmed === true && p.name && p.name.length > 2) {
					const res = await fetch(
					 `${import.meta.env.VITE_API_URL}/api/search?query=${encodeURIComponent(p.name)}`
					);
					const data = await res.json();

					if (data.features?.length) {
						const [lng, lat] = data.features[0].center;
						finalPoints.push({ ...p, lat, lng });
					}
				}
			}

			if (!cancelled && finalPoints.length >= 2) {
				setResolvedPoints(finalPoints);
			}
		};

		resolvePoints();

		return () => {
			cancelled = true;
		};
	}, [inputPoints]);
	
	useEffect(() => {
	  if (!resolvedPoints.length || !mapReady) return;

	  const load = async () => {

		const API = import.meta.env.VITE_TOMORROW_API_KEY;

		const requests = resolvedPoints.map(async (p) => {

		  if (!p.lat || !p.lng) return null;


		  const weatherPromise = fetch(
		   `${import.meta.env.VITE_API_URL}/api/weather?lat=${p.lat}&lng=${p.lng}`
		  ).then(r => r.json());

		  const geoPromise = fetch(
		    `${import.meta.env.VITE_API_URL}/api/search?query=${p.lng},${p.lat}`
		  ).then(r => r.json());

		  const [w, geo] = await Promise.all([weatherPromise, geoPromise]);

		  // ✅ NULL SAFETY (VERY IMPORTANT)
		  if (!w || !w.data || !w.data.values) return null;

		  const localName =
		    geo.features?.[0]?.text ||
		    p.name ||
		    "Unknown";

		  return {
		    id: p.id,
		    label: p.id === "from"
		      ? "From"
		      : p.id === "to"
		      ? "To"
		      : "Stop",
		    temp: Math.round(w.data.values.temperature ?? 0),
		    desc: getWeatherDesc(w.data.values.weatherCode),
		    icon: w.data.values.weatherCode ?? "",
		    name: localName
		  };

		});

	   const results = await Promise.all(requests);

	   setWeatherPoints(results.filter(Boolean));

	  };

	  load();
	}, [resolvedPoints]);


	useEffect(() => {
	    if (!mapReady || resolvedPoints.length < 2) return;

	    const loadRoute = async () => {

	        const origin = resolvedPoints[0];
	        const dest = resolvedPoints[1];

	        if (!origin?.lat || !origin?.lng || !dest?.lat || !dest?.lng) {
	            console.warn("Invalid coordinates");
	            return;
	        }

	        try {
	            const data = await fetchRoute(origin, dest);
				const altSource = mapRef.current.getSource("alt-routes");

				if (altSource) {
				  altSource.setData({
				    type: "FeatureCollection",
				    features: data.routes.map((r, i) => ({
				      type: "Feature",
				      properties: {
				        routeIndex: i,
				        label: `${Math.round(r.duration / 60)} min`
				      },
				      geometry: r.geometry
				    }))
				  });
				}
				if (!data?.routes?.length) return;

				// ✅ STORE ALL ROUTES
				setRoutes(data.routes);

				// ✅ DEFAULT SELECT FIRST ROUTE
				const route = data.routes[0];

				setSelectedRouteIndex(0);
				setRouteGeo(route.geometry);
				setLiveDistance(route.distance);
				setLiveDuration(route.duration);

	            // ✅ DRAW ON MAP
	            const source = mapRef.current.getSource("preview-route");

	            if (source) {
	                source.setData({
	                    type: "Feature",
	                    geometry: route.geometry
	                });
	            }

	        } catch (err) {
	            console.error("Route fetch error:", err);
	        }
	    };

	    loadRoute();

	}, [resolvedPoints, mapReady, travelMode]);
	useEffect(() => {

	 if (!routeGeo) return;
	 routeWeatherMarkersRef.current.forEach(m => m.remove());
	 routeWeatherMarkersRef.current = [];

	 trafficTimer.current = setInterval(() => {
		if (!routes || routes.length === 0) return;
	  const selected = routes?.[selectedRouteIndex];

	  if(!selected) return;

	  // only refresh traffic layer
	  const congestion = selected.legs[0].annotation.congestion || [];
	  const coordinates = selected.geometry.coordinates;

	  const features = [];

	  for(let i=0;i<congestion.length;i++){
	   features.push({
	    type:"Feature",
	    properties:{congestion:congestion[i]},
	    geometry:{
	     type:"LineString",
	     coordinates:[coordinates[i],coordinates[i+1]]
	    }
	   });
	  }

	  const trafficSource = mapRef.current.getSource("route-traffic");

	  if(trafficSource){
	   trafficSource.setData({
	    type:"FeatureCollection",
	    features
	   });
	  }

	 },60000);

	 return () => clearInterval(trafficTimer.current);

	}, [routeGeo, resolvedPoints]);

	/* =====================================================
	   POINT MARKERS ON MAP (From / Stops / To)
	===================================================== */
	useEffect(() => {
		if (!mapRef.current) return;

		// clear old markers
		markersRef.current.forEach(m => m.remove());
		markersRef.current = [];

		resolvedPoints.forEach((p, i) => {
			let label;

			// BASE LABEL
			if (i === 0) label = "From";
			else if (i === resolvedPoints.length - 1) label = "To";
			else label = `Stop ${i}`;

			// PENDING STATE (no lat/lng)
			if (!p.lat || !p.lng) {
				label += " (pending)";
			}

			const el = document.createElement("div");
			el.className = "route-stamp-marker";
			const w = weatherPoints.find(x => x.id === p.id);

			el.innerHTML = `
			   <div class="marker-row">
			   ${w ? `
			      <span class="marker-label">${w.name || ''}</span>
			      <span class="marker-temp">${w.temp}°C</span>
			      <img class="marker-icon" src="${getWeatherIcon(w.icon)}" />
			   ` : `
			      <span class="marker-label">${label}</span>
			   `}

			   </div>
			`;

			const marker = new mapboxgl.Marker({
			   element: el,
			   anchor: "bottom",
			   offset: [0, -20]   // << SHOW ABOVE ROUTE
			});

			if (p.lat && p.lng) {
				marker.setLngLat([p.lng, p.lat]);
			} else {
				// place pending marker at map center so UI still shows label
				const center = mapRef.current.getCenter();
				marker.setLngLat(center);
			}

			marker.addTo(mapRef.current);

			marker.getElement().addEventListener("click", async () => {

			  // 1. Reverse geocode
			  const det = await fetch(
			    `https://api.mapbox.com/geocoding/v5/mapbox.places/${p.lng},${p.lat}.json?types=address,street,neighborhood,locality,place,district,region,postcode,country&limit=1&access_token=${import.meta.env.VITE_MAPBOX_TOKEN}`
			  ).then(r => r.json());

			  const f = det.features?.[0];
			  const ctx = parseContext(f?.context || []);

			  // 2. Optional weather lookup
			  const w = weatherPoints.find(x => x.id === p.id);

			  // 3. Remaining KM calculation
			  let remainingKm = null;
			  if (routeGeo?.coordinates?.length) {

			    const haversine = (lat1, lng1, lat2, lng2) => {
			      const R = 6371000;
			      const toRad = d => d * Math.PI / 180;
			      const a =
			        Math.sin(toRad(lat2-lat1)/2)**2 +
			        Math.cos(toRad(lat1))*Math.cos(toRad(lat2))*
			        Math.sin(toRad(lng2-lng1)/2)**2;
			      return 2 * R * Math.asin(Math.sqrt(a));
			    };

			    const idx = routeGeo.coordinates.findIndex(
			      ([lng,lat]) =>
			        Math.abs(lat - p.lat) < 0.002 &&
			        Math.abs(lng - p.lng) < 0.002
			    );

			    if (idx > 0) {
			      const seg = routeGeo.coordinates.slice(idx);
			      let m = 0;
			      for (let i=1; i<seg.length; i++) {
			        const [lng0,lat0] = seg[i-1];
			        const [lng1,lat1] = seg[i];
			        m += haversine(lat0,lng0,lat1,lng1);
			      }
			      remainingKm = Math.round(m/1000);
			    }
			  }

			  const remainStr = remainingKm !== null ? ` (${remainingKm} km remaining)` : "";

			  // 4. Close previous popup if open
			  if (currentPopupRef.current) currentPopupRef.current.remove();

			  // 5. Popup HTML
			  const html = `
			    <div style="
			      font-family: system-ui;
			      font-size: 13px;
			      background: white;
			      padding: 10px 12px;
			      border-radius: 8px;
			      box-shadow: 0 3px 14px rgba(0,0,0,0.25);
			      max-width: 240px;
			      line-height: 1.35;
			    ">
			      <div style="font-weight:700; font-size:14px; margin-bottom:4px;">
			        ${(f?.text || p.name || "Unknown")}${remainStr}
			      </div>
			      <div style="opacity:0.75; margin-bottom:6px;">
			        ${f?.place_name || ""}
			      </div>

			      ${ctx.locality ? `<div>${ctx.locality}</div>` : ""}
			      ${ctx.city ? `<div>${ctx.city}</div>` : ""}
			      ${ctx.region ? `<div>${ctx.region}</div>` : ""}
			      ${ctx.country ? `<div>${ctx.country}</div>` : ""}
			      ${ctx.postcode ? `<div>Pincode: ${ctx.postcode}</div>` : ""}

			      ${w ? `
			        <div style="margin-top:6px;">
					<b>${w.temp}°C</b>
					<span style="margin-left:6px; font-size:12px; opacity:0.8;">
					  ${getWeatherDesc(w.icon)}
					</span>
					<img class="marker-icon" src="${getWeatherIcon(w.icon)}" />
			        </div>
			      ` : ""}
			    </div>
			  `;

			  // 6. Center + popup
			  mapRef.current.easeTo({
			    center: [p.lng, p.lat],
			    duration: 350,
			    essential: true
			  });

			  const popup = new mapboxgl.Popup({ offset: 10, closeButton: true })
			    .setDOMContent(new DOMParser().parseFromString(html,"text/html").body.firstChild)
			    .setLngLat([p.lng, p.lat])
			    .addTo(mapRef.current);

			  currentPopupRef.current = popup;
			});
			markersRef.current.push(marker);
		});
	}, [resolvedPoints, weatherPoints]);
	const weatherCacheRef = useRef({});
	const lastWeatherCallRef = useRef(0);
	useEffect(() => {
	   if (!routeCheckpoints.length) return;


	   const weatherCache = weatherCacheRef.current;

	   const loadWeather = async () => {

	     const API = import.meta.env.VITE_TOMORROW_API_KEY;

		 const limited = routeCheckpoints.slice(0, 4); // ✅ LIMIT TO 4 ONLY

		 const requests = limited.map(async (cp) => {

	       const key = `${cp.lat},${cp.lng}`;

	       // ✅ CACHE HIT (NO API CALL)
	       if (weatherCache[key]) {
	         return weatherCache[key];
	       }

	       try {
			// ✅ RATE LIMIT (IMPORTANT)
			if (Date.now() - lastWeatherCallRef.current < 2000) {
			  return null;
			}
			lastWeatherCallRef.current = Date.now();
			await new Promise(r => setTimeout(r, 300));
			const res = await fetch(
			 `${import.meta.env.VITE_API_URL}/api/weather?lat=${cp.lat}&lng=${cp.lng}`
			);

	         const data = await res.json();

	         if (!res.ok || !data?.data?.values) {
	           console.error("Weather API Error:", data);
	           return null;
	         }

	         const result = {
	           lat: cp.lat,
	           lng: cp.lng,
	           temp: Math.round(data.data.values.temperature ?? 0),
	           icon: data.data.values.weatherCode ?? "",
	           name: cp.name
	         };

	         // ✅ SAVE TO CACHE
	         weatherCache[key] = result;

	         return result;

	       } catch (err) {
	         console.error("Weather fetch failed:", err);
	         return null;
	       }

	     });

	     const results = await Promise.all(requests);

	     setRouteWeather(results.filter(Boolean));
	   };

	   loadWeather();
	}, [routeCheckpoints, selectedRouteIndex]);

	useEffect(() => {
	   if (!mapRef.current) return;

	   // clear old markers
	   routeWeatherMarkersRef.current.forEach(m => m.remove());
	   routeWeatherMarkersRef.current = [];

	   routeWeather.forEach(w => {
	      const el = document.createElement("div");
	      el.className = "route-stamp-marker";

	      el.innerHTML = `
	         <div class="marker-row">
	            <span class="marker-label">${w.name || ''}</span>
	            <span class="marker-temp">${w.temp}°C</span>
	            <img class="marker-icon" src="${getWeatherIcon(w.icon)}"/>
	         </div>
	      `;

	      const marker = new mapboxgl.Marker({
	         element: el,
	         anchor: "bottom"
	      });

	      marker.setLngLat([w.lng, w.lat]);
	      marker.addTo(mapRef.current);
		  marker.getElement().addEventListener("click", async () => {
		    const det = await fetch(
		      `https://api.mapbox.com/geocoding/v5/mapbox.places/${w.lng},${w.lat}.json?types=address,street,neighborhood,locality,place,district,region,postcode,country&limit=1&access_token=${import.meta.env.VITE_MAPBOX_TOKEN}`
		    ).then(r=>r.json());

		    const f = det.features?.[0];
		    const ctx = parseContext(f?.context || []);
			const html = `
			  <div style="
			    font-family: system-ui;
			    font-size: 13px;
			    background: rgba(15, 23, 42, 0.95);
			    color: white;
			    padding: 12px 14px;
			    border-radius: 12px;
			    border: 1px solid rgba(0, 229, 255, 0.4);
			    box-shadow: 0 6px 24px rgba(0, 229, 255, 0.25);
			    backdrop-filter: blur(8px);
			    max-width: 260px;
			    line-height: 1.4;
			  ">

			     <div style="font-weight:700; font-size:14px; margin-bottom:4px;">
			        ${f?.text || w.name}
			     </div>

			     <div style="opacity:0.75; margin-bottom:6px;">
			        ${f?.place_name || ""}
			     </div>

			     ${ctx.street ? `<div><b>Street:</b> ${ctx.street}</div>` : ""}
			     ${ctx.neighborhood ? `<div><b>Area:</b> ${ctx.neighborhood}</div>` : ""}
			     ${ctx.locality ? `<div><b>Locality:</b> ${ctx.locality}</div>` : ""}
			     ${ctx.city ? `<div><b>City:</b> ${ctx.city}</div>` : ""}
			     ${ctx.district ? `<div><b>District:</b> ${ctx.district}</div>` : ""}
			     ${ctx.region ? `<div><b>State:</b> ${ctx.region}</div>` : ""}
			     ${ctx.country ? `<div><b>Country:</b> ${ctx.country}</div>` : ""}
			     ${ctx.postcode ? `<div><b>Pincode:</b> ${ctx.postcode}</div>` : ""}

				 <div style="margin-top:8px;">
				   <b>${w.temp}°C</b>
				   <span style="margin-left:6px; font-size:12px; opacity:0.8;">
				     ${getWeatherDesc(w.icon)}
				   </span>
				   <img 
				     src="${getWeatherIcon(w.icon)}"
				     style="width:20px; vertical-align:middle; margin-left:6px;"
				   />
				 </div>

			     ${w.km ? `<div style="margin-top:6px; font-size:12px; opacity:0.75;">
			          at ${w.km} km on route
			     </div>` : ""}
			  </div>
			`;
			mapRef.current.easeTo({
			   center: [w.lng, w.lat],
			   duration: 400,
			   essential: true
			});

		    new mapboxgl.Popup({ offset: 8, closeButton: true })
		      .setDOMContent(new DOMParser().parseFromString(html,"text/html").body.firstChild)
		      .setLngLat([w.lng, w.lat])
		      .addTo(mapRef.current);
		  });

	      routeWeatherMarkersRef.current.push(marker);
	   });
	}, [routeWeather]);

	/* 🔑 RESTORE FROM URL FIRST */
	useEffect(() => {
		if (location.state) return;

		const encoded = searchParams.get("points");
		if (!encoded) return;

		try {
			const decoded = JSON.parse(decodeURIComponent(encoded));
			if (!Array.isArray(decoded) || decoded.length < 2) return;

			navigate("/route", {
				replace: true,
				state: { points: decoded },
			});
		} catch {
			console.error("Invalid route link");
		}
	}, []);



	/* ==================== REBUILD ROUTE FUNCTION ==================== */
	const sampleWeatherCheckpoints = async (coords) => {
	  if (!coords || coords.length < 2) return;

	  // 1. Haversine FIRST
	  const haversine = (lat1, lng1, lat2, lng2) => {
	    const toRad = d => d * Math.PI / 180;
	    const R = 6371000;
	    const dLat = toRad(lat2 - lat1);
	    const dLng = toRad(lng2 - lng1);
	    const a =
	      Math.sin(dLat/2)**2 +
	      Math.cos(toRad(lat1))*Math.cos(toRad(lat2))*
	      Math.sin(dLng/2)**2;
	    return 2 * R * Math.asin(Math.sqrt(a));
	  };

	  // 2. Compute actual route length
	  let computedMeters = 0;
	  for (let i = 1; i < coords.length; i++) {
	    const [lng1, lat1] = coords[i - 1];
	    const [lng2, lat2] = coords[i];
	    computedMeters += haversine(lat1, lng1, lat2, lng2);
	  }

	  const totalKm = computedMeters / 1000;

	  // 3. dynamic interval (20km–60km for big cities)
	  let intervalKm = Math.max(20, Math.round(totalKm / 6));
	  const intervalMeters = intervalKm * 1000;

	  // 4. collect checkpoints along polyline
	  const checkpoints = [];
	  let accumulated = 0;
	  let target = intervalMeters;

	  for (let i = 1; i < coords.length; i++) {
	    const [lng1, lat1] = coords[i - 1];
	    const [lng2, lat2] = coords[i];

	    const segDist = haversine(lat1, lng1, lat2, lng2);
	    accumulated += segDist;

	    if (accumulated >= target) {
	      const ratio = 1 - (accumulated - target) / segDist;
	      const clat = lat1 + (lat2 - lat1) * ratio;
	      const clng = lng1 + (lng2 - lng1) * ratio;
	      checkpoints.push({ lat: clat, lng: clng, km: Math.round(target/1000) });
	      target += intervalMeters;
	    }
	  }

	  if (!checkpoints.length) return;

	  const named = await Promise.all(
	   checkpoints.map(async (cp) => {

	    try {

			const res = await fetch(
			 `${import.meta.env.VITE_API_URL}/api/search?query=${cp.lng},${cp.lat}`
			);
			const data = await res.json();

	     if (!data.features?.length) return null;

	     let best = res.features.find(f =>
	      f.place_type.includes("place")
	     );

	     if (!best) return null;

	     return {
	      ...cp,
	      name: best.text,
	      pop: best.properties?.population || 0
	     };

	    } catch {
	     return null;
	    }

	   })
	  );

	  const filtered = named.filter(Boolean);

	  if (!filtered.length) return;

	  filtered.sort((a,b)=>a.km - b.km);

	  const maxCount = Math.min(7, Math.ceil(totalKm / 200) + 3);

	  let limited = filtered.slice(0, maxCount);

	  // 7. Reorder by route sequence
	  limited.sort((a,b)=>a.km - b.km);

	  setRouteCheckpoints(limited);
	};
	/* =====================================================
	  SHARE / COPY (UNCHANGED BUTTONS)
	===================================================== */
	const handleShareRoute = () => {
		shareRoute({
			points: resolvedPoints,
			distance: liveDistance,
			duration: liveDuration,
		});
	};

	const handleCopyRouteLink = () => {
		copyRouteLink({
			points: resolvedPoints,
			distance: liveDistance,
			duration: liveDuration,
		});
	};

	/* =====================================================
	  START NAVIGATION (UNCHANGED FLOW)
	===================================================== */
	const startNav = () => {
		console.log("Navigating with state:", {
			routeSteps,
			routeGeo,
		});
		showToast("Starting navigation");
		setNavData({
			routeSteps,
			routeGeo,
			distance: liveDistance,
			duration: liveDuration,
		});

		navigate("/start-navigation", {
			state: {
				routeSteps,
				distance: liveDistance,
				duration: liveDuration,
				routeGeo,
				voiceEnabled: voice,
				destinationCoords: destCoords,
				profile,
				routePoints: resolvedPoints,
			},
		});
	};

	/* =====================================================
	  FORMATTERS (UNCHANGED)
	===================================================== */
	const formatMeters = (m) =>
		m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${Math.round(m)} m`;

	const formatDuration = (s) => {
		const mins = Math.round(s / 60);
		if (mins < 60) return `${mins} min`;
		const h = Math.floor(mins / 60);
		const rem = mins % 60;
		return `${h} hr ${rem} min`;
	};

	/* =====================================================
	  UI (UNCHANGED STRUCTURE)
	===================================================== */
	return (
	  <div className="map-layout route-wrapper">

	    <div className="route-top-row">
	      <RouteSearchBar
	        routePoints={inputPoints}
	        setRoutePoints={setInputPoints}
	        onShareRoute={handleShareRoute}
	        onCopyRouteLink={handleCopyRouteLink}
	      />
	    </div>

	    <div className="route-map-container">
	      <div ref={mapContainer} className="route-map" />
	    </div>

	    {/* Bottom Navigation Panel */}
	    <div className="preview-bottom-box">
	      <button
	        className="preview-close-btn"
	        onClick={() => navigate(-1)}
	      >
	        Close
	      </button>
		  <div className="route-mode-selector">

		    <button
		      className={travelMode === "driving" ? "active" : ""}
		      onClick={() => setTravelMode("driving")}
		    >
		      🚗 Car
		    </button>

		    <button
		      className={travelMode === "walking" ? "active" : ""}
		      onClick={() => setTravelMode("walking")}
		    >
		      🚶 Walk
		    </button>

		    <button
		      className={travelMode === "cycling" ? "active" : ""}
		      onClick={() => setTravelMode("cycling")}
		    >
		      🚴 Bike
		    </button>

		  </div>
	      <div className="preview-center-info">
	        <div className="preview-dist">
	          {formatMeters(liveDistance)}
	        </div>
	        <div className="preview-time">
	          {formatDuration(liveDuration)}
	        </div>
	      </div>

	      <button
	        className="preview-start-btn"
	        onClick={startNav}
	      >
	        Start Navigation
	      </button>
	    </div>

	    {/* Address Panel (only if needed) */}
	    {addressDetails && (
	      <div className="address-panel">
	        <div className="address-title">
	          {addressDetails.title}
	        </div>
	        <div className="address-full">
	          {addressDetails.full}
	        </div>
	        <button
	          className="address-close-btn"
	          onClick={() => setAddressDetails(null)}
	        >
	          Close
	        </button>
	      </div>
	    )}
		<MapControls
		 mapRef={mapRef}
		 is3DView={is3DView}
		 setIs3DView={setIs3DView}
		 isSatelliteView={isSatelliteView}
		 setIsSatelliteView={setIsSatelliteView}
		 trafficVisible={trafficEnabled}
		 toggleTraffic={toggleTrafficRoute}
		 recenterMap={() => {
		   if (!mapRef.current) return;

		   navigator.geolocation.getCurrentPosition((pos) => {
		     mapRef.current.flyTo({
		       center: [pos.coords.longitude, pos.coords.latitude],
		       zoom: 15
		     });
		   });
		 }}
		 setShowWeather={setShowWeather}
		 isOnline={true}
		 theme={JSON.parse(localStorage.getItem("map_settings"))?.theme || "light"}
		 toggle3DView={toggle3DView}
		 toggleSatelliteView={toggleSatelliteView}
		 showLimitedControls={false}
		 callNearestPolice={() => alert("Calling nearest police...")}
		 callNearestHospital={() => alert("Calling nearest hospital...")}
		/>
	  </div>
	);
}