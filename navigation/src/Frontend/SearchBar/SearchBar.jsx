// SearchBar.jsx
import React, { useEffect, useRef, useState } from "react";
import "./SearchBar.css";
import { useNavigate } from "react-router-dom";
import { FaTimes, FaArrowLeft } from "react-icons/fa";
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;
const DEBOUNCE_MS = 220;
export default function SearchBar({
	onAddStop,
	onGo,
	onHamburgerClick,
	showSuggestions,
	setShowSuggestions,
	searchInputRef,
	history = [],
	addToHistory,
	deleteHistoryItem,
	onSuggestionSelect,
	onPlaceSelected,
}) {
	const wrapperRef = useRef(null);
	const navigate = useNavigate();
	/* ---------------------------------------------------------
		INTERNAL STATES
	--------------------------------------------------------- */
	// Mobile long-press delete
	const [longPressItem, setLongPressItem] = useState(null);
	const [showDeleteModal, setShowDeleteModal] = useState(false);
	const longPressTimerRef = useRef(null);
	const [profileActive, setProfileActive] = useState(false);
	// Add these states
	const [isTypingDestination, setIsTypingDestination] = useState(false);
	const [searchActive, setSearchActive] = useState(false);
	// 🎤 Speech recognition states
	const [isListening, setIsListening] = useState(false);
	const recognitionRef = useRef(null);
	// MAIN SEARCH BAR
	const [query, setQuery] = useState("");
	const [predictions, setPredictions] = useState([]);
	const [selectedIndex, setSelectedIndex] = useState(-1);
	const debounceRef = useRef(null);
	const abortRef = useRef(null);
	const handleShortcutClick = (type) => {
		const name = type === "home" ? "Home" : "Office";
		setQuery(name);
		setIsTypingDestination(false);
		setShowSuggestions(false);
		navigate("/search-point", {
			state: {
				place: {
					place_name: name,
					center: null,
				},
			},
		});
	};
	const handleHistorySelect = (placeName, shouldNavigate) => {
		// 🔑 Update SearchBar UI
		setQuery(placeName);
		setShowSuggestions(false);
		setIsTypingDestination(false);
		// 🔑 SYNC WITH DASHBOARD
		onSuggestionSelect?.(placeName);
		// 📱 Mobile / Tablet → auto navigate
		if (shouldNavigate) {
			setSearchActive(false);
			navigate("/search-point", {
				state: {
					destinationText: placeName,
				},
			});
		}
	};
	const VoiceIcon = () => (
		<svg
			width="20"
			height="20"
			viewBox="0 0 24 24"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
		>
			<path
				d="M12 14a3 3 0 003-3V5a3 3 0 10-6 0v6a3 3 0 003 3z"
				fill="#4285F4"
			/>
			<path
				d="M19 11a7 7 0 01-14 0"
				stroke="#4285F4"
				strokeWidth="2"
				strokeLinecap="round"
			/>
			<path
				d="M12 18v3"
				stroke="#4285F4"
				strokeWidth="2"
				strokeLinecap="round"
			/>
		</svg>
	);
	// ✅ Device detection (mobile + tablet only)
	
	/* ---------------------------------------------------------
		FETCH AUTOCOMPLETE
	--------------------------------------------------------- */
	const fetchSuggestions = async (text, setList, controllerRef) => {
		if (
			!text.trim() ||
			text.toLowerCase() === "current location" ||
			!MAPBOX_TOKEN
		) {
			setList([]);
			return;
		}
		if (controllerRef.current) controllerRef.current.abort();
		const controller = new AbortController();
		controllerRef.current = controller;
		const url =
			`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(text)}.json` +
			`?autocomplete=true&limit=6&types=place,address,poi&access_token=${MAPBOX_TOKEN}`;
		try {
			const res = await fetch(url, { signal: controller.signal });
			if (!res.ok) {
				console.error("Mapbox error:", res.status, await res.text());
				return;
			}
			const data = await res.json();
			setList(data.features || []);
		} catch (err) {
			if (err.name !== "AbortError") console.error(err);
		}
	};
	/* ---------------------------------------------------------
		MAIN DEBOUNCE
	--------------------------------------------------------- */
	useEffect(() => {
		if (debounceRef.current) clearTimeout(debounceRef.current);
		if (!query.trim()) {
			setPredictions([]);
			return;
		}
		debounceRef.current = setTimeout(
			() => fetchSuggestions(query, setPredictions, abortRef),
			DEBOUNCE_MS
		);
	}, [query]);
	useEffect(() => {
		const SpeechRecognition =
			window.SpeechRecognition || window.webkitSpeechRecognition;
		if (!SpeechRecognition) return;
		const recognition = new SpeechRecognition();
		recognition.lang = "en-US";
		recognition.continuous = false;
		recognition.interimResults = false;
		recognition.onstart = () => setIsListening(true);
		recognition.onend = () => setIsListening(false);
		recognition.onerror = () => setIsListening(false);
		recognition.onresult = (event) => {
			const transcript = event.results[0][0].transcript;
			setQuery(transcript);
			setShowSuggestions(true);
			setIsTypingDestination(true);
		};
		recognitionRef.current = recognition;
	}, []);
	/* ---------------------------------------------------------
		SELECT MAIN SEARCH RESULT
	--------------------------------------------------------- */
	const selectPlace = (p) => {
	  if (!p) return;
	  // ✅ FORCE search mode UI
	  setSearchActive(true);
	  setQuery(p.place_name);
	  setPredictions([]);
	  setShowSuggestions(false);
	  setIsTypingDestination(false);
	  // ✅ IMPORTANT — THIS WAS MISSING
	  onPlaceSelected?.(p);
	  onSuggestionSelect?.(p.place_name);
	  // 📱 Mobile auto navigate
	  if (isMobileDevice) {
	    navigate("/search-point", {
	      state: {
	        place: {
	          id: p.id,
	          place_name: p.place_name,
	          center: p.center,
	        },
	      },
	    });
	  }
	};
	const startListening = () => {
		if (!recognitionRef.current) {
			alert("Speech recognition not supported on this device");
			return;
		}
		recognitionRef.current.start();
	};
	/* ---------------------------------------------------------
		REUSABLE SUGGESTION ROW
	--------------------------------------------------------- */
	const renderRow = (p, index, activeIndex, setActive, selectorFn) => (
		<div
			key={p.id}
			className={`merged-suggestion-row ${index === activeIndex ? "active" : ""
				}`}
			onMouseDown={() => selectorFn(p)}
			onMouseEnter={() => setActive(index)}
		>
			<span className="emoji">📍</span>
			<div className="merged-body">
				<div className="merged-title">{p.place_name}</div>
				<div className="merged-sub">{p.place_type?.join(", ")}</div>
			</div>
		</div>
	);
	// ⏱️ Start long press (mobile/tablet only)
	const startLongPress = (item, index) => {
		if (!isMobileDevice) return;
		longPressTimerRef.current = setTimeout(() => {
			setLongPressItem({ item, index });
			setShowDeleteModal(true);
			longPressTimerRef.current = null; // ✅ IMPORTANT
		}, 700);
	};
	// ❌ Cancel long press
	const cancelLongPress = () => {
		if (longPressTimerRef.current) {
			clearTimeout(longPressTimerRef.current);
			longPressTimerRef.current = null;
		}
	};
	/* ---------------------------------------------------------
		FINAL JSX UI
	--------------------------------------------------------- */
	return (
		<div
			className={`search-wrapper-main mobile-aware ${searchActive ? "search-active" : ""
				}`}
			ref={wrapperRef}
		>
			{/* ⭐ SEARCH STACK — BOTH SEARCH BARS + SUGGESTION BOX ⭐ */}
			<div className="search-box-stack">
				{/* MAIN SEARCH BAR */}
				<div className="merged-search-box">
					<div className="merged-left-icons" />
					{!searchActive && (
						<img
							src="https://i.pravatar.cc/150?img=32"
							alt="Profile"
							className={`profile-hamburger ${profileActive ? "active" : ""}`}
							onClick={(e) => {
								e.stopPropagation();
								setProfileActive(true);
								onHamburgerClick?.();
								// remove animation after tap
								setTimeout(() => setProfileActive(false), 180);
							}}
						/>
					)}
					<FaArrowLeft
						className={`merged-icon-search back-arrow ${searchActive ? "show" : ""}`}
						onClick={() => {
							setSearchActive(false);
							setQuery("");
							setPredictions([]);
							setIsTypingDestination(false);
							setShowSuggestions(false);
						}}
					/>
					<input
						ref={searchInputRef}
						type="text"
						placeholder="Your location"
						value={query}
						onFocus={() => {
							setSearchActive(true);
							setIsTypingDestination(false);
							setShowSuggestions(true);
							// default value only once
							if (!query) {
								setShowSuggestions(true);
							}
						}}
						onChange={(e) => {
							const val = e.target.value;
							setQuery(val);
							setShowSuggestions(true);
							setIsTypingDestination(!!val.trim());
							if (val.trim()) setIsListening(false);
						}}
					/>
					{/* RIGHT ICON SLOT — MIC / CLEAR (ONE POSITION) */}
					<div className="search-right-icon">
						{query ? (
							<FaTimes
								className="clear-icon"
								onClick={() => {
									setQuery("");
									setPredictions([]);
									setIsTypingDestination(false);
									setIsListening(false);
									setShowSuggestions(true);
								}}
							/>
						) : (
							isMobileDevice && (
								<div
									className={`mic-icon ${isListening ? "listening" : ""}`}
									onClick={startListening}
									title="Search by voice"
								>
									🎤
								</div>
							)
						)}
					</div>
				</div>
				{/* ⭐⭐ FIXED: SUGGESTION BOX IS NOW HERE ⭐⭐ */}
				{showSuggestions && (
					<div className="merged-suggestion-box visible">
						{/* ================= SAVED + RECENT (HIDE WHILE TYPING) ================= */}
						{!isTypingDestination && (
							<>
								{/* SAVED PLACES */}
								<div className="suggestion-section-title">Saved Places</div>
								<div
									className="merged-suggestion-row"
									onMouseDown={() => handleShortcutClick("home")}
								>
									<span className="emoji">🏠</span>
									<div className="merged-body">
										<div className="merged-title">Home</div>
										<div className="merged-sub">Saved place</div>
									</div>
								</div>
								<div
									className="merged-suggestion-row"
									onMouseDown={() => handleShortcutClick("office")}
								>
									<span className="emoji">🏢</span>
									<div className="merged-body">
										<div className="merged-title">Office</div>
										<div className="merged-sub">Saved place</div>
									</div>
								</div>
								{/* RECENT SEARCHES */}
								<div className="suggestion-section-title recent-header">
									<span>Recent</span>
									{history.length > 0 && (
										<button
											className="clear-history-btn"
											onMouseDown={(e) => {
												e.stopPropagation();
												deleteHistoryItem("ALL");
											}}
										>
											Clear all
										</button>
									)}
								</div>
								{history.length === 0 ? (
									<div className="merged-empty">No recent searches</div>
								) : (
									history.map((item, i) => (
										<div
											key={i}
											className="merged-suggestion-row"
											onMouseDown={(e) => {
												e.preventDefault();
												e.stopPropagation(); // ✅ CRITICAL FIX
												// 🖥️ PC → ONLY fill text
												if (!isMobileDevice) {
													handleHistorySelect(item, false);
												}
											}}
											onClick={(e) => {
												e.stopPropagation(); // ✅ CRITICAL FIX
												// 📱 Mobile / Tablet → navigate
												if (isMobileDevice) {
													handleHistorySelect(item, true);
												}
											}}
											onTouchStart={(e) => {
												e.stopPropagation(); // ✅ prevent document handler
												startLongPress(item, i);
											}}
											onTouchEnd={cancelLongPress}
											onTouchMove={cancelLongPress}
										>
											<span className="emoji">🕘</span>
											<div className="merged-body">
												<div className="merged-title">{item}</div>
											</div>
											{!isMobileDevice && (
												<FaTimes
													className="merged-delete"
													onMouseDown={(e) => {
														e.stopPropagation();
														deleteHistoryItem(i);
													}}
												/>
											)}
										</div>
									))
								)}
							</>
						)}
						{/* ================= AUTOCOMPLETE (SHOW WHILE TYPING) ================= */}
						{isTypingDestination && predictions.length > 0 && (
							<>
								<div className="suggestion-section-title">Suggestions</div>
								{predictions.map((p, i) =>
									renderRow(p, i, selectedIndex, setSelectedIndex, selectPlace)
								)}
							</>
						)}
						<div className="merged-footer">Powered by Omoi Route</div>
					</div>
				)}
			</div>
			{showDeleteModal && (
				<div
					className="mobile-delete-overlay"
					onClick={() => {
						setShowDeleteModal(false);
						setLongPressItem(null);
					}}
				>
					<div className="mobile-delete-modal">
						<div className="modal-header">
							<div className="modal-main-title">Delete suggested search?</div>
							<div className="modal-sub-title">
								This suggestion will be removed from Omoi Map
							</div>
						</div>
						<div className="modal-item">{longPressItem?.item}</div>

						<div className="modal-actions">
							<button
								className="btn-cancel"
								onClick={() => {
									setShowDeleteModal(false);
									setLongPressItem(null);
								}}
							>
								Cancel
							</button>

							<button
								className="btn-delete"
								onClick={() => {
									deleteHistoryItem(longPressItem.index);
									setShowDeleteModal(false);
									setLongPressItem(null);
								}}
							>
								Delete
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}