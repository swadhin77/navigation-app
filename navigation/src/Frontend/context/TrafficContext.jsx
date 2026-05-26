import { createContext, useContext, useState } from "react";

const TrafficContext = createContext(null);

export function TrafficProvider({ children }) {

  const [trafficEnabled, setTrafficEnabled] = useState(false);

  return (
    <TrafficContext.Provider value={{ trafficEnabled, setTrafficEnabled }}>
      {children}
    </TrafficContext.Provider>
  );
}

export function useTraffic() {
  return useContext(TrafficContext);
}