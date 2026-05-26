import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { LocationProvider } from "./Frontend/context/LocationProvider.jsx";
import mapboxgl from "mapbox-gl";
mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;
/* ===== Theme Load ===== */
const savedTheme = localStorage.getItem("themeMode");
if (savedTheme === "dark") {
	document.documentElement.classList.add("dark-mode");
}
/* ===== React App Render ===== */
ReactDOM.createRoot(document.getElementById("root")).render(
	<React.StrictMode>
	  <LocationProvider>
	    <RootProvider>
	      <App />
	    </RootProvider>
	  </LocationProvider>
	</React.StrictMode>
);
/* ===== SERVICE WORKER REGISTRATION ===== */
if ("serviceWorker" in navigator) {
	window.addEventListener("load", () => {
		navigator.serviceWorker
			.register("/sw.js")
			.then((registration) => {
				console.log("Service Worker Registered:", registration);
			})
			.catch((error) => {
				console.log("Service Worker Registration Failed:", error);
			});
	});
}