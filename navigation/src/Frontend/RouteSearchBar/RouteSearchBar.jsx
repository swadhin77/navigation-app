import React, { useState, useEffect, useRef } from "react";
import "./RouteSearchBar.css";
import StopSearch from "../StopSearch/StopSearch";
import RouteOptions from "../RouteOptions/RouteOptions.jsx";
import LiveLocation from "../LiveLocation/LiveLocation.jsx";

export default function RouteSearchBar({
  routePoints,
  setRoutePoints,
  onShareRoute,
  onCopyRouteLink,
}) {
  const [showOptions, setShowOptions] = useState(false);
  const [showLiveLocation, setShowLiveLocation] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [expandedMode, setExpandedMode] = useState(false);
  const isMobile = window.innerWidth < 768;

  const boxRef = useRef(null);
  const dragItem = useRef(null);
  const dragOverIndex = useRef(null);
  const isTouch = "ontouchstart" in window;

  /* =====================================================
     ADD STOP — collapsed = single open
  ===================================================== */
  const addStop = () => {
    setRoutePoints(prev => {
      let updated = [...prev];

      if (!expandedMode) {
        // COLLAPSED → hide old stops
        updated = updated.map((p, i) => {
          if (i === 0 || i === prev.length - 1) return p;
          return { ...p, collapsed: true };
        });
        // NEW STOP only open
        updated.splice(updated.length - 1, 0, {
          id: crypto.randomUUID(),
          name: "",
          lat: null,
          lng: null,
          confirmed: false,
          collapsed: false
        });
      } else {
        // EXPANDED → keep all visible AND add stop
        updated.splice(updated.length - 1, 0, {
          id: crypto.randomUUID(),
          name: "",
          lat: null,
          lng: null,
          confirmed: false,
          collapsed: false
        });
      }

      return updated;
    });
  };

  /* =====================================================
     UPDATE STOP — collapse only in collapsed mode
  ===================================================== */
  const updateStop = (index, value, isSuggestion = false) => {
    setRoutePoints(prev => {
      const updated = [...prev];

      if (typeof value === "string") {
        updated[index] = {
          ...updated[index],
          name: value,
          lat: null,
          lng: null,
          confirmed: false,
        };
      } else {
        updated[index] = {
          ...updated[index],
          name: value.place_name,
          lat: value.center[1],
          lng: value.center[0],
          confirmed: true,
        };
      }

      // collapsed mode → collapse & hide after confirm
      if (isSuggestion && !expandedMode) {
        updated[index].collapsed = true;
      }

      // expanded mode → DO NOT collapse
      return updated;
    });

    if (isMobile && isSuggestion && !expandedMode) {
      window.location.href = "/route-preview";
    }
  };

  /* =====================================================
     TOGGLE EXPAND
  ===================================================== */
  const toggleExpand = () => {
    setExpandedMode(prev => {
      const next = !prev;
      setRoutePoints(prevPoints => {
        return prevPoints.map((p, i) => {
          if (i === 0 || i === prevPoints.length - 1) return p;
          return { ...p, collapsed: !next };
        });
      });
      return next;
    });
  };

  /* =====================================================
     DRAG & DROP (unchanged)
  ===================================================== */
  const handleDragStart = (index) => {
    dragItem.current = index;
  };

  const handleDrop = (dropIndex) => {
    const dragIndex = dragItem.current;
    if (dragIndex === null || dragIndex === dropIndex) return;

    setRoutePoints(prev => {
      const updated = [...prev];
      const dragged = updated.splice(dragIndex, 1)[0];
      updated.splice(dropIndex, 0, dragged);
      return updated;
    });

    dragItem.current = null;
  };

  const handleTouchMove = (e) => {
    const y = e.touches[0].clientY;
    const items = document.querySelectorAll(".stop-draggable");
    items.forEach(item => {
      const rect = item.getBoundingClientRect();
      if (y > rect.top && y < rect.bottom) {
        dragOverIndex.current = Number(item.dataset.index);
      }
    });
  };

  const handleTouchEnd = () => {
    if (
      dragItem.current !== null &&
      dragOverIndex.current !== null &&
      dragItem.current !== dragOverIndex.current
    ) {
      handleDrop(dragOverIndex.current);
    }
    dragItem.current = null;
    dragOverIndex.current = null;
  };

  const removePoint = (index) => {
    if (index === 0 || index === routePoints.length - 1) return;
    setRoutePoints(prev => prev.filter((_, i) => i !== index));
  };

  const handleSwap = () => {
    setRoutePoints(prev => {
      const copy = [...prev];
      const t = copy[0];
      copy[0] = copy[copy.length - 1];
      copy[copy.length - 1] = t;
      return copy;
    });
  };

  useEffect(() => {
    const close = (e) => {
      if (!boxRef.current?.contains(e.target)) {
        setMenuOpen(false);
      }
    };
	document.addEventListener("mousedown", close);
	document.addEventListener("touchstart", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  /* =====================================================
     UI
  ===================================================== */
  return (
    <>
      <div ref={boxRef} className="rsb-wrapper">

        {/* FROM */}
        <div className="rsb-row">
          <StopSearch
            index={0}
            value={routePoints[0]?.name || ""}
            placeholder="From"
            onChange={updateStop}
            onRemove={removePoint}
            showRemove={false}
          />

          <div className="rsb-swap-btn" onClick={handleSwap}>⇅</div>

          <button className="rsb-menu-btn" onClick={() => setMenuOpen(prev => !prev)}>⋮</button>
          {menuOpen && (
            <div className="rsb-menu-popup">
              <div className="route-menu-item" onClick={() => { setMenuOpen(false); setShowOptions(true); }}>Options</div>
              <div className="route-menu-item" onClick={() => { setMenuOpen(false); onShareRoute?.(); }}>Share Direction</div>
              <div className="route-menu-item" onClick={() => { setMenuOpen(false); onCopyRouteLink?.(); }}>Copy Route Link</div>
              <div className="route-menu-item" onClick={() => { setMenuOpen(false); setShowLiveLocation(true); }}>Share Live Location</div>
            </div>
          )}
        </div>

        {/* COLLAPSED (NO STOPS YET) */}
        {routePoints.length === 2 && (
          <div className="rsb-3dot-row">
		  <div
		    className="rsb-3dot-btn"
		    onClick={isMobile ? addStop : undefined}
		    onDoubleClick={!isMobile ? addStop : undefined}
		  >
		    ...
		  </div>
          </div>
        )}

        {/* STOPS EXIST */}
		{routePoints.length > 2 && (
		  <>
		    {routePoints.slice(1, -1).map((p, i) => {
		      const index = i + 1;

		      // CASE A — collapsed mode + stop is OPEN (typing mode)
		      if (!expandedMode && !p.collapsed) {
		        return (
		          <div className="stop-exp-row" key={p.id}>
		            <StopSearch
		              index={index}
		              value={p.name}
		              placeholder="Stop"
		              onChange={updateStop}
		              onRemove={removePoint}
		            />
		          </div>
		        );
		      }

		      // CASE B — collapsed mode + stop is CLOSED → show NOTHING
		      if (!expandedMode && p.collapsed) {
		        return null;
		      }

		      // CASE C — expanded mode → show ALL stops
		      if (expandedMode) {
		        return (
		          <div className="stop-exp-row" key={p.id}>
		            <StopSearch
		              index={index}
		              value={p.name}
		              placeholder="Stop"
		              onChange={updateStop}
		              onRemove={removePoint}
		            />
		          </div>
		        );
		      }
		    })}

		    {/* 3 DOT + ARROW */}
		    <div className="rsb-3dot-row">
		      <div className="rsb-3dot-btn" onDoubleClick={addStop}>...</div>
		      <div className="rsb-arrow-btn" onClick={toggleExpand}>
		        {expandedMode ? "▾" : "▸"}
		      </div>
		    </div>
		  </>
		)}


        {/* TO */}
        <StopSearch
          index={routePoints.length - 1}
          value={routePoints[routePoints.length - 1]?.name || ""}
          placeholder="To"
          onChange={updateStop}
          onRemove={removePoint}
          showRemove={false}
        />

      </div>

      <RouteOptions open={showOptions} onClose={() => setShowOptions(false)} />
      <LiveLocation open={showLiveLocation} onClose={() => setShowLiveLocation(false)} />
    </>
  );
}
