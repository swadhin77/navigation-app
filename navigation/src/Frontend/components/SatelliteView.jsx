import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';

const TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;
mapboxgl.accessToken = TOKEN;

export default function SatelliteView({ center = [77.5946, 12.9716], zoom = 12 }) {
	const mapRef = useRef(null);

	useEffect(() => {
		if (!mapRef.current) return;

		const map = new mapboxgl.Map({
			container: mapRef.current,
			style: 'mapbox://styles/mapbox/satellite-streets-v11', // satellite + labels
			center,
			zoom
		});

		map.addControl(new mapboxgl.NavigationControl(), 'top-right');

		return () => map.remove();
	}, [center, zoom]);

	return (
		<div ref={mapRef} style={{ width: '100%', height: '100%' }} />
	);
}
