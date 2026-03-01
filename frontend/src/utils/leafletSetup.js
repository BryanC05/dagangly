/**
 * Shared Leaflet setup — fixes the broken default marker icons in Vite/Webpack.
 *
 * Import this file once in any component that uses Leaflet markers:
 *   import '@/utils/leafletSetup';
 */
import L from 'leaflet';

// Import images directly from the leaflet package so Vite resolves the URLs
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// Override the broken auto-detection
delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
    iconUrl: markerIcon,
    iconRetinaUrl: markerIcon2x,
    shadowUrl: markerShadow,
});

// Custom marker icons for use across the app
export const storeMarkerIcon = L.divIcon({
    className: '',
    html: `<div style="
    width:20px;height:20px;
    background:#f59e0b;
    border:3px solid #fff;
    border-radius:50%;
    box-shadow:0 2px 6px rgba(0,0,0,0.35);
  "></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
    popupAnchor: [0, -10],
});

export const deliveryMarkerIcon = L.divIcon({
    className: '',
    html: `<div style="
    width:16px;height:16px;
    background:#3b82f6;
    border:3px solid #fff;
    border-radius:50%;
    box-shadow:0 2px 6px rgba(0,0,0,0.35);
  "></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
    popupAnchor: [0, -8],
});

export const driverMarkerIcon = L.divIcon({
    className: '',
    html: `<div style="
    width:18px;height:18px;
    background:#22c55e;
    border:3px solid #fff;
    border-radius:50%;
    box-shadow:0 2px 8px rgba(34,197,94,0.5);
  "></div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
    popupAnchor: [0, -9],
});

export const sellerMarkerIcon = L.divIcon({
    className: '',
    html: `<div style="
    width:16px;height:16px;
    background:#3b82f6;
    border:3px solid #fff;
    border-radius:50%;
    box-shadow:0 2px 6px rgba(59,130,246,0.5);
  "></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
    popupAnchor: [0, -8],
});
