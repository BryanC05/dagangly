import { OFFLINE_TESTING_MODE } from "../config";

const OSRM_PUBLIC_API = "https://router.project-osrm.org";

export async function getRouteCoordinates(originLat, originLng, destLat, destLng, profile = "driving") {
  if (OFFLINE_TESTING_MODE) {
    return getMockRouteCoordinates(originLat, originLng, destLat, destLng);
  }

  try {
    const url = `${OSRM_PUBLIC_API}/route/v1/${profile}/${originLng},${originLat};${destLng},${destLat}?overview=full&geometries=geojson&steps=false`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "Accept": "application/json",
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`OSRM API error: ${response.status}`);
    }

    const data = await response.json();

    if (data.code !== "Ok" || !data.routes || data.routes.length === 0) {
      throw new Error("No route found");
    }

    const route = data.routes[0];
    const coordinates = route.geometry.coordinates.map(coord => ({
      longitude: coord[0],
      latitude: coord[1],
    }));

    return {
      coordinates,
      distanceMeters: route.distance,
      durationSeconds: route.duration,
    };
  } catch (error) {
    console.warn("OSRM routing failed:", error.message);
    return null;
  }
}

function getMockRouteCoordinates(originLat, originLng, destLat, destLng) {
  const numPoints = 10;
  const routeCoords = [];

  for (let i = 0; i <= numPoints; i++) {
    const t = i / numPoints;
    const lat = originLat + (destLat - originLat) * t;
    const lng = originLng + (destLng - originLng) * t;
    routeCoords.push({ latitude: lat, longitude: lng });
  }

  const totalDistance = haversineDistance(originLat, originLng, destLat, destLng);

  return {
    coordinates: routeCoords,
    distanceMeters: totalDistance * 1000,
    durationSeconds: Math.round(totalDistance * 120),
  };
}

function haversineDistance(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export async function getRoutePolyline(userLat, userLng, destLat, destLng, profile = "driving") {
  const result = await getRouteCoordinates(userLat, userLng, destLat, destLng, profile);

  if (result && result.coordinates.length > 0) {
    return result.coordinates;
  }

  const fallback = [];
  const steps = 15;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const jitter = (Math.random() - 0.5) * 0.002;
    fallback.push({
      latitude: userLat + (destLat - userLat) * t + (i > 0 && i < steps ? jitter : 0),
      longitude: userLng + (destLng - userLng) * t + (i > 0 && i < steps ? jitter : 0),
    });
  }
  return fallback;
}