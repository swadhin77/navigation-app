let map;
let directionsService;
let directionsRenderer;
let distanceMatrixService;
let trafficLayer;
let autocompleteStart, autocompleteEnd;

function initMap() 
{
  // 1) Base map
  map = new google.maps.Map(document.getElementById("map"), 
  {
    center: { lat: 20.5937, lng: 78.9629 }, // India center
    zoom: 5,
    mapTypeControl: false,
    streetViewControl: true,
    fullscreenControl: true,
  });

  // 2) Services
  directionsService = new google.maps.DirectionsService();
  directionsRenderer = new google.maps.DirectionsRenderer
  ({
    map,
    suppressMarkers: false,
    preserveViewport: false,
  });
  distanceMatrixService = new google.maps.DistanceMatrixService();
  trafficLayer = new google.maps.TrafficLayer();

  // 3) Autocomplete for From/To (Places API)
  const startInput = document.getElementById("start");
  const endInput = document.getElementById("end");

  autocompleteStart = new google.maps.places.Autocomplete(startInput,  {
    fields: ["place_id", "geometry", "name"],
  });
  autocompleteEnd = new google.maps.places.Autocomplete(endInput, 
  {
    fields: ["place_id", "geometry", "name"],
  });

  // Bias autocomplete to user location if available
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition((pos) => 
	{
      const userLoc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      map.setCenter(userLoc);
      map.setZoom(14);

      // Mark user location
      new google.maps.Marker({
        position: userLoc,
        map,
        title: "Your Location",
      });

      // Bias results around user
      const circle = new google.maps.Circle
	  ({
        center: userLoc,
        radius: pos.coords.accuracy || 2000,
      });
      autocompleteStart.setBounds(circle.getBounds());
      autocompleteEnd.setBounds(circle.getBounds());
    });
  }

  // 4) UI Events
  document.getElementById("btnRoute").addEventListener("click", calculateRoute);

  document.getElementById("trafficToggle").addEventListener("change", (e) => 
  {
    trafficLayer.setMap(e.target.checked ? map : null);
  });
}

function calculateRoute() 
{
  const startVal = document.getElementById("start").value.trim();
  const endVal = document.getElementById("end").value.trim();
  const modeVal = document.getElementById("mode").value;

  if (!startVal || !endVal) 
  {
    alert("Please enter both start and destination.");
    return;
  }

  // Directions request
  directionsService.route(
    {
      origin: startVal,
      destination: endVal,
      travelMode: google.maps.TravelMode[modeVal],
      provideRouteAlternatives: true, // allow multiple routes
      drivingOptions: 
	  {
        departureTime: new Date(), // current time for traffic
      },
    },
    (response, status) => {
      if (status === "OK" && response.routes.length > 0) 
		{
        directionsRenderer.setDirections(response);

        // Count alternatives
        const altCount = response.routes.length - 1;

        // Best route (first one)
        const route = response.routes[0];
        const leg = route.legs[0];
        const distanceText = leg.distance ? leg.distance.text : "—";
        const durationText = leg.duration ? leg.duration.text : "—";

        // Distance Matrix for ETA in traffic
        getETAWithTraffic(startVal, endVal, modeVal, (etaText) => {
          document.getElementById("metrics").classList.remove("hidden");
          document.getElementById("distance").textContent = distanceText;
          document.getElementById("eta").textContent = etaText || durationText;
          document.getElementById("alts").textContent = altCount;

          // Show directions step-by-step
          renderDirectionsText(response);
        });
      } else 
	  {
        alert("Could not display directions: " + status);
      }
    }
  );
}

function getETAWithTraffic(origin, destination, mode, callback) 
 {
  const gmMode = google.maps.TravelMode[mode];
  const opts = {
    origins: [origin],
    destinations: [destination],
    travelMode: gmMode,
  };

  if (gmMode === google.maps.TravelMode.DRIVING) 
  {
    opts.drivingOptions = { departureTime: new Date() }; // now
  }

  distanceMatrixService.getDistanceMatrix(opts, (res, status) => 
   {
    if (status !== "OK" || !res.rows?.[0]?.elements?.[0]) {
      callback(null);
      return;
    }

    const el = res.rows[0].elements[0];
    const etaText = el.duration_in_traffic
      ? el.duration_in_traffic.text
      : el.duration?.text || null;

    callback(etaText);
  });
}

function renderDirectionsText(directionResponse) 
{
  const panel = document.getElementById("directionsPanel");
  panel.innerHTML = ""; // clear panel

  const route = directionResponse.routes[0];
  if (!route || !route.legs || !route.legs[0]) return;

  const leg = route.legs[0];

  // Header
  const header = document.createElement("div");
  header.style.marginBottom = "8px";
  header.innerHTML = `<strong>Directions</strong><br>${leg.start_address} → ${leg.end_address}`;
  panel.appendChild(header);

  // Steps list
  const list = document.createElement("ol");
  for (const step of leg.steps) {
    const li = document.createElement("li");
    li.innerHTML = `${step.instructions} <small>(${step.distance?.text || ""}, ${step.duration?.text || ""})</small>`;
    list.appendChild(li);
  }
  panel.appendChild(list);
}

// ✅ Expose initMap globally for Google Maps API callback
window.initMap = initMap;
