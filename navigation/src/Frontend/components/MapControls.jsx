import React, { useState } from "react";

export default function MapControls({
	mapRef,
	is3DView,
	setIs3DView,
	isSatelliteView,
	setIsSatelliteView,
	trafficVisible,
	toggleTraffic,
	recenterMap,
	setShowWeather,
	isOnline,
	theme,
	toggle3DView,
	toggleSatelliteView,
	showLimitedControls,
	callNearestPolice,
	callNearestHospital
}) {

	// menu toggle state
	const [menuOpen, setMenuOpen] = useState(false);

	return (
		<div className="bottom-right">

			{/* SOS */}
			<button className="circle-btn sos-btn"
				title="Emergency SOS"
			>
				SOS
			</button>
			{/* POLICE CALL */}
			<button
				className="circle-btn police-btn"
				onClick={callNearestPolice}
				title="Call Police"
			>
				🚓
			</button>

			{/* HOSPITAL CALL */}
			<button
				className="circle-btn hospital-btn"
				onClick={callNearestHospital}
				title="Call Hospital"
			>
				🏥
			</button>
			{/* MAIN MENU BUTTON */}
			<button
				className="circle-btn menu-btn"
				onClick={() => setMenuOpen(prev => !prev)}
				title="Map Options"
			>
				⚙
			</button>

			{/* EXPANDABLE BUTTONS */}
			<div className={`menu-expand ${menuOpen ? "open" : ""}`}>

				{/* 3D */}
				<button
					className={`circle-btn view-toggle-btn ${is3DView ? "active" : ""}`}
					onClick={() =>
						toggle3DView(mapRef.current, is3DView, setIs3DView)
					}
					title={is3DView ? "Switch to 2D View" : "Switch to 3D View"}
				>
					{is3DView ? "2D" : "3D"}
				</button>

				{/* SATELLITE */}
				{isOnline && (
					<button
						className={`circle-btn satellite ${isSatelliteView ? "active" : ""}`}
						onClick={() =>
							toggleSatelliteView(
								mapRef.current,
								isSatelliteView,
								setIsSatelliteView,
								theme,
								is3DView
							)
						}
						title="Satellite View"
					>
						🛰
					</button>
				)}

				{/* TRAFFIC */}
				{isOnline && trafficVisible !== undefined && (
					<button
						className={`circle-btn traffic ${trafficVisible ? "active" : ""}`}
						onClick={toggleTraffic}
						title="Toggle Traffic"
					>
						🚦
					</button>
				)}

			</div>

			{/* RECENTER */}
			{!showLimitedControls && (
				<button
					className="circle-btn recenter"
					onClick={recenterMap}
					title="Recenter Map"
				>
					🎯
				</button>
			)}

			{/* WEATHER */}
			{isOnline && (
				<button
					className="circle-btn weather"
					onClick={() => setShowWeather(true)}
					title="Weather"
				>
					🌦
				</button>
			)}

		</div>
	);
}