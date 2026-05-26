import { createContext, useContext, useState } from "react";

const AppContext = createContext(null);

export function AppProvider({ children }) {
	const [location, setLocation] = useState(null);
	const [weather, setWeather] = useState(null);
	const [traffic, setTraffic] = useState(null);
	const [metar, setMetar] = useState(null);

	return (
		<AppContext.Provider
			value={{
				location,
				weather,
				traffic,
				metar,

				setLocation,
				setWeather,
				setTraffic,
				setMetar
			}}
		>
			{children}
		</AppContext.Provider>
	);
}

export function useAppContext() {
	return useContext(AppContext);
}