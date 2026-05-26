// /src/context/VoiceContext.js
import { createContext, useContext, useState } from "react";

const VoiceContext = createContext(null);

export function VoiceProvider({ children }) {
  const [command, setCommand] = useState(null);

  return (
    <VoiceContext.Provider value={{ command, setCommand }}>
      {children}
    </VoiceContext.Provider>
  );
}

export function useVoiceContext() {
  return useContext(VoiceContext);
}
