import React, { useState, useRef, useCallback } from "react";
import {
  GoogleMap,
  Autocomplete,
  DirectionsRenderer,
  useJsApiLoader
} from "@react-google-maps/api";

const containerStyle = {
  width: "100%",
  height: "60vh",
};

export default function MultipleDestinationMap() {
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [waypoints, setWaypoints] = useState([]);
  const [directions, setDirections] = useState(null);
  const [optimize, setOptimize] = useState(false);

  const originRef = useRef();
  const destinationRef = useRef();
  const waypointRefs = useRef([]);

  const MAX_WAYPOINTS_ALLOWED = 25;

  // Google Maps Loader
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: "AIzaSyD3B5J-xxxxxxxxxxxxxxxxxxxxxxxx",
    libraries: ["places"],
  });

  const addWaypoint = () => {
    setWaypoints([...waypoints, ""]);
  };

  const removeWaypoint = (index) => {
    const updated = [...waypoints];
    updated.splice(index, 1);
    setWaypoints(updated);
  };

  const swapWaypoints = (i, j) => {
    if (j < 0 || j >= waypoints.length) return;
    const updated = [...waypoints];
    const temp = updated[i];
    updated[i] = updated[j];
    updated[j] = temp;
    setWaypoints(updated);
  };

  const calculateRoute = async () => {
    if (!originRef.current.value || !destinationRef.current.value) {
      alert("Please enter origin and destination.");
      return;
    }

    const nonEmptyStops = waypoints.filter((w) => w.trim().length > 0);
    if (nonEmptyStops.length + 2 > MAX_WAYPOINTS_ALLOWED) {
      alert(
        `Too many stops! Google API maximum = ${MAX_WAYPOINTS_ALLOWED}. Reduce stops.`
      );
      return;
    }

    const waypointObjects = nonEmptyStops.map((stop) => ({
      location: stop,
      stopover: true,
    }));

    const service = new window.google.maps.DirectionsService();

    const result = await service.route({
      origin: originRef.current.value,
      destination: destinationRef.current.value,
      waypoints: waypointObjects,
      optimizeWaypoints: optimize,
      travelMode: window.google.maps.TravelMode.DRIVING,
    });

    setDirections(result);

    if (optimize && result.routes.length > 0) {
      const order = result.routes[0].waypoint_order;
      alert("Optimized order:\n" + order.map((i) => nonEmptyStops[i]).join(" -> "));
    }
  };

  const clearRoute = () => {
    setDirections(null);
    setOrigin("");
    setDestination("");
    setWaypoints([]);
  };

  if (!isLoaded) return <div>Loading map...</div>;

  return (
    <div style={{ padding: "10px" }}>
      <h3>Multi Destination Route Planner (React)</h3>

      {/* ORIGIN + DESTINATION */}
      <div style={{ marginBottom: "10px" }}>
        <Autocomplete>
          <input
            ref={originRef}
            value={origin}
            onChange={(e) => setOrigin(e.target.value)}
            placeholder="Origin"
            style={{ width: "300px", padding: "6px", marginRight: "10px" }}
          />
        </Autocomplete>

        <Autocomplete>
          <input
            ref={destinationRef}
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            placeholder="Destination"
            style={{ width: "300px", padding: "6px" }}
          />
        </Autocomplete>
      </div>

      <hr />

      {/* WAYPOINTS */}
      <div>
        <button onClick={addWaypoint}>Add Waypoint</button>
        <label style={{ marginLeft: "15px" }}>
          <input
            type="checkbox"
            checked={optimize}
            onChange={() => setOptimize(!optimize)}
          />
          Optimize order
        </label>
      </div>

      {waypoints.map((wp, index) => (
        <div key={index} style={{ display: "flex", alignItems: "center", marginTop: "8px" }}>
          <Autocomplete>
            <input
              value={wp}
              onChange={(e) => {
                const updated = [...waypoints];
                updated[index] = e.target.value;
                setWaypoints(updated);
              }}
              placeholder={`Waypoint ${index + 1}`}
              style={{ width: "300px", padding: "6px" }}
            />
          </Autocomplete>

          <button style={{ marginLeft: "6px" }} onClick={() => swapWaypoints(index, index - 1)}>
            ↑
          </button>
          <button style={{ marginLeft: "6px" }} onClick={() => swapWaypoints(index, index + 1)}>
            ↓
          </button>
          <button style={{ marginLeft: "6px" }} onClick={() => removeWaypoint(index)}>
            Remove
          </button>
        </div>
      ))}

      <hr />

      {/* BUTTONS */}
      <button onClick={calculateRoute} style={{ marginRight: "10px" }}>
        Calculate Route
      </button>

      <button onClick={clearRoute}>Clear</button>

      <hr />

      {/* MAP */}
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={{ lat: 20.5937, lng: 78.9629 }}
        zoom={5}
      >
        {directions && <DirectionsRenderer directions={directions} />}
      </GoogleMap>
    </div>
  );
}
