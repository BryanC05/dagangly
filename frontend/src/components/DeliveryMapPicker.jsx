import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MapPin, AlertCircle, Navigation, Search } from 'lucide-react';
import { DEFAULT_LOCATION } from '../utils/constants';
import { haversineDistanceKm } from '../utils/helpers';

import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { sellerMarkerIcon } from '@/utils/leafletSetup';

const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org';
let lastNominatimCall = 0;

async function nominatimReverse(lat, lng) {
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

export default function DeliveryMapPicker({
  sellerLocation,
  onLocationSelect,
  maxDistance = 5,
  initialLocation = null,
}) {
  const [position, setPosition] = useState(initialLocation);
  const [distance, setDistance] = useState(null);
  const [address, setAddress] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mapError, setMapError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  // Auto locate user on mount if no initial location is provided
  useEffect(() => {
    if (!initialLocation && navigator.geolocation) {
      setIsLoading(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setPosition(coords);
          setIsLoading(false);
          if (mapRef.current) {
            mapRef.current.setView([coords.lat, coords.lng], 15);
          }
        },
        (error) => {
          console.error('Auto location error:', error);
          setIsLoading(false);
          if (sellerLocation) {
            setPosition({ lat: sellerLocation.lat, lng: sellerLocation.lng });
          }
        }
      );
    }
  }, [initialLocation, sellerLocation]);

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`);
      const data = await res.json();
      if (data && data.length > 0) {
        const { lat, lon, display_name } = data[0];
        const newPos = { lat: parseFloat(lat), lng: parseFloat(lon) };
        setPosition(newPos);
        setAddress(display_name);
        if (mapRef.current) {
          mapRef.current.setView([newPos.lat, newPos.lng], 16);
        }
      } else {
        alert('No locations found for your search query.');
      }
    } catch (err) {
      console.error('Search error:', err);
      alert('Failed to search location. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const selectedMarkerRef = useRef(null);
  const isInitRef = useRef(false);

  const defaultCenter = sellerLocation || DEFAULT_LOCATION.Jakarta;

  // Initialize Leaflet map
  useEffect(() => {
    const el = mapContainerRef.current;
    if (!el || mapRef.current || isInitRef.current) return;
    isInitRef.current = true;

    try {
      const map = L.map(el).setView([defaultCenter.lat, defaultCenter.lng], 13);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);

      // Seller marker + radius circle
      if (sellerLocation) {
        L.marker([sellerLocation.lat, sellerLocation.lng], { icon: sellerMarkerIcon })
          .addTo(map)
          .bindPopup('Store location');

        L.circle([sellerLocation.lat, sellerLocation.lng], {
          radius: maxDistance * 1000,
          fillColor: '#3b82f6',
          fillOpacity: 0.1,
          color: '#3b82f6',
          weight: 2,
        }).addTo(map);
      }

      // Initial location marker
      if (initialLocation) {
        const m = L.marker([initialLocation.lat, initialLocation.lng], { draggable: true }).addTo(map);
        m.on('dragend', () => {
          const ll = m.getLatLng();
          setPosition({ lat: ll.lat, lng: ll.lng });
        });
        selectedMarkerRef.current = m;
        map.setView([initialLocation.lat, initialLocation.lng], 15);
      }

      map.on('click', (e) => {
        setPosition({ lat: e.latlng.lat, lng: e.latlng.lng });
      });

      mapRef.current = map;
      setTimeout(() => map.invalidateSize(), 300);
    } catch (err) {
      console.error('Failed to initialize delivery map:', err);
      setMapError(err.message || 'Failed to load map');
    }

    return () => {
      isInitRef.current = false;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      selectedMarkerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update marker when position changes
  useEffect(() => {
    if (!position || !mapRef.current) return;

    if (!selectedMarkerRef.current) {
      const m = L.marker([position.lat, position.lng], { draggable: true }).addTo(mapRef.current);
      m.on('dragend', () => {
        const ll = m.getLatLng();
        setPosition({ lat: ll.lat, lng: ll.lng });
      });
      selectedMarkerRef.current = m;
    } else {
      selectedMarkerRef.current.setLatLng([position.lat, position.lng]);
    }
    mapRef.current.setView([position.lat, position.lng]);

    if (sellerLocation) {
      const dist = haversineDistanceKm(sellerLocation, position);
      setDistance(dist);

      // Reverse geocode
      nominatimReverse(position.lat, position.lng).then((data) => {
        if (data && !data.error) {
          setAddress(data.display_name || '');
        }
      });
    }
  }, [position, sellerLocation]);

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) return;
    setIsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setIsLoading(false);
      },
      (error) => {
        console.error('Geolocation error:', error?.message || error);
        setIsLoading(false);
        alert('Could not get your location. Please allow location access or select manually.');
      }
    );
  };

  const handleConfirm = () => {
    if (position && distance !== null && distance <= maxDistance) {
      onLocationSelect({ lat: position.lat, lng: position.lng, address });
    }
  };

  const isValid = position && distance !== null && distance <= maxDistance;

  return (
    <div className="space-y-4">
      {/* Search Input Bar */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Input
            type="text"
            placeholder="Search address, street, or city..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-10 h-10 text-sm"
          />
          <button
            type="submit"
            disabled={isSearching}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <Search className="h-4 w-4" />
          </button>
        </div>
        <Button type="submit" disabled={isSearching} size="sm" className="h-10 px-4">
          {isSearching ? 'Searching...' : 'Search'}
        </Button>
      </form>

      <div className="h-[280px] w-full rounded-lg overflow-hidden border">
        {mapError ? (
          <div className="h-full w-full flex items-center justify-center p-4 text-sm text-destructive">
            {mapError}
          </div>
        ) : (
          <div ref={mapContainerRef} className="h-full w-full" />
        )}
      </div>

      <div className="flex gap-2">
        <Button
          variant="outline"
          onClick={handleGetCurrentLocation}
          disabled={isLoading}
          className="flex-1 h-10"
        >
          <Navigation className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          {isLoading ? 'Refreshing GPS...' : 'Refresh GPS Location'}
        </Button>
      </div>

      {distance !== null && (
        <Alert variant={isValid ? 'default' : 'destructive'} className="py-2.5">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-xs">
            Distance from store: <strong>{distance.toFixed(2)} km</strong>
            {distance > maxDistance && (
              <span className="block mt-1 text-red-600 font-semibold">
                Location is outside {maxDistance}km delivery range
              </span>
            )}
            {isValid && <span className="block mt-1 text-green-600 font-semibold">Within delivery range</span>}
          </AlertDescription>
        </Alert>
      )}

      {address && (
        <div className="p-3 bg-secondary/30 border rounded-lg text-xs">
          <p className="font-semibold text-foreground">Selected Location:</p>
          <p className="text-muted-foreground mt-0.5">{address}</p>
        </div>
      )}

      <Button onClick={handleConfirm} disabled={!isValid} className="w-full h-10 font-semibold">
        <MapPin className="h-4 w-4 mr-2" />
        Confirm Delivery Location
      </Button>
    </div>
  );
}
