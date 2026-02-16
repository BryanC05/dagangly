import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Store, Search } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '../utils/api';
import Layout from '@/components/layout/Layout';
import './NearbyMap.css';

// Module-level flag to track if map was initialized
let mapInitialized = false;
let initAttempt = 0;

function NearbyMap() {
  const [userLocation, setUserLocation] = useState(null);
  const [radius, setRadius] = useState(25000); // 25km default for better coverage
  const [searchQuery, setSearchQuery] = useState('');
  const [isUsingDefaultLocation, setIsUsingDefaultLocation] = useState(false);
  const [mapError, setMapError] = useState(null);
  const [mapReady, setMapReady] = useState(false);
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markersLayerRef = useRef(null);
  const radiusCircleRef = useRef(null);
  const navigate = useNavigate();

  // Get user location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          setIsUsingDefaultLocation(false);
        },
        () => {
          // Default to Delhi, India (matching simulation data)
          setUserLocation({ lat: 28.6139, lng: 77.2090 });
          setIsUsingDefaultLocation(true);
        },
        { timeout: 10000, enableHighAccuracy: false }
      );
    } else {
      // Default to Delhi, India (matching simulation data)
      setUserLocation({ lat: 28.6139, lng: 77.2090 });
      setIsUsingDefaultLocation(true);
    }
  }, []);

  // Initialize map
  useEffect(() => {
    if (!userLocation || !mapContainerRef.current || mapInitialized) return;

    let map = null;
    let isActive = true;
    initAttempt++;
    const currentAttempt = initAttempt;

    const initMap = async () => {
      try {
        // Dynamic import
        const L = (await import('leaflet')).default;
        await import('leaflet/dist/leaflet.css');

        // Fix marker icons
        const markerIcon = await import('leaflet/dist/images/marker-icon.png');
        const markerShadow = await import('leaflet/dist/images/marker-shadow.png');

        const DefaultIcon = L.icon({
          iconUrl: markerIcon.default,
          shadowUrl: markerShadow.default,
          iconSize: [25, 41],
          iconAnchor: [12, 41],
        });
        L.Marker.prototype.options.icon = DefaultIcon;

        // Check if container is already initialized
        const container = mapContainerRef.current;
        if (!container || container._leaflet_id || !isActive) {
          return;
        }

        // Create map
        map = L.map(container, {
          center: [userLocation.lat, userLocation.lng],
          zoom: 13,
          scrollWheelZoom: true,
        });

        if (!isActive) {
          map.remove();
          return;
        }

        mapInitialized = true;
        mapRef.current = map;
        setMapReady(true);

        // Add tile layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);

        // Add user location circle (save ref for dynamic updates)
        radiusCircleRef.current = L.circle([userLocation.lat, userLocation.lng], {
          radius: radius,
          fillColor: '#667eea',
          fillOpacity: 0.1,
          color: '#667eea'
        }).addTo(map);

        // Add user marker
        L.marker([userLocation.lat, userLocation.lng])
          .addTo(map)
          .bindPopup('You are here');

      } catch (err) {
        if (isActive && currentAttempt === initAttempt) {
          console.error('Map init error:', err);
          setMapError(err.message);
        }
      }
    };

    // Delay to avoid Strict Mode issues
    const timer = setTimeout(initMap, 100);

    return () => {
      isActive = false;
      clearTimeout(timer);
      if (map) {
        map.remove();
        mapRef.current = null;
        mapInitialized = false;
        setMapReady(false);
      }
    };
  }, [userLocation]); // eslint-disable-line react-hooks/exhaustive-deps

  // Update radius circle when radius changes (without reinitializing map)
  useEffect(() => {
    if (radiusCircleRef.current && mapRef.current) {
      radiusCircleRef.current.setRadius(radius);
    }
  }, [radius]);

  const { data: sellers, isLoading: sellersLoading, error: sellersError } = useQuery({
    queryKey: ['nearbySellers', userLocation, radius],
    queryFn: async () => {
      if (!userLocation) return [];
      try {
        const response = await api.get(
          `/users/nearby-sellers?lat=${userLocation.lat}&lng=${userLocation.lng}&radius=${radius}`
        );
        console.log('Nearby sellers found:', response.data.length);
        return response.data;
      } catch (err) {
        console.error('Error fetching nearby sellers:', err);
        throw err;
      }
    },
    enabled: !!userLocation,
  });

  // Add seller markers when sellers data changes and map is ready
  useEffect(() => {
    if (!mapReady || !mapRef.current || !sellers || sellers.length === 0) return;

    console.log('Adding seller markers:', sellers.length);

    const addMarkers = async () => {
      try {
        const L = (await import('leaflet')).default;

        // Clear existing markers
        if (markersLayerRef.current) {
          markersLayerRef.current.clearLayers();
        } else {
          markersLayerRef.current = L.layerGroup().addTo(mapRef.current);
        }

        // Create custom seller icon
        const sellerIcon = L.divIcon({
          className: 'seller-marker',
          html: '<div style="background: #4169E1; color: white; border-radius: 50%; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; font-size: 14px; box-shadow: 0 2px 6px rgba(0,0,0,0.3);">🏪</div>',
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        });

        // Add seller markers
        sellers.forEach(seller => {
          if (seller.location?.coordinates) {
            const [lng, lat] = seller.location.coordinates;
            const marker = L.marker([lat, lng], { icon: sellerIcon })
              .bindPopup(`
                <div style="min-width: 180px;">
                  <h4 style="margin: 0 0 4px 0;">${seller.businessName || seller.name}</h4>
                  <p style="margin: 0 0 4px 0; font-size: 12px; color: #666;">${seller.businessType} Enterprise</p>
                  <p style="margin: 0 0 8px 0; font-size: 12px; color: #999;">${seller.location.city || ''}</p>
                  ${seller.rating > 0 ? `<p style="margin: 0 0 8px 0; color: #f59e0b;">⭐ ${seller.rating.toFixed(1)}</p>` : ''}
                  <button onclick="window.location.href='/store/${seller._id}'" style="width: 100%; padding: 8px 12px; background: #4169E1; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 500;">View Store</button>
                </div>
              `);
            markersLayerRef.current.addLayer(marker);
          }
        });

        // Fit map to show all markers if we have any
        if (markersLayerRef.current.getLayers().length > 0) {
          const group = new L.featureGroup([
            L.marker([userLocation.lat, userLocation.lng]),
            ...markersLayerRef.current.getLayers()
          ]);
          mapRef.current.fitBounds(group.getBounds().pad(0.1));
        }
      } catch (err) {
        console.error('Error adding seller markers:', err);
      }
    };

    addMarkers();
  }, [sellers, userLocation, mapReady]);

  const filteredSellers = sellers?.filter(seller =>
    seller.businessName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    seller.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );



  if (!userLocation) {
    return (
      <Layout>
        <div className="nearby-map-page loading-container">
          <div className="loading">Getting your location...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="nearby-map-page h-[calc(100vh-theme(spacing.16))] flex flex-col md:flex-row">
        <div className="map-sidebar md:w-1/3 lg:w-1/4 p-4 border-r overflow-y-auto">
          <div className="sidebar-header mb-4">
            <h2 className="text-xl font-bold">Find Nearby Sellers</h2>
            <p className="text-sm text-muted-foreground">Discover MSMEs near your location</p>
            {isUsingDefaultLocation && (
              <p className="mt-2 text-xs bg-yellow-100 text-yellow-800 p-2 rounded">
                📍 Using default location (Delhi, India). Enable location access for better results.
              </p>
            )}
          </div>

          <div className="search-box mb-4 relative">
            <Search size={16} className="absolute left-3 top-3 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search sellers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 p-2 border rounded-md"
            />
          </div>

          <div className="radius-control mb-6">
            <label className="block text-sm font-medium mb-2">Search Radius: {(radius / 1000).toFixed(0)} km</label>
            <input
              type="range"
              min="1000"
              max="100000"
              step="1000"
              value={radius}
              onChange={(e) => setRadius(Number(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>1km</span>
              <span>50km</span>
              <span>100km</span>
            </div>
          </div>

          <div className="sellers-list">
            <h3 className="font-semibold mb-3">Nearby Sellers ({filteredSellers?.length || 0})</h3>
            {sellersLoading ? (
              <p className="text-sm text-muted-foreground">Loading sellers...</p>
            ) : filteredSellers?.length === 0 ? (
              <p className="text-sm text-muted-foreground">No sellers found in this area.</p>
            ) : (
              <div className="space-y-3">
                {filteredSellers?.map((seller) => (
                  <div
                    key={seller._id}
                    className="p-3 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => navigate(`/store/${seller._id}`)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="bg-primary/10 p-2 rounded-full">
                        <Store size={16} className="text-primary" />
                      </div>
                      <div>
                        <h4 className="font-medium text-sm">{seller.businessName || seller.name}</h4>
                        <p className="text-xs text-muted-foreground capitalize">{seller.businessType} Enterprise</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                          <MapPin size={10} />
                          {seller.location?.city}
                        </p>
                        {seller.rating > 0 && (
                          <p className="text-xs text-yellow-500 mt-1">⭐ {seller.rating.toFixed(1)}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="map-container flex-1 bg-muted relative">
          {mapError ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
              <p className="text-destructive mb-2">Error loading map: {mapError}</p>
              <button onClick={() => window.location.reload()} className="px-4 py-2 bg-primary text-primary-foreground rounded-md">Retry</button>
            </div>
          ) : (
            <div ref={mapContainerRef} className="h-full w-full" />
          )}
        </div>
      </div>
    </Layout>
  );
}

export default NearbyMap;
