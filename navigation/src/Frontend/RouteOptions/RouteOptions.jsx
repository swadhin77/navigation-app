import React from "react";
import "./RouteOptions.css";

export default function RouteOptions({
  open,
  onClose,
  options,
  setOptions,
}) {
  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="route-options-backdrop"
        onClick={onClose}
      />

      {/* Bottom Sheet */}
      <div className="route-options-sheet">
        <div className="route-options-header">
          <span>Route options</span>
		  <button
		    className="route-options-close"
		    onClick={onClose}
		    aria-label="Close route options"
		  >
		    ✕
		  </button>
        </div>

        <OptionRow
          label="Avoid highways"
          checked={options.avoidHighways}
          onChange={(v) =>
            setOptions({ ...options, avoidHighways: v })
          }
        />

        <OptionRow
          label="Avoid tolls"
          checked={options.avoidTolls}
          onChange={(v) =>
            setOptions({ ...options, avoidTolls: v })
          }
        />

        <OptionRow
          label="Avoid ferries"
          checked={options.avoidFerries}
          onChange={(v) =>
            setOptions({ ...options, avoidFerries: v })
          }
        />

        <OptionRow
          label="Prefer fuel-efficient routes"
          checked={options.fuelEfficient}
          onChange={(v) =>
            setOptions({ ...options, fuelEfficient: v })
          }
        />
      </div>
    </>
  );
}

function OptionRow({ label, checked, onChange }) {
  return (
    <div className="route-option-row">
      <span>{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
    </div>
  );
}