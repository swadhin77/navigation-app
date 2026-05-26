import React, { useState, useRef, useEffect } from "react";
import mapboxgl from "mapbox-gl";
import "./Nearby.css";

const categories = [
	{ name: "Petrol", icon: "⛽", key: "petrol pump" },
	{ name: "EV", icon: "⚡", key: "electric vehicle charging station" },
	{ name: "CNG", icon: "🏭", key: "cng station" },
	{ name: "Police", icon: "🚓", key: "police station" },
	{ name: "Hospital", icon: "🏥", key: "hospital" },
	{ name: "Fire", icon: "🚒", key: "fire station" },
	{ name: "Railway", icon: "🚉", key: "railway station" },
	{ name: "Bus", icon: "🚌", key: "bus station" },
	{ name: "Airport", icon: "✈️", key: "international airport" },
	{ name: "Food", icon: "🍽️", key: "restaurant" },
	{ name: "Hotel", icon: "🏨", key: "hotel" },
];

const Nearby = ({ userLocation, mapRef }) => {
	const [selected, setSelected] = useState(null);
	const [page, setPage] = useState(0);
	const [places, setPlaces] = useState([]);
	const [routes, setRoutes] = useState([]);
	const [loading, setLoading] = useState(false);
	const [sheetOpen, setSheetOpen] = useState(false);
	const [selectedPlace, setSelectedPlace] = useState(null);
	const [sheetHeight, setSheetHeight] = useState(50);
	const [routeInfo, setRouteInfo] = useState(null);
	const [isMobile, setIsMobile] = useState(false);
	const markersRef = useRef([]);
	const cacheRef = useRef({});
	const lastLocationRef = useRef(null);
	const lastFetchTimeRef = useRef(0);
	// CLEAR MARKERS
	const clearMarkers = () => {
		markersRef.current.forEach((m) => m.remove());
		markersRef.current = [];
	};

	const renderMarkers = (data) => {
		if (!mapRef.current || !mapRef.current.isStyleLoaded()) return;
		data.forEach((place) => {

			const el = document.createElement("div");
			el.className = "custom-marker";
			el.innerHTML = `<span>${place.name}</span>`;

			// Create marker ONCE
			const marker = new mapboxgl.Marker(el)
			  .setLngLat([place.lng, place.lat])
			  .addTo(mapRef.current);

			// 👉 CLICK EVENT (ADD THIS)
			el.addEventListener("click", async () => {

			  setSelectedPlace(place);

			  try {
			    const res = await fetch(
			      `http://localhost:8081/api/route?origin=${userLocation.lat},${userLocation.lng}&destination=${place.lat},${place.lng}`
			    );

			    const data = await res.json();

			    if (data.summary) {
			      setRouteInfo(data.summary);
			    }

			  } catch (e) {
			    console.error("ETA error", e);
			  }

			});

			// Store marker
			markersRef.current.push(marker);
		});
	};
	const hasMoved200m = (oldLoc, newLoc) => {
		if (!oldLoc) return true;

		const R = 6371;
		const dLat = (newLoc.lat - oldLoc.lat) * (Math.PI / 180);
		const dLng = (newLoc.lng - oldLoc.lng) * (Math.PI / 180);

		const a =
			Math.sin(dLat / 2) * Math.sin(dLat / 2) +
			Math.cos(oldLoc.lat * Math.PI / 180) *
			Math.cos(newLoc.lat * Math.PI / 180) *
			Math.sin(dLng / 2) * Math.sin(dLng / 2);

		const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

		const distance = R * c * 1000;

		return distance > 200;
	};
	const drawRoute = async (destLat, destLng) => {
		if (!userLocation || !mapRef.current) return;

		try {
			const res = await fetch(
				`http://localhost:8081/api/route?origin=${userLocation.lat},${userLocation.lng}&destination=${destLat},${destLng}`
			);
			const data = await res.json();

			if (!data.routes || data.routes.length === 0) return;

			setRoutes(data.routes); // STORE ALL ROUTES

			drawAllRoutes(data.routes);

		} catch (err) {
			console.error("Route error:", err);
		}
	};
	const drawAllRoutes = (routes) => {
		if (!mapRef.current || !mapRef.current.isStyleLoaded()) return;

		Object.keys(mapRef.current.getStyle().layers)
			.filter(id => id.startsWith("route-"))
			.forEach(id => {
				if (mapRef.current.getLayer(id)) {
					mapRef.current.removeLayer(id);
				}
				if (mapRef.current.getSource(id)) {
					mapRef.current.removeSource(id);
				}
			});

		// DRAW ALL ROUTES
		routes.forEach((route, i) => {
			const coords = route.geometry.coordinates;

			mapRef.current.addSource("route-" + i, {
				type: "geojson",
				data: {
					type: "Feature",
					geometry: {
						type: "LineString",
						coordinates: coords,
					},
				},
			});

			mapRef.current.addLayer({
				id: "route-" + i,
				type: "line",
				source: "route-" + i,
				layout: {
					"line-join": "round",
					"line-cap": "round",
				},
				paint: {
					"line-width": i === 0 ? 6 : 4,
					"line-color": i === 0 ? "#007bff" : "#999", // primary vs alternative
					"line-opacity": i === 0 ? 1 : 0.6,
				},
			});
		});
		// AUTO ZOOM TO PRIMARY ROUTE
		const allCoords = routes[0].geometry.coordinates;

		const bounds = new mapboxgl.LngLatBounds();

		allCoords.forEach(coord => bounds.extend(coord));

		mapRef.current.fitBounds(bounds, {
			padding: 50,
			duration: 1000,
		});
	};
	const selectRoute = (index) => {
		routes.forEach((_, i) => {
			mapRef.current.setPaintProperty(
				"route-" + i,
				"line-color",
				i === index ? "#007bff" : "#999"
			);

			mapRef.current.setPaintProperty(
				"route-" + i,
				"line-width",
				i === index ? 6 : 4
			);
		});
	};
	// FETCH FROM BACKEND (SECURE)
	const fetchNearby = async (type, nextPage = 0) => {
		if (!userLocation?.lat) {
			console.warn("User location not available");
			return;
		}

		// ADD HERE 
		console.log("Fetching nearby for:", type, userLocation);

		const cacheKey = `${type}_${userLocation.lat.toFixed(3)}_${userLocation.lng.toFixed(3)}`;

		if (cacheRef.current[cacheKey]) {
			clearMarkers();
			renderMarkers(cacheRef.current[cacheKey]);
			return;
		}

		setLoading(true);

		try {
			const res = await fetch(
				`http://localhost:8081/api/nearby?lat=${userLocation.lat}&lng=${userLocation.lng}&type=${type}&page=${nextPage}`
			);

			const data = await res.json();
			console.log("Nearby API Response:", data);

			if (!data || data.length === 0) {
				console.warn("No nearby results found");
				setLoading(false);
				return;
			}

			cacheRef.current[cacheKey] = data;

			const finalList =
				nextPage === 0 ? data : [...places, ...data];

			clearMarkers();
			renderMarkers(finalList);
			setPlaces(finalList);

		} catch (err) {
			console.error("Nearby error:", err);
		}

		setLoading(false);
	};

	const handleClick = (type) => {
	  clearMarkers();
	  setPlaces([]);
	  setPage(0);
	  setSelected(type);
	  setSheetOpen(true);   // 🔥 ADD THIS
	  fetchNearby(type, 0);
	};
	const handleDrag = (e) => {
	  const newHeight =
	    ((window.innerHeight - e.clientY) / window.innerHeight) * 100;

	  if (newHeight < 25) {
	    setSheetOpen(false); // close
	    return;
	  }

	  if (newHeight < 60) {
	    setSheetHeight(50);  // half
	  } else {
	    setSheetHeight(100); // full
	  }
	};
	useEffect(() => {
	  const check = () => {
		const isTouch = window.matchMedia("(pointer: coarse)").matches;
		setIsMobile(isTouch);
	  };

	  check();
	  window.addEventListener("resize", check);

	  return () => window.removeEventListener("resize", check);
	}, []);
	useEffect(() => {
		window.startRoute = (lat, lng) => {
			drawRoute(lat, lng); // preview
		};

		window.startNavigation = (lat, lng) => {
			window.location.href = `/route?lat=${lat}&lng=${lng}`;
		};
	}, [userLocation]);

	useEffect(() => {
		const handleScroll = () => {
			if (!selected) return;

			if (
				window.innerHeight + window.scrollY >=
				document.body.offsetHeight - 200
			) {
				const nextPage = page + 1;

				setPage(nextPage);

				fetchNearby(selected, nextPage);
			}
		};

		window.addEventListener("scroll", handleScroll);

		return () => window.removeEventListener("scroll", handleScroll);
	}, [page, selected]);

	useEffect(() => {
		if (!userLocation || !selected) return;

		const now = Date.now();
		if (now - lastFetchTimeRef.current < 15000) return;

		if (!lastLocationRef.current) {
			lastLocationRef.current = userLocation;
			return;
		}

		if (hasMoved200m(lastLocationRef.current, userLocation)) {
			lastFetchTimeRef.current = now;

			lastLocationRef.current = userLocation;

			cacheRef.current = {};
			clearMarkers();
			setPlaces([]);

			fetchNearby(selected, 0);
		}
	}, [userLocation]);

	return (
		<>
	    <div className="nearby-hud">
			{categories.map((cat) => (
				<button
					key={cat.key}
					className={`nearby-item ${selected === cat.key ? "active" : ""}`}
					onClick={() => handleClick(cat.key)}
				>
					<div>{cat.icon}</div>
					<span>{cat.name}</span>
				</button>
			))}
			</div>
			
			{loading && <div className="loading">Loading...</div>}
			{routes.length > 0 && (
				<div className="route-options">
					{routes.map((r, i) => (
						<button key={i} onClick={() => selectRoute(i)}>
							Route {i + 1} - {(r.distance / 1000).toFixed(2)} km | ${(r.duration / 60).toFixed(0)} min
						</button>
					))}
				</div>
			)}
			
			{places.length > 0 && sheetOpen && (
				<div
				  className={`places-sheet ${sheetOpen && !isMobile ? "open" : ""}`}
				  style={!isMobile ? {} : { height: `${sheetHeight}%` }}
				  onMouseMove={(e) => e.buttons === 1 && handleDrag(e)}
				  onTouchMove={(e) => handleDrag(e.touches[0])}
				>
				<div className="sheet-header">
				  {isMobile && (
				    <div className="drag-line">
				      {sheetHeight > 70 ? "⬇️" : "⬆️"}
				    </div>
				  )}

				  <button className="close-sheet" onClick={() => setSheetOpen(false)}>
				    ✕
				  </button>
				</div>
			    {places.map((place, index) => (
			      <div
			        key={index}
			        className="place-card"
			        onClick={() => {
			          setSelectedPlace(place);
			          drawRoute(place.lat, place.lng);
			        }}
			      >
			        <h3>{place.name}</h3>

			        <p className="address">{place.address}</p>

			        <div className="info-row">
			          <span>📍 {place.distance ? place.distance.toFixed(2) : "0"} km</span>
			        </div>

			        <div className="card-actions">
			          <button
			            onClick={(e) => {
			              e.stopPropagation();
			              window.startRoute(place.lat, place.lng);
			            }}
			          >
			            Direction
			          </button>

			          <button
			            onClick={(e) => {
			              e.stopPropagation();
			              navigator.share({
			                title: place.name,
			                text: place.address,
			              });
			            }}
			          >
			            Share
			          </button>
			        </div>
			      </div>
			    ))}
			  </div>
			)}
			{selectedPlace && (
			  <div className="place-panel">

			    <h2>{selectedPlace.name}</h2>

			    <p className="address">{selectedPlace.address}</p>

			    <div className="info-row">
			      <span>📍 {selectedPlace.distance ? selectedPlace.distance.toFixed(2) : "0"} km</span>

			      {routeInfo && (
			        <span>⏱ {routeInfo.duration.toFixed(0)} min</span>
			      )}
			    </div>

			    <div className="panel-actions">
			      <button onClick={() => window.startRoute(selectedPlace.lat, selectedPlace.lng)}>
			        {isMobile && window.innerWidth <= 768 ? "➡️" : "Direction"}
			      </button>

			      <button onClick={() => window.startNavigation(selectedPlace.lat, selectedPlace.lng)}>
			        {isMobile ? "▶️" : "Start"}
			      </button>

			      <button
			        onClick={() =>
			          navigator.share({
			            title: selectedPlace.name,
			            text: selectedPlace.address,
			          })
			        }
			      >
			        {isMobile ? "🔗" : "Share"}
			      </button>
			    </div>

			  </div>
			)}
			</>
	);
};

export default Nearby;