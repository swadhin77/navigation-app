import React, { createContext, useEffect, useState } from "react";

export const OfflineContext = createContext();

export const OfflineProvider = ({ children }) => {

  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {

    const updateStatus = () => {

      const offline = !navigator.onLine;
      setIsOffline(offline);

      if (offline) {
        document.body.classList.add("offline-mode");
      } else {
        document.body.classList.remove("offline-mode");
      }

    };

    window.addEventListener("online", updateStatus);
    window.addEventListener("offline", updateStatus);

    updateStatus();

    return () => {
      window.removeEventListener("online", updateStatus);
      window.removeEventListener("offline", updateStatus);
    };

  }, []);

  return (
    <OfflineContext.Provider value={{ isOffline }}>
      {children}
    </OfflineContext.Provider>
  );
};