// /src/hooks/useVoiceRecognition.js
import { useEffect, useState } from "react";

export default function useVoiceRecognition(onCommand) {
  const [listening, setListening] = useState(false);
  let recognition = null;

  useEffect(() => {
    if (!("webkitSpeechRecognition" in window)) {
      console.warn("Speech recognition not supported");
      return;
    }

    recognition = new webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onresult = event => {
      const text = event.results[0][0].transcript.toLowerCase();
      onCommand && onCommand(text);
    };

    recognition.onend = () => {
      setListening(false);
    };
  }, []);

  function start() {
    if (recognition) {
      setListening(true);
      recognition.start();
    }
  }

  return { listening, start };
}
