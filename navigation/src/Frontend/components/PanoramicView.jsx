import React, { useEffect, useRef, useState } from "react";
import { Loader } from "@googlemaps/js-api-loader";
import "./PanoramicView.css";

const PanoramicView = ({
	lat,
	lng,
	address,
	isOpen,
	onClose,
	mode = "fullscreen",
	onExpand,
}) => {
	const panoramaRef = useRef(null);
	const panoramaInstance = useRef(null);
	const [loaded, setLoaded] = useState(false);

	useEffect(() => {
		if (!isOpen) return;

		const loader = new Loader({
			apiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
			version: "weekly",
		});

		loader.load().then(() => {
			panoramaInstance.current =
				new window.google.maps.StreetViewPanorama(
					panoramaRef.current,
					{
						position: { lat, lng },
						pov: { heading: 0, pitch: 0 },
						zoom: 1,
						motionTracking: true,
						motionTrackingControl: true,
						addressControl: false,
						fullscreenControl: false,
					}
				);

			setLoaded(true);
		});
	}, [isOpen, lat, lng]);

	if (!isOpen) return null;

	return (
		<div className={`panorama-wrapper ${mode}`}>
			{mode !== "mini" && (
				<button className="close-btn" onClick={onClose}>
					✕
				</button>
			)}

			<div
				ref={panoramaRef}
				className="panorama-view"
				onClick={() => {
					if (mode === "mini" && onExpand) onExpand();
				}}
			/>
			<div className="panorama-info-box">
				<p><strong>📍 Address:</strong> {address}</p>
				<p><strong>Lat:</strong> {lat}</p>
				<p><strong>Lng:</strong> {lng}</p>
			</div>

			{!loaded && <div className="loading-text">Loading 360° View...</div>}
		</div>

	);
};

export default PanoramicView;