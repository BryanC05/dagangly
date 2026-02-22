// Placeholder image as data URI - no external requests needed
export const PLACEHOLDER_IMAGE = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400"%3E%3Crect fill="%23f3f4f6" width="400" height="400"/%3E%3Ctext fill="%239ca3af" font-family="sans-serif" font-size="24" font-weight="bold" text-anchor="middle" x="200" y="200"%3ENo Image%3C/text%3E%3C/svg%3E';

// Default location coordinates
export const DEFAULT_LOCATION = {
  Bekasi: { lat: -6.2349, lng: 106.9896 },
  Jakarta: { lat: -6.2088, lng: 106.8456 },
};

export const DEFAULT_RADIUS_METERS = 25000;
export const MAX_RADIUS_METERS = 100000;
export const MIN_RADIUS_METERS = 1000;

// Geolocation settings
export const GEOLOCATION_TIMEOUT = 15000;
export const GEOLOCATION_MAX_AGE = 0;

// Map settings
export const DEFAULT_MAP_ZOOM = 13;

// Earth radius in kilometers (for distance calculations)
export const EARTH_RADIUS_KM = 6371;

// API polling intervals (in milliseconds)
export const LOCATION_POLLING_INTERVAL = 10000;
export const DRIVER_LOCATION_INTERVAL = 15000;
export const CHAT_REFETCH_INTERVAL = 30000;
export const TYPING_TIMEOUT = 3000;

// Navigation settings
export const NAVIGATION_UPDATE_INTERVAL = 10000;
