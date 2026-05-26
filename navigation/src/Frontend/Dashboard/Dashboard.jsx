import React, { useEffect, useRef, useState } from "react";
import "./Dashboard.css";
import { useContext } from "react";
import { useLocationData } from "../context/LocationProvider";
import { getAuth } from "firebase/auth";
import mapboxgl from "mapbox-gl";
mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;
import Help from "../Help/Help.jsx";
import { useTheme } from "../Other/Theam";
import Nearby from "../Nearby/Nearby.jsx";
import AddGuest from "../Refer/AddGuest.jsx";
import Setting from "../Setting/Setting.jsx";
import Profile from "../Profile/Profile.jsx";
import { useNavigate } from "react-router-dom";
import SearchBar from "../SearchBar/SearchBar.jsx";
import Hamburger from "../Hamburger/Hamburger.jsx";
import ContactUs from "../ContactUs/ContactUs.jsx";
import { getFeatures } from "../config/featureFlags";
import PanoramicView from "../components/PanoramicView";
import MapControls from "../components/MapControls";
import TravelHistory from "../History/TravelHistory.jsx";
import ReferFriend from "../ReferaFriend/ReferFriend.jsx";
import OfflineBanner from "../offline-feature/OfflineBanner";
import { NetworkContext } from "../context/NetworkContext";
import { useLocation as useRouterLocation } from "react-router-dom";
import { useTraffic as useTrafficContext } from "../context/TrafficContext";
import {
	FaCar,
	FaBus,
	FaBolt,
	FaTimes,
	FaListUl,
	FaWalking,
	FaBicycle,
	FaVolumeUp,
	FaVolumeMute,
	FaChevronLeft,
} from "react-icons/fa";

import {
	addTerrain,
	addSkyLayer,
	remove3DBuildings,
	toggle3DView,
	toggleSatelliteView
} from "../../view/mapViewControls";

/* -----------------------
   Constants
   ----------------------- */
const HISTORY_KEY = "search_history_v1";

/* -----------------------
   Dashboard component
   ----------------------- */
export default function Dashboard() {
	const navigate = useNavigate();
	const location = useRouterLocation(); // router
	const loc = useLocationData();
	const openSearchPoint = async () => {
		const destination =
			pendingDestination ||
			searchInputRef.current?.value?.trim();
		if (!destination) {
			alert("Please enter a destination first");
			return;
		}
		if (!userLocation?.lat || !userLocation?.lng) {
			alert("Waiting for location...");
			return;
		}
		const originText = await getOriginText();

		const profile =
			mode === "WALKING"
				? "walking"
				: mode === "BICYCLING"
					? "cycling"
					: "driving";

		navigate("/search-point", {
			state: {
				originCoords: userLocation,
				originText,
				profile,
				trafficEnabled,
				destinationText: destination, // ✅ GUARANTEED VALUE
			},
		});
	};

	// Refs for map and DOM hooks
	const mapRef = useRef(null);

	const auth = getAuth(); // ✅ CORRECT
	const mapContainer = useRef(null);
	const userMarkerRef = useRef(null);
	const searchInputRef = useRef(null);
	const panoramaMarkerRef = useRef(null);
	const { theme } = useTheme();
	// mini | bottom | fullscreen
	/* -----------------------
	   UI + feature states
	   ----------------------- */
	const [mode, setMode] = useState("DRIVING");
	const [viewMode, setViewMode] = useState("mini");
	const [listening, setListening] = useState(false);
	const [showWeather, setShowWeather] = useState(false);
	const [sidebarOpen, setSidebarOpen] = useState(false);
	const [showPanorama, setShowPanorama] = useState(false);
	const [panoramaCoords, setPanoramaCoords] = useState(null);
	const { trafficEnabled, setTrafficEnabled } = useTrafficContext();
	// user location
	const [showRecenter, setShowRecenter] = useState(false);
	const [userLocation, setUserLocation] = useState({ lat: 0, lng: 0 });
	// tracking/navigation
	const [trackingActive, setTrackingActive] = useState(false);
	// mode dropdown
	const { isOnline } = useContext(NetworkContext);
	const [is3DView, setIs3DView] = useState(false);
	const [isSatelliteView, setIsSatelliteView] = useState(false);
	useEffect(() => {
		localStorage.setItem(
			"map_settings",
			JSON.stringify({
				satellite: isSatelliteView,
				is3D: is3DView,
				theme: theme
			})
		);
	}, [isSatelliteView, is3DView, theme]);
	const [showDropdown, setShowDropdown] = useState(false);
	const [selectedMode, setSelectedMode] = useState("DRIVING");
	// modals
	const [isHelpOpen, setIsHelpOpen] = useState(false);
	const [isReferOpen, setIsReferOpen] = useState(false);
	const [isProfileOpen, setIsProfileOpen] = useState(false);
	const [isSettingOpen, setIsSettingOpen] = useState(false);
	const [isContactOpen, setIsContactOpen] = useState(false);
	const [isAddGuestOpen, setIsAddGuestOpen] = useState(false);
	const [isTravelHistoryOpen, setIsTravelHistoryOpen] = useState(false);
	// search suggestions / saved addresses
	const [stops, setStops] = useState([]);
	const [history, setHistory] = useState([]);
	const [wantToGo, setWantToGo] = useState("");
	const [savedRoute, setSavedRoute] = useState("");
	const [tempAddress, setTempAddress] = useState("");
	const [homeAddress, setHomeAddress] = useState("");
	const [editingType, setEditingType] = useState(null);
	const [officeAddress, setOfficeAddress] = useState("");
	const [favoritePlace, setFavoritePlace] = useState("");
	const [showSuggestions, setShowSuggestions] = useState(false);
	const [suggestionsHover, setSuggestionsHover] = useState(false);
	const [pendingDestination, setPendingDestination] = useState("");
	/* ==========================
	   Load search history on mount
	========================== */
	useEffect(() => {
		try {
			const stored = localStorage.getItem(HISTORY_KEY);
			if (stored) {
				const parsed = JSON.parse(stored);
				if (Array.isArray(parsed)) {
					setHistory(parsed);
				}
			}
		} catch (e) {
			console.error("Failed to load search history", e);
		}
	}, []);
	/* ==========================
	   Reset UI when returning to Dashboard
	========================== */
	useEffect(() => {

		if (!mapRef.current) return;

		// RESET VIEW STATES
		setIsSatelliteView(false);
		setIs3DView(false);

		const style =
			theme === "dark"
				? "mapbox://styles/mapbox/navigation-night-v1"
				: "mapbox://styles/mapbox/streets-v12";

		mapRef.current.setStyle(style);

		mapRef.current.once("style.load", () => {

			mapRef.current.resize();
			addTerrain(mapRef.current);
			addSkyLayer(mapRef.current);

			if (trafficEnabled) {
				toggleTraffic(); // ✅ DIRECT CALL
			}

		});

	}, [theme]);

	// Ensure buttons are visible on mount
	useEffect(() => {
		setShowRecenter(true);
		setTrackingActive(true);
	}, []);

	/* -----------------------
	   localStorage history load
	   ----------------------- */
	const saveHistoryToStorage = (next) => {
		setHistory(next);
		try {
			localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
		} catch (e) {
			console.error("save history err", e);
		}
	};
	const addToHistory = (q) => {
		if (!q) return;
		const trimmed = q.trim();
		if (!trimmed) return;
		const filtered = history.filter((h) => h.toLowerCase() !== trimmed.toLowerCase());
		const next = [trimmed, ...filtered].slice(0, 8);
		saveHistoryToStorage(next);
	};
	const deleteHistoryItem = (idx) => {
		// ✅ CLEAR ALL HISTORY
		if (idx === "ALL") {
			saveHistoryToStorage([]);
			return;
		}

		// ✅ DELETE SINGLE ITEM
		const next = history.filter((_, i) => i !== idx);
		saveHistoryToStorage(next);
	};
	/* ===============
// Get current position once (origin)
================ */
	useEffect(() => {
		if (mapRef.current) return;

		const mapStyle =
			theme === "dark"
				? "mapbox://styles/mapbox/navigation-night-v1"
				: "mapbox://styles/mapbox/streets-v12";
		mapboxgl.config.API_URL = "https://api.mapbox.com";
		mapRef.current = new mapboxgl.Map({
			container: mapContainer.current,
			style: mapStyle,
			center: [78.4867, 17.385],
			zoom: 15,
			pitch: 0,
			bearing: 0,
			antialias: true,
			fadeDuration: 0,
			collectResourceTiming: false,
			preserveDrawingBuffer: true,
			styleDiffing: false
		});

		mapRef.current.on("load", () => {
			// START GPS AFTER MAP LOAD
			if (navigator.geolocation) {
				navigator.geolocation.getCurrentPosition(
					(pos) => {

						const lat = pos.coords.latitude;
						const lng = pos.coords.longitude;
						localStorage.setItem("lastLocation", JSON.stringify({
							lat,
							lng
						}));

						const userLngLat = [lng, lat];

						setUserLocation({ lat, lng });
						setUserMarker(userLngLat);

						if (mapRef.current) {
							mapRef.current.flyTo({
								center: userLngLat,
								zoom: 16
							});
						}

					},
					(err) => console.error("GPS error:", err),
					{
						enableHighAccuracy: true
					}
				);
			}


			addTerrain(mapRef.current);
			addSkyLayer(mapRef.current);
			loadRainRadar();

			// ===== LOAD OFFLINE ROUTE =====
			if (!isOnline) {

				console.log("Offline mode active");
				// LOAD LAST SAVED LOCATION
				const saved = localStorage.getItem("lastLocation");

				if (saved) {

					const { lat, lng } = JSON.parse(saved);

					setUserLocation({ lat, lng });

					mapRef.current.setCenter([lng, lat]);

				}
				mapRef.current.setStyle({
					version: 8,
					sources: {
						osm: {
							type: "raster",
							tiles: [
								"https://tile.openstreetmap.org/{z}/{x}/{y}.png"
							],
							tileSize: 256
						}
					},
					layers: [
						{
							id: "osm",
							type: "raster",
							source: "osm"
						}
					]
				});

				mapRef.current.once("style.load", () => {

				});

			}
			remove3DBuildings(mapRef.current);
		});
		mapRef.current.on("click", async (e) => {
			const { lng, lat } = e.lngLat;

			let address = "Unknown";
			let pincode = "N/A";

			try {
				const res = await fetch(
					`https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${mapboxgl.accessToken}`
				);

				const data = await res.json();
				const place = data.features?.[0];

				address = place?.place_name || "Unknown location";

				pincode =
					place?.context?.find(c => c.id.includes("postcode"))?.text || "N/A";

			} catch (err) {
				console.error("Reverse geocode error:", err);
			}

			// ✅ SEND TO BACKEND (THIS WAS MISSING)
			try {
				await fetch(`${import.meta.env.VITE_API_URL}/api/location`, {
					method: "POST",
					headers: {
						"Content-Type": "application/json"
					},
					body: JSON.stringify({
						lat,
						lng,
						address,
						pincode,
						type: "CLICK",
						time: new Date().toLocaleTimeString("en-GB")
					})
				});
			} catch (err) {
				console.error("Backend send failed:", err);
			}

			// ✅ EXISTING UI LOGIC
			setPanoramaCoords({
				lat,
				lng,
				address
			});

			setShowPanorama(true);

			if (!panoramaMarkerRef.current) {
				panoramaMarkerRef.current = new mapboxgl.Marker({ color: "#FF2E63" })
					.setLngLat([lng, lat])
					.addTo(mapRef.current);
			} else {
				panoramaMarkerRef.current.setLngLat([lng, lat]);
			}
		});

		const setDefaultLocation = (lat, lng, zoom = 14) => {
			setUserLocation({ lat, lng });
			setUserMarker([lng, lat]);

			if (mapRef.current?.loaded()) {
				mapRef.current.flyTo({
					center: [lng, lat],
					zoom,
					speed: 1.2,
					curve: 1,
				});
			} else {
				mapRef.current.on("load", () => {
					mapRef.current.flyTo({ center: [lng, lat], zoom });
				});
			}
		};

		if (navigator.geolocation) {
			navigator.geolocation.getCurrentPosition(
				(pos) => {
					const { latitude: lat, longitude: lng } = pos.coords;
					setDefaultLocation(lat, lng, 15);
				},
				() => {
					// Hyderabad fallback
					setDefaultLocation(17.385, 78.4867, 12);
				},
				{
					enableHighAccuracy: true,
					timeout: 15000,
					maximumAge: 10000,
				}
			);
		} else {
			setDefaultLocation(17.385, 78.4867, 12);
		}

		return () => {
			if (mapRef.current) {
				mapRef.current.remove();
				mapRef.current = null;
			}
		};
	}, []);

	useEffect(() => {
		const resizeMap = () => {
			if (mapRef.current) mapRef.current.resize();
		};
		window.addEventListener("resize", resizeMap);
		return () => window.removeEventListener("resize", resizeMap);
	}, []);

	useEffect(() => {
		if (loc.lat && loc.lng) {
			const lat = loc.lat;
			const lng = loc.lng;

			setUserLocation({ lat, lng });

			const userLngLat = [lng, lat];

			setUserMarker(userLngLat);

			if (mapRef.current) {
				mapRef.current.easeTo({
					center: userLngLat,
					zoom: 15,
					duration: 600,
				});
			}
		}
	}, [loc]);

	/* ===============
	   User marker helpers
	   =============== */
	const setUserMarker = (lngLatArr) => {
		if (!mapRef.current) return;
		if (!userMarkerRef.current) {
			const el = document.createElement("div");
			el.className = "user-marker";
			el.style.width = "28px";
			el.style.height = "28px";
			el.style.borderRadius = "50%";
			el.style.background = "#2b87ff";
			el.style.boxShadow = "0 2px 6px rgba(0,0,0,0.4)";
			el.style.border = "3px solid white";
			userMarkerRef.current = new mapboxgl.Marker({ element: el }).setLngLat(lngLatArr).addTo(mapRef.current);
		} else {
			userMarkerRef.current.setLngLat(lngLatArr);
		}
	};

	const recenterMap = () => {
		if (mapRef.current && userLocation) mapRef.current.flyTo({ center: [userLocation.lng, userLocation.lat], zoom: 14 });
		setShowRecenter(false);
	};



	/* ===============
	   Traffic toggle
	   =============== */
	const toggleTraffic = () => {
		if (!mapRef.current) return;
		if (!mapRef.current.isStyleLoaded()) {
			mapRef.current.once("style.load", toggleTraffic);
			return;
		}
		if (trafficEnabled) {
			if (mapRef.current.getLayer("traffic-layer")) {
				mapRef.current.removeLayer("traffic-layer");
			}
			if (mapRef.current.getSource("traffic-source")) {
				mapRef.current.removeSource("traffic-source");
			}
		} else {
			mapRef.current.addSource("traffic-source", {
				type: "vector",
				url: "mapbox://mapbox.mapbox-traffic-v1"
			});

			mapRef.current.addLayer({
				id: "traffic-layer",
				type: "line",
				source: "traffic-source",
				"source-layer": "traffic",
				paint: {
					"line-color": [
						"match",
						["get", "congestion"],
						"low", "#4CAF50",
						"moderate", "#FFC107",
						"heavy", "#FF5722",
						"severe", "#F44336",
						"#4CAF50"
					],
					"line-width": 2.5
				}
			});
		}

		setTrafficEnabled(!trafficEnabled);
	};
	async function callNearestPlace(type) {
		if (!userLocation?.lat || !userLocation?.lng) {
			alert("Location not available");
			return;
		}

		try {
			const query = type === "police" ? "police station" : "hospital";

			const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${query}.json?proximity=${userLocation.lng},${userLocation.lat}&limit=1&access_token=${mapboxgl.accessToken}`;

			const res = await fetch(url);
			const data = await res.json();

			if (!data.features.length) {
				alert("No nearby location found");
				return;
			}

			const placeName = data.features[0].place_name;

			alert(`Nearest ${query}: \n${placeName}\n\nOpening dialer...`);

			// emergency numbers
			const phone = type === "police" ? "100" : "102";

			window.location.href = `tel:${phone}`;

		} catch (err) {
			console.error(err);
			alert("Failed to find nearby location");
		}
	}
	// Convert user's coordinates to readable address (reverse geocode)
	const getOriginText = async () => {
		try {
			const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${userLocation.lng},${userLocation.lat}.json?access_token=${mapboxgl.accessToken}`;
			const res = await fetch(url).then(r => r.json());
			return res.features?.[0]?.place_name || "Your Location";
		} catch (e) {
			return "Your Location";
		}
	};

	/* ===============
	   Voice search helper
	   =============== */
	const startVoiceRoute = () => {
		if (!("webkitSpeechRecognition" in window)) return alert("Speech recognition not supported!");
		const rec = new window.webkitSpeechRecognition();
		rec.lang = "en-US";
		rec.onstart = () => setListening(true);
		rec.onend = () => setListening(false);
		rec.onresult = (e) => {
			const transcript = e.results[0][0].transcript.trim();
			if (searchInputRef.current) searchInputRef.current.value = transcript;
			setPendingDestination(transcript);
			addToHistory(transcript);
			setShowSuggestions(false);
			(async () => {
				try {
					const geo = await fetch(
						`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(transcript)}.json?access_token=${mapboxgl.accessToken}`
					).then((r) => r.json());
					if (geo?.features?.length) {
						const [lng, lat] = geo.features[0].center;
					}
				} catch (err) {
					console.error(err);
				}
			})();
		};
		rec.start();
	};

	/* ===============
	   Helpers for selecting saved addresses
	   =============== */
	const handleSelectMode = (selected) => {
		setMode(selected);
		setSelectedMode(selected);
		setShowDropdown(false);
	};

	const useSavedAddress = (type) => {
		const addr =
			type === "home"
				? homeAddress
				: type === "office"
					? officeAddress
					: type === "route"
						? savedRoute
						: type === "favorite"
							? favoritePlace
							: wantToGo;
		if (!addr) return startEditAddress(type);
		if (searchInputRef.current) searchInputRef.current.value = addr;
		setPendingDestination(addr);
		(async () => {
			try {
				const geo = await fetch(
					`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(addr)}.json?access_token=${mapboxgl.accessToken}`
				).then((r) => r.json());
				if (geo?.features?.length) {
					const [lng, lat] = geo.features[0].center;
				}
			} catch (err) {
				console.error(err);
			}
		})();
		setShowSuggestions(false);
	};

	const startEditAddress = (type) => {
		setEditingType(type);
		setTempAddress(
			type === "home" ? homeAddress : type === "office" ? officeAddress : type === "route" ? savedRoute : type === "favorite" ? favoritePlace : wantToGo
		);
		setShowSuggestions(true);
	};
	/* ===============
	   Radar layer
	=============== */
	const loadRainRadar = async () => {

		const res = await fetch(
			"https://api.rainviewer.com/public/weather-maps.json"
		);

		const data = await res.json();

		const frame = data.radar.past[data.radar.past.length - 1];

		const tileUrl =
			`https://tilecache.rainviewer.com${frame.path}/256/{z}/{x}/{y}/2/1_1.png`;

		if (!mapRef.current) return;

		if (mapRef.current.getSource("rainviewer")) return;

		mapRef.current.addSource("rainviewer", {
			type: "raster",
			tiles: [tileUrl],
			tileSize: 256
		});

		mapRef.current.addLayer({
			id: "rainviewer-layer",
			type: "raster",
			source: "rainviewer",
			minzoom: 0,
			maxzoom: 10,
			paint: {
				"raster-opacity": 0.6
			}
		});

	};
	/* ===============
	   Render
	   =============== */

	return (
		<div className={`dashboard ${sidebarOpen ? "sidebar-active" : ""}`}>
			<OfflineBanner />
			{/* ===== MAP LAYOUT (SINGLE POSITIONING CONTEXT) ===== */}
			<div className="map-layout">

				{/* MAP */}
				<div ref={mapContainer} className="map-container" />

				{/* UI LAYER */}
				<div className="ui-layer">

					{/* HAMBURGER */}
					{isOnline && (
						<Hamburger
							sidebarOpen={sidebarOpen}
							setSidebarOpen={setSidebarOpen}
							navigate={navigate}
							useSavedAddress={useSavedAddress}
							setIsProfileOpen={setIsProfileOpen}
							setIsAddGuestOpen={setIsAddGuestOpen}
							setIsTravelHistoryOpen={setIsTravelHistoryOpen}
							setIsContactOpen={setIsContactOpen}
							setIsHelpOpen={setIsHelpOpen}
							setIsReferOpen={setIsReferOpen}
							setIsSettingOpen={setIsSettingOpen}
						/>
					)}

					{/* SEARCH + GET + NEARBY */}
					{true && (
						<div className="floating-controls">

							<div className="search-wrapper">
								<SearchBar
									onHamburgerClick={() => setSidebarOpen(true)}
									searchDestination={pendingDestination}
									startVoiceRoute={startVoiceRoute}
									listening={listening}
									showSuggestions={showSuggestions}
									setShowSuggestions={setShowSuggestions}
									suggestionsHover={suggestionsHover}
									setSuggestionsHover={setSuggestionsHover}
									searchInputRef={searchInputRef}
									history={history}
									addToHistory={(q) => addToHistory(q)}
									deleteHistoryItem={deleteHistoryItem}
									onSuggestionSelect={async (q) => {
										if (searchInputRef.current) searchInputRef.current.value = q;
										setPendingDestination(q);
										addToHistory(q);
										setShowSuggestions(false);
									}}
									onClick={openSearchPoint}
									onPlaceSelected={async (place) => {
										if (!place || !place.center || !mapRef.current) return;

										const [lng, lat] = place.center;

										// ✅ Move map
										mapRef.current.flyTo({ center: place.center, zoom: 15 });

										// ✅ Extract details
										const address = place.place_name || "Unknown";
										const pincode =
											place.context?.find(c => c.id.includes("postcode"))?.text || "N/A";

										// ✅ SEND TO BACKEND (THIS IS WHAT YOU NEED)
										try {
											await fetch(`${import.meta.env.VITE_API_URL}/api/location`, {
												method: "POST",
												headers: {
													"Content-Type": "application/json"
												},
												body: JSON.stringify({
													lat,
													lng,
													address,
													pincode,
													type: "SEARCH",
													time: new Date().toLocaleTimeString("en-GB")
												})
											});
										} catch (err) {
											console.error("Search location send failed:", err);
										}
									}}
								/>
							</div>

							<button className="get-button" onClick={openSearchPoint}>
								Get
							</button>

							{isOnline && (
								<div className="nearby-inline-wrapper">
								<Nearby
								  userLocation={userLocation}
								  mapRef={mapRef}
								  onPanelToggle={(open) => setNearbyOpen(open)}
								/>
								</div>
							)}

						</div>
					)}

				</div>
				<MapControls
					mapRef={mapRef}
					is3DView={is3DView}
					setIs3DView={setIs3DView}
					isSatelliteView={isSatelliteView}
					setIsSatelliteView={setIsSatelliteView}
					trafficVisible={trafficEnabled}
					toggleTraffic={toggleTraffic}
					recenterMap={recenterMap}
					setShowWeather={setShowWeather}
					isOnline={isOnline}
					theme={theme}
					toggle3DView={toggle3DView}
					toggleSatelliteView={toggleSatelliteView}
					callNearestPolice={() => callNearestPlace("police")}
					callNearestHospital={() => callNearestPlace("hospital")}
				/>
			</div>

			{/* ===== MODALS OUTSIDE MAP LAYOUT ===== */}
			{showWeather && (
				<Weather
					open={showWeather}
					onClose={() => setShowWeather(false)}
					userLocation={userLocation}
				/>
			)}
			{isProfileOpen && (
				<Profile
					isProfileOpen={isProfileOpen}
					setIsProfileOpen={setIsProfileOpen}
				/>
			)}
			{isAddGuestOpen && (
				<AddGuest
					isOpen={isAddGuestOpen}
					onClose={() => setIsAddGuestOpen(false)} />
			)}
			{isTravelHistoryOpen && (
				<TravelHistory
					isOpen={isTravelHistoryOpen}
					onClose={() => setIsTravelHistoryOpen(false)}
					userId={auth.currentUser?.uid} />
			)}
			{isContactOpen && (
				<ContactUs onClose={() => setIsContactOpen(false)} />
			)}
			{isHelpOpen && (
				<Help onClose={() => setIsHelpOpen(false)} />
			)}
			{isReferOpen && (
				<ReferFriend
					isOpen={isReferOpen}
					onClose={() => setIsReferOpen(false)}
				/>
			)}
			{isSettingOpen && (
				<Setting
					isSettingOpen={isSettingOpen}
					onClose={() => setIsSettingOpen(false)}
				/>
			)}
			{showPanorama && panoramaCoords && (
				<PanoramicView
					lat={panoramaCoords.lat}
					lng={panoramaCoords.lng}
					address={panoramaCoords.address}
					isOpen={showPanorama}
					mode={viewMode}
					onExpand={() => setViewMode("bottom")}
					onClose={() => {
						if (viewMode === "mini") {
							setShowPanorama(false);
						} else if (viewMode === "bottom") {
							setViewMode("mini");
						} else if (viewMode === "fullscreen") {
							setViewMode("bottom");
						}
					}}
				/>
			)}
		</div>
	);
}
