import React, { useEffect, useRef, useState } from 'react';

// NPM-based imports
import * as Cesium from 'cesium';
import 'cesium/Build/Cesium/Widgets/widgets.css';
import mapboxgl from 'mapbox-gl';

// Vite-compatible environment variables
const DEFAULT_CESIUM_TOKEN = import.meta.env.VITE_CESIUM_ION_TOKEN || '';
const DEFAULT_MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || '';

// Detect high-end device for Cesium
function detectHighEndDevice() 
{
	try 
	{
		const canvas = document.createElement('canvas');
		const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
		if (!gl) return false;

		const deviceMemory = navigator.deviceMemory || 0;
		const cores = navigator.hardwareConcurrency || 0;
		const maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE) || 0;

		return (
			(gl instanceof WebGL2RenderingContext && (deviceMemory >= 4 || cores >= 4 || maxTextureSize >= 4096)) ||
			(deviceMemory >= 2 && cores >= 2 && maxTextureSize >= 2048)
		);
	} 
	catch (err) 
	{
		console.warn('High-end device detection failed:', err);
		return false;
	}
}

export default function ThreeDView({
	center = [77.5946, 12.9716],
	initialZoom = 12,
	cesiumToken = DEFAULT_CESIUM_TOKEN,
	mapboxToken = DEFAULT_MAPBOX_TOKEN,
	showUnity = false,
}) {
	const [mode, setMode] = useState('detecting'); // 'cesium' | 'mapbox' | 'detecting'
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	const cesiumContainerRef = useRef(null);
	const mapboxContainerRef = useRef(null);
	const cesiumViewerRef = useRef(null);
	const mapboxMapRef = useRef(null);

	// Decide mode on mount based on device capability
	useEffect(() => {
		const highEnd = detectHighEndDevice();
		setMode(highEnd && cesiumToken ? 'cesium' : 'mapbox');
	}, [cesiumToken]);

	// ---------- Handle window resize for both Cesium & Mapbox ----------
	useEffect(() => {
		const handleResize = () => {
			cesiumViewerRef.current?.resize();
			mapboxMapRef.current?.resize();
		};
		window.addEventListener('resize', handleResize);
		return () => window.removeEventListener('resize', handleResize);
	}, []);

	// Initialize Cesium
	useEffect(() => {
		if (mode !== 'cesium') return;

		setLoading(true);
		let mounted = true;
		Cesium.Ion.defaultAccessToken = cesiumToken;

		const viewer = new Cesium.Viewer(cesiumContainerRef.current, {
			terrainProvider: Cesium.createWorldTerrain(),
			timeline: false,
			animation: false,
			baseLayerPicker: true,
			sceneModePicker: true,
		});

		// Add OpenStreetMap 3D buildings
		Cesium.createOsmBuildingsAsync()
			.then((osm) => viewer.scene.primitives.add(osm))
			.catch((err) => {
				console.warn('Cesium OSM buildings failed:', err);
				if (mounted) setError(err?.message || 'Cesium OSM buildings failed');
			});

		// Fly to initial position
		viewer.camera.flyTo({
			destination: Cesium.Cartesian3.fromDegrees(center[0], center[1], 1500),
			duration: 1.5,
		});

		cesiumViewerRef.current = viewer;
		if (mounted) setLoading(false);

		return () => 
			{
			mounted = false;
			if (cesiumViewerRef.current?.destroy) {
				cesiumViewerRef.current.destroy();
				cesiumViewerRef.current = null;
			}
		};
	}, [mode, cesiumToken, center]);

	// Initialize Mapbox
	useEffect(() => 
		{
		if (mode !== 'mapbox') return;

		setLoading(true);
		let mounted = true;
		mapboxgl.accessToken = mapboxToken;

		const map = new mapboxgl.Map({
			container: mapboxContainerRef.current,
			style: 'mapbox://styles/mapbox/light-v11',
			center,
			zoom: initialZoom,
			pitch: 60,
			antialias: true,
		});

		map.on('load', () => {
			try {
				// Terrain
				map.addSource('mapbox-dem', {
					type: 'raster-dem',
					url: 'mapbox://mapbox.terrain-rgb',
					tileSize: 512,
				});
				map.setTerrain({ source: 'mapbox-dem', exaggeration: 1.25 });

				// 3D buildings
				const layers = map.getStyle().layers;
				const labelLayerId = layers.find((l) => l.type === 'symbol' && l.layout?.['text-field']);

				map.addLayer(
					{
						id: '3d-buildings',
						source: 'composite',
						'source-layer': 'building',
						filter: ['==', ['get', 'extrude'], 'true'],
						type: 'fill-extrusion',
						minzoom: 15,
						paint: {
							'fill-extrusion-color': '#aaa',
							'fill-extrusion-height': ['get', 'height'],
							'fill-extrusion-base': ['get', 'min_height'],
							'fill-extrusion-opacity': 0.9,
						},
					},
					labelLayerId?.id
				);
			} catch (err) {
				console.error('Mapbox 3D layer error:', err);
				if (mounted) setError(err?.message || 'Mapbox 3D layer error');
			}
			if (mounted) setLoading(false);
		});

		mapboxMapRef.current = map;

		return () => {
			mounted = false;
			if (mapboxMapRef.current) {
				mapboxMapRef.current.remove();
				mapboxMapRef.current = null;
			}
		};
	}, [mode, mapboxToken, center, initialZoom]);

	return (
		<div className="p-4 w-full">
			<div className="relative border rounded h-[70vh] overflow-hidden">
				{/* Loading overlay */}
				{loading && (
					<div className="absolute inset-0 flex items-center justify-center bg-black/30 text-white">
						Loading 3D view...
					</div>
				)}

				{/* Error display */}
				{error && (
					<div className="absolute top-3 left-3 bg-red-600 text-white px-3 py-1 rounded">
						Error: {error}
					</div>
				)}

				{/* Cesium container */}
				<div
					ref={cesiumContainerRef}
					style={{ display: mode === 'cesium' ? 'block' : 'none', width: '100%', height: '100%' }}
				/>

				{/* Mapbox container */}
				<div
					ref={mapboxContainerRef}
					style={{ display: mode === 'mapbox' ? 'block' : 'none', width: '100%', height: '100%' }}
				/>

				{/* Optional Unity iframe */}
				{showUnity && (
					<iframe
						title="Unity WebGL Build"
						src="/unity_build/index.html"
						style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0 }}
					/>
				)}
			</div>
		</div>
	);
}
