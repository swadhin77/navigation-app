import { createContext, useContext, useState } from "react";

const NavigationContext = createContext(null);

export const useNavigationData = () => {
  const ctx = useContext(NavigationContext);
  if (!ctx) {
    throw new Error("useNavigationData must be used inside NavigationProvider");
  }
  return ctx;
};

export const NavigationProvider = ({ children }) => {
  const [navData, setNavData] = useState(null);

  return (
    <NavigationContext.Provider value={{ navData, setNavData }}>
      {children}
    </NavigationContext.Provider>
  );
};
