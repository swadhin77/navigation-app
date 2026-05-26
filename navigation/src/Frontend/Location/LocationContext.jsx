import { createContext, useContext, useEffect, useState } from "react";
import useLocation from "../hooks/useLocation";
const LocationContext = createContext(null);

export const useLocationData = () => {
	const ctx = useContext(LocationContext);
	if (!ctx) throw new Error("useLocationData must be used inside provider");
	return ctx;
};

export const LocationProvider = ({ children }) => {

	const location = useLocation();

	return (
		<LocationContext.Provider value={location}>
			{children}
		</LocationContext.Provider>
	);
};