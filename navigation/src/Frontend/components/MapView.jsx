import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

mapboxgl.accessToken = MAPBOX_TOKEN;

export default function MapView({ center = [77.5946, 12.9716], zoom = 12 }) {
	const mapRef = useRef(null);
	const mapContainerRef = useRef(null);
	useEffect(() => {
		if (!mapContainerRef.current) return;

		mapRef.current = new mapboxgl.Map({
			container: mapContainerRef.current,
			style: 'mapbox://styles/mapbox/streets-v12',
			center,
			zoom
		});

		mapRef.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

		mapRef.current.on("click", async (e) => {
			const lat = e.lngLat.lat;
			const lng = e.lngLat.lng;

			try {
				const geo = await reverseGeocode(lat, lng);

				await sendLocation({
					lat,
					lng,
					address: geo.address,
					pincode: geo.pincode,
					type: "CLICK",
					time: new Date().toLocaleTimeString("en-GB")
				});

			} catch (err) {
				console.error("Click location error:", err);
			}
		});

		return () => mapRef.current?.remove();
	}, []);

	useEffect(() => {
		if (!mapRef.current) return;
		mapRef.current.setCenter(center);
	}, [center]);

	return (
		<div style={{ width: '100%', height: '100%' }} ref={mapContainerRef} />
	);
}
