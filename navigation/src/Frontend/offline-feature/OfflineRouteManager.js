export const saveRouteOffline = (route) => {

  try {

    const offlineData = {
      geometry: route.geometry,
      destination: route.destination,
      createdAt: route.createdAt,
    };

    localStorage.setItem("offline_route", JSON.stringify(offlineData));

  } catch (e) {
    console.error("Route save failed", e);
  }

};

export const getOfflineRoute = () => {

  try {
    const data = localStorage.getItem("offline_route");
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }

};