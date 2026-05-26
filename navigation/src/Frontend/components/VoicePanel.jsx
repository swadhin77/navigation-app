// /src/components/VoicePanel.jsx
import { parseCommand } from "../utils/voiceCommands";
import useVoiceRecognition from "../hooks/useVoiceRecognition";
import { useVoiceContext } from "../context/VoiceContext";

export default function VoicePanel() {
  const { command, setCommand } = useVoiceContext();

  const { listening, start } = useVoiceRecognition(text => {
    const cmd = parseCommand(text);
    setCommand(cmd);
  });

  return (
    <div className="ui-panel" style={{ bottom: 10, left: 10 }}>
      <button className="ui-btn" onClick={start}>
        {listening ? "🎤 Listening..." : "🎙 Voice Command"}
      </button>
      {command && <div>Command: {command}</div>}
    </div>
  );
}
