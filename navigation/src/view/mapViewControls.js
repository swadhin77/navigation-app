// src/view/mapViewControls.js

export const addTerrain = (map) => {

  if (!map) return;

  if (!map.getSource("mapbox-dem")) {
    map.addSource("mapbox-dem", {
      type: "raster-dem",
      url: "mapbox://mapbox.terrain-rgb",
      tileSize: 512,
      maxzoom: 14
    });
  }

  map.setTerrain({
    source: "mapbox-dem",
    exaggeration: 1.5
  });

};


export const addSkyLayer = (map) => {

  if (!map) return;

  if (!map.getLayer("sky")) {
    map.addLayer({
      id: "sky",
      type: "sky",
      paint: {
        "sky-type": "atmosphere",
        "sky-atmosphere-sun": [0.0, 0.0],
        "sky-atmosphere-sun-intensity": 15
      }
    });
  }

};


export const add3DBuildings = (map) => {

  if (!map) return;

  if (map.getLayer("3d-buildings")) return;

  const layers = map.getStyle()?.layers;

  const labelLayerId = layers.find(
    layer => layer.type === "symbol" && layer.layout["text-field"]
  )?.id;

  map.addLayer(
    {
      id: "3d-buildings",
      source: "composite",
      "source-layer": "building",
      filter: ["==", ["get", "extrude"], "true"],
      type: "fill-extrusion",
      minzoom: 15,
      paint: {
        "fill-extrusion-color": "#556677",
        "fill-extrusion-height": ["get", "height"],
        "fill-extrusion-base": ["get", "min_height"],
        "fill-extrusion-opacity": 0.9
      }
    },
    labelLayerId
  );

};


export const remove3DBuildings = (map) => {

  if (!map) return;

  if (map.getLayer("3d-buildings")) {
    map.removeLayer("3d-buildings");
  }

};


export const toggle3DView = (map, is3DView, setIs3DView) => {

  if (!map) return;

  const next = !is3DView;

  if (next) {

    map.easeTo({
      pitch: 65,
      zoom: 17,
      duration: 1200
    });

    add3DBuildings(map);

  } else {

    map.easeTo({
      pitch: 0,
      bearing: 0,
      zoom: 16,
      duration: 1200
    });

    remove3DBuildings(map);

  }

  setIs3DView(next);

};


export const toggleSatelliteView = (
  map,
  isSatelliteView,
  setIsSatelliteView,
  theme,
  is3DView
) => {

  if (!map) return;

  const next = !isSatelliteView;

  if (next) {
    map.setStyle("mapbox://styles/mapbox/satellite-streets-v12");
  } else {
    const style =
      theme === "dark"
        ? "mapbox://styles/mapbox/navigation-night-v1"
        : "mapbox://styles/mapbox/streets-v12";

    map.setStyle(style);
  }

  map.once("style.load", () => {

    map.resize();

    // restore terrain
    addTerrain(map);

    // restore sky
    addSkyLayer(map);

    // restore 3D buildings if enabled
    if (is3DView) {
      add3DBuildings(map);

      map.easeTo({
        pitch: 65,
        zoom: 17,
        duration: 800
      });
    }

  });

  setIsSatelliteView(next);
};