import { useState, useEffect, useRef, useCallback } from 'react';
import { MapPin, Search, Navigation } from 'lucide-react';
import {
  DEFAULT_LOCATION,
  GEOLOCATION_TIMEOUT,
  GEOLOCATION_MAX_AGE,
  DEFAULT_MAP_ZOOM,
} from '../utils/constants';
import './LocationPicker.css';

// Leaflet
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import '../utils/leafletSetup';

const DEFAULT_START_LOCATION = DEFAULT_LOCATION.Bekasi;
const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org';

/** Simple coordinate validation — rejects Leaflet max-bounds corners */
function isValidCoord(lat, lng) {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    Math.abs(lat) <= 84 &&
    Math.abs(lng) <= 180
  );
}

let lastNominatimCall = 0;

/** Reverse geocode via Nominatim with a 1-second rate-limit guard. */
async function nominatimReverse(lat, lng) {
  if (!isValidCoord(lat, lng)) return null;

  const now = Date.now();
  const wait = Math.max(0, 1100 - (now - lastNominatimCall));
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  lastNominatimCall = Date.now();

  try {
    const res = await fetch(
      `${NOMINATIM_BASE}/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1&accept-language=id,en`,
      { headers: { 'User-Agent': 'UMKM-Marketplace/1.0' } }
    );
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

/** Search locations via Nominatim with a 1-second rate-limit guard. */
async function nominatimSearch(query) {
  const now = Date.now();
  const wait = Math.max(0, 1100 - (now - lastNominatimCall));
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  lastNominatimCall = Date.now();

  try {
    const res = await fetch(
      `${NOMINATIM_BASE}/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1&accept-language=id,en`,
      { headers: { 'User-Agent': 'UMKM-Marketplace/1.0' } }
    );
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

function LocationPicker({ onLocationSelect, initialLocation }) {
  const [position, setPosition] = useState(initialLocation || null);
  const [address, setAddress] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const isInitializingRef = useRef(false);
  const onLocationSelectRef = useRef(onLocationSelect);

  // Keep callback ref fresh without re-triggering effect
  useEffect(() => {
    onLocationSelectRef.current = onLocationSelect;
  }, [onLocationSelect]);

  const reverseGeocode = useCallback(async (lat, lng) => {
    if (!isValidCoord(lat, lng)) return;

    const data = await nominatimReverse(lat, lng);
    if (!data || data.error) return;

    const addr = data.address || {};
    const city =
      addr.city || addr.town || addr.municipality || addr.county || addr.state || '';
    const state = addr.state || '';
    const pincode = addr.postcode || '';
    const fullAddress = data.display_name || '';

    setAddress(fullAddress);
    onLocationSelectRef.current?.({
      lat,
      lng,
      address: fullAddress,
      city,
      state,
      pincode,
      fullAddress,
    });
  }, []);

  const handlePositionChange = useCallback(
    (lat, lng) => {
      if (!isValidCoord(lat, lng)) return;
      setPosition({ lat, lng });
      reverseGeocode(lat, lng);
    },
    [reverseGeocode]
  );

  // Initialize Leaflet map — guarded against React StrictMode double-mount
  useEffect(() => {
    const containerEl = mapContainerRef.current;
    if (!containerEl || mapRef.current || isInitializingRef.current) return;

    let cancelled = false;
    isInitializingRef.current = true;

    const initMap = async () => {
      let startPos = initialLocation
        ? { lat: initialLocation.lat, lng: initialLocation.lng }
        : null;

      // Try GPS
      if (!startPos && navigator.geolocation) {
        try {
          const pos = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: true,
              timeout: GEOLOCATION_TIMEOUT,
              maximumAge: GEOLOCATION_MAX_AGE,
            });
          });
          startPos = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        } catch (err) {
          console.log('Could not get current location, using default:', err.message);
        }
      }

      if (!startPos) {
        startPos = { lat: DEFAULT_START_LOCATION.lat, lng: DEFAULT_START_LOCATION.lng };
      }

      if (cancelled) { isInitializingRef.current = false; return; }

      // Validate before creating anything
      if (!isValidCoord(startPos.lat, startPos.lng)) {
        startPos = { lat: DEFAULT_START_LOCATION.lat, lng: DEFAULT_START_LOCATION.lng };
      }

      const map = L.map(containerEl, {
        center: [startPos.lat, startPos.lng],
        zoom: DEFAULT_MAP_ZOOM || 13,
        zoomControl: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);

      const marker = L.marker([startPos.lat, startPos.lng], { draggable: true }).addTo(map);

      marker.on('dragend', () => {
        const ll = marker.getLatLng();
        handlePositionChange(ll.lat, ll.lng);
      });

      map.on('click', (e) => {
        marker.setLatLng(e.latlng);
        handlePositionChange(e.latlng.lat, e.latlng.lng);
      });

      if (cancelled) {
        map.remove();
        isInitializingRef.current = false;
        return;
      }

      mapRef.current = map;
      markerRef.current = marker;

      // Ensure map tiles render correctly after the container is laid out
      setTimeout(() => {
        if (mapRef.current) mapRef.current.invalidateSize();
      }, 400);

      handlePositionChange(startPos.lat, startPos.lng);
      isInitializingRef.current = false;
    };

    initMap();

    return () => {
      cancelled = true;
      isInitializingRef.current = false;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      markerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync marker position if `position` changes from outside
  useEffect(() => {
    if (!mapRef.current || !markerRef.current || !position) return;
    if (!isValidCoord(position.lat, position.lng)) return;

    const cur = markerRef.current.getLatLng();
    if (
      Math.abs(cur.lat - position.lat) > 0.0001 ||
      Math.abs(cur.lng - position.lng) > 0.0001
    ) {
      markerRef.current.setLatLng([position.lat, position.lng]);
      mapRef.current.setView([position.lat, position.lng], 15);
    }
  }, [position]);

  const handleSearch = async (event) => {
    event.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const results = await nominatimSearch(searchQuery.trim());
      setSearchResults(results);
    } catch (error) {
      console.error('Error searching location:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const selectSearchResult = (result) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    if (!isValidCoord(lat, lng)) return;

    if (mapRef.current && markerRef.current) {
      mapRef.current.setView([lat, lng], 15);
      markerRef.current.setLatLng([lat, lng]);
    }
    handlePositionChange(lat, lng);
    setSearchResults([]);
    setSearchQuery('');
  };

  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    setIsSearching(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const nextPos = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        if (mapRef.current && markerRef.current) {
          mapRef.current.setView([nextPos.lat, nextPos.lng], 15);
          markerRef.current.setLatLng([nextPos.lat, nextPos.lng]);
        }
        handlePositionChange(nextPos.lat, nextPos.lng);
        setIsSearching(false);
      },
      (err) => {
        console.warn('Geolocation warning (using existing/default map location):', err);
        setIsSearching(false);

        let errorMessage = 'Could not access your location.';
        if (err.code === 1) errorMessage = 'Location permission denied. Please enable it in browser settings.';
        else if (err.code === 2) errorMessage = 'Location unavailable. Please ensure GPS is enabled.';
        else if (err.code === 3) errorMessage = 'Location request timed out. Please try again.';

        const hasExisting = !!position && isValidCoord(position.lat, position.lng);
        if (!hasExisting) alert(errorMessage);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  return (
    <div className="location-picker">
      <div className="picker-header">
        <div className="search-form">
          <div className="search-input-wrapper">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              placeholder="Search for an area, street, or landmark..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSearch(e);
                }
              }}
            />
            {searchResults.length > 0 && (
              <button type="button" className="clear-search" onClick={() => setSearchResults([])}>
                x
              </button>
            )}
          </div>
          <button type="button" className="btn-search" disabled={isSearching} onClick={handleSearch}>
            {isSearching ? 'Searching...' : 'Search'}
          </button>
        </div>
        <button type="button" className="btn-locate" onClick={handleLocateMe} title="Use my current location">
          <Navigation size={18} />
        </button>
      </div>

      {searchResults.length > 0 && (
        <ul className="search-results">
          {searchResults.map((result) => (
            <li key={result.place_id || result.display_name} onClick={() => selectSearchResult(result)}>
              <MapPin size={16} />
              <span>{result.display_name}</span>
            </li>
          ))}
        </ul>
      )}

      <div className="map-wrapper">
        <div ref={mapContainerRef} className="picker-map" />
        {address && (
          <div className="selected-address">
            <span className="label">Selected Location:</span>
            <span className="value">{address}</span>
          </div>
        )}
      </div>

      <div className="picker-instructions">
        <small>Drag the marker or click on the map to pinpoint exact location.</small>
      </div>
    </div>
  );
}

export default LocationPicker;
