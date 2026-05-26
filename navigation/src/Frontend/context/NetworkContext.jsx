import React, { createContext, useEffect, useState } from "react";

export const NetworkContext = createContext();

export const NetworkProvider = ({ children }) => {

  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {

    const updateNetwork = () => {
      setIsOnline(navigator.onLine);
    };

    window.addEventListener("online", updateNetwork);
    window.addEventListener("offline", updateNetwork);

    return () => {
      window.removeEventListener("online", updateNetwork);
      window.removeEventListener("offline", updateNetwork);
    };

  }, []);

  return (
    <NetworkContext.Provider value={{ isOnline }}>
      {children}
    </NetworkContext.Provider>
  );
};