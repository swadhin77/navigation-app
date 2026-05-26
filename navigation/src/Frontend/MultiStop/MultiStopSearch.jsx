import React, { useState } from "react";
import { FaSearch, FaTimes } from "react-icons/fa";

const MultiStopSearch = () => {
  const [stops, setStops] = useState([{ id: 1, query: "", editing: false }]);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [predictions, setPredictions] = useState({}); // store predictions per stop
  const [routeStarted, setRouteStarted] = useState(false);

  // Add a new stop
  const handleAddStop = () => {
    const newId = stops.length + 1;
    setStops((prev) => [...prev, { id: newId, query: "", editing: false }]);
    setShowMoreMenu(false);
  };

  // Update query for a stop
  const handleQueryChange = (id, value) => {
    setStops((prev) =>
      prev.map((stop) => (stop.id === id ? { ...stop, query: value, editing: true } : stop))
    );
    setRouteStarted(false); // show GO again if edited
  };

  // Clear a stop input
  const handleClearStop = (id) => {
    setStops((prev) =>
      prev.map((stop) => (stop.id === id ? { ...stop, query: "", editing: false } : stop))
    );
    setPredictions((prev) => ({ ...prev, [id]: [] }));
    setRouteStarted(false);
  };

  return (
    <div className="multi-stop-container">
      {/* 3 DOT MENU BUTTON */}
      <div
        className="three-dot-btn"
        onClick={(e) => {
          e.stopPropagation();
          setShowMoreMenu((prev) => !prev);
        }}
      >
        ⋮
      </div>

      {showMoreMenu && (
        <div className="three-dot-menu">
          <div className="menu-item" onClick={handleAddStop}>
            ➕ Add stop
          </div>
          <div className="menu-item">📤 Share directions</div>
          <div className="menu-item">⚙️ Options</div>
          <div className="menu-item">🔄 Refresh</div>
        </div>
      )}

      {/* Render multiple stops */}
      {stops.map((stop, index) => (
        <div key={stop.id} className={`merged-search-box ${stop.editing ? "second" : ""}`}>
          <FaSearch className="merged-icon-search" />
          <input
            type="text"
            placeholder={`Stop ${index + 1}...`}
            value={stop.query}
            readOnly={!stop.editing}
            onChange={(e) => handleQueryChange(stop.id, e.target.value)}
            onFocus={() =>
              setStops((prev) =>
                prev.map((s) => (s.id === stop.id ? { ...s, editing: true } : s))
              )
            }
          />
          {stop.query && (
            <FaTimes
              className="merged-clear-btn"
              onClick={() => handleClearStop(stop.id)}
            />
          )}
        </div>
      ))}

      {/* Example "GO" button logic */}
      {stops.some((stop) => stop.query) && !routeStarted && (
        <button
          className="go-btn"
          onClick={() => setRouteStarted(true)}
        >
          GO
        </button>
      )}
    </div>
  );
};

export default MultiStopSearch;
