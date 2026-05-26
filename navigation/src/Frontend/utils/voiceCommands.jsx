// /src/utils/voiceCommands.js

export function parseCommand(text) {
  if (text.includes("weather")) return "SHOW_WEATHER";
  if (text.includes("traffic")) return "SHOW_TRAFFIC";
  if (text.includes("start navigation")) return "START_NAVIGATION";
  if (text.includes("stop navigation")) return "STOP_NAVIGATION";
  if (text.includes("satellite")) return "TOGGLE_SATELLITE";
  if (text.includes("friend")) return "OPEN_FRIEND";
  return "UNKNOWN";
}
