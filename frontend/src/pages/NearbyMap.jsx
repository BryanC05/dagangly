import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Store, Search, Navigation, X, Clock, Route } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '../utils/api';
import { useTranslation } from '../hooks/useTranslation';
import { Button } from '@/components/ui/button';
import { DEFAULT_LOCATION, DEFAULT_RADIUS_METERS, GEOLOCATION_TIMEOUT, GEOLOCATION_MAX_AGE, NAVIGATION_UPDATE_INTERVAL } from '../utils/constants';
import { isValidCoordinates, haversineDistanceKm } from '../utils/helpers';
import './NearbyMap.css';

// Leaflet
import { MapContainer, TileLayer, Marker, Popup, Circle, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import '@/utils/leafletSetup';

const userIcon = L.divIcon({
  className: 'user-location-marker',
  html: '<div style="width:20px;height:20px;background:#6366f1;border:3px solid #fff;border-radius:50%;box-shadow:0 0 8px rgba(99,102,241,0.6);"></div>',
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

const sellerIcon = L.divIcon({
  className: 'seller-marker',
  html: '<div style="width:16px;height:16px;background:#4169E1;border:2px solid #fff;border-radius:50%;box-shadow:0 0 6px rgba(65,105,225,0.5);"></div>',
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

const navigationIcon = L.divIcon({
  className: 'navigation-marker',
  html: '<div style="width:14px;height:14px;background:#22c55e;border:2px solid #fff;border-radius:50%;box-shadow:0 0 6px rgba(34,197,94,0.6);"></div>',
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

const DEFAULT_BEKASI_LOCATION = DEFAULT_LOCATION.Bekasi;

// Component to recenter the map
function RecenterMap({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView([center.lat, center.lng], map.getZoom());
    }
  }, [center, map]);
  return null;
}

// Component to fit bounds to markers
function FitBoundsOnce({ userLocation, sellers, hasFitted }) {
  const map = useMap();
  useEffect(() => {
    if (hasFitted.current || !userLocation || sellers.length === 0) return;
    const bounds = L.latLngBounds([[userLocation.lat, userLocation.lng]]);
    sellers.forEach((seller) => {
      if (isValidCoordinates(seller?.location?.coordinates)) {
        const [lng, lat] = seller.location.coordinates;
        bounds.extend([lat, lng]);
      }
    });
    map.fitBounds(bounds, { padding: [50, 50] });
    hasFitted.current = true;
  }, [userLocation, sellers, hasFitted, map]);
  return null;
}

function NearbyMap() {
  const [userLocation, setUserLocation] = useState(null);
  const [profileLocation, setProfileLocation] = useState(null);
  const [radius, setRadius] = useState(DEFAULT_RADIUS_METERS);
  const [searchQuery, setSearchQuery] = useState('');
  const [isUsingDefaultLocation, setIsUsingDefaultLocation] = useState(false);
  const [isUsingProfileLocation, setIsUsingProfileLocation] = useState(false);
  const [geolocationError, setGeolocationError] = useState(null);
  const [selectedSeller, setSelectedSeller] = useState(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const [navigationRoute, setNavigationRoute] = useState(null);
  const [currentPosition, setCurrentPosition] = useState(null);
  const [recenterTarget, setRecenterTarget] = useState(null);

  const watchIdRef = useRef(null);
  const hasAutoProfileFallbackRef = useRef(false);
  const hasFittedMarkersRef = useRef(false);
  const locationSourceRef = useRef('gps');
  const navigate = useNavigate();
  const { t } = useTranslation();

  const applyCurrentLocation = (location, source = 'gps') => {
    if (!location) return;
    locationSourceRef.current = source;
    setUserLocation(location);
    setIsUsingDefaultLocation(source === 'default');
    setIsUsingProfileLocation(source === 'profile');
  };

  // Get user location
  useEffect(() => {
    let isActive = true;

    const applyFallbackLocation = () => {
      if (!isActive) return;
      applyCurrentLocation(DEFAULT_BEKASI_LOCATION, 'default');
    };

    const loadProfileLocation = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setProfileLocation(null);
          return null;
        }
        const profileResponse = await api.get('/users/profile');
        const coordinates = profileResponse?.data?.location?.coordinates;
        if (isValidCoordinates(coordinates) && isActive) {
          const normalizedProfileLocation = { lat: coordinates[1], lng: coordinates[0] };
          setProfileLocation(normalizedProfileLocation);
          return normalizedProfileLocation;
        }
        setProfileLocation(null);
        return null;
      } catch (err) {
        console.warn('Could not load profile location:', err);
        setProfileLocation(null);
        return null;
      }
    };

    const resolveLocation = async () => {
      const savedProfileLocation = await loadProfileLocation();

      if (navigator.geolocation) {
        const gotGpsLocation = await new Promise((resolve) => {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              if (!isActive) { resolve(false); return; }
              applyCurrentLocation({
                lat: position.coords.latitude,
                lng: position.coords.longitude,
              }, 'gps');
              resolve(true);
            },
            (error) => {
              console.warn('Geolocation error:', error);
              let errorMessage = 'Unable to access GPS. Please allow location permission in your browser.';
              if (error.code === 1) errorMessage = 'Location permission denied. Please allow location access in your browser settings.';
              else if (error.code === 2) errorMessage = 'Unable to determine location. Please check your GPS is enabled.';
              else if (error.code === 3) errorMessage = 'Location request timed out. Please try again.';
              setGeolocationError(errorMessage);
              resolve(false);
            },
            { timeout: GEOLOCATION_TIMEOUT, enableHighAccuracy: true, maximumAge: GEOLOCATION_MAX_AGE }
          );
        });
        if (gotGpsLocation) return;
      }

      if (savedProfileLocation && isActive) {
        applyCurrentLocation(savedProfileLocation, 'profile');
        return;
      }
      applyFallbackLocation();
    };

    resolveLocation();
    return () => { isActive = false; };
  }, []);

  // Cleanup navigation on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, []);

  const stopNavigation = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsNavigating(false);
    setNavigationRoute(null);
    setSelectedSeller(null);
    setCurrentPosition(null);
  }, []);

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) return;
    hasAutoProfileFallbackRef.current = true;
    const tryGetLocation = (highAccuracy = true) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const latestLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setGeolocationError(null);
          applyCurrentLocation(latestLocation, 'gps');
          setRecenterTarget(latestLocation);
        },
        (error) => {
          console.warn('Geolocation attempt (highAccuracy=' + highAccuracy + '):', error);
          if (highAccuracy) { tryGetLocation(false); return; }
          let errorMessage = 'Unable to access GPS. Please allow location permission in your browser.';
          if (error.code === 1) errorMessage = 'Location permission denied.';
          else if (error.code === 2) errorMessage = 'Unable to determine location.';
          else if (error.code === 3) errorMessage = 'Location request timed out.';
          setGeolocationError(errorMessage);
        },
        { timeout: highAccuracy ? GEOLOCATION_TIMEOUT : GEOLOCATION_TIMEOUT * 2, enableHighAccuracy: highAccuracy, maximumAge: GEOLOCATION_MAX_AGE }
      );
    };
    tryGetLocation(true);
  };

  const handleUseProfileLocation = () => {
    if (!profileLocation) return;
    hasAutoProfileFallbackRef.current = true;
    applyCurrentLocation(profileLocation, 'profile');
    setRecenterTarget(profileLocation);
  };

  // Fetch nearby sellers
  const {
    data: sellers = [],
    isLoading: sellersLoading,
    isError: sellersError,
    error: sellersQueryError,
  } = useQuery({
    queryKey: ['nearbySellers', userLocation, radius],
    queryFn: async () => {
      if (!userLocation) return [];
      try {
        const response = await api.get(
          `/users/nearby-sellers?lat=${userLocation.lat}&lng=${userLocation.lng}&radius=${radius}`
        );
        const payload = response?.data;
        const sellersData = Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.sellers)
            ? payload.sellers
            : [];
        const validSellers = sellersData.filter((seller) => {
          const sellerId = seller?._id || seller?.id;
          return sellerId && isValidCoordinates(seller?.location?.coordinates);
        });
        return validSellers;
      } catch (err) {
        console.error('Error fetching nearby sellers:', err);
        throw err;
      }
    },
    enabled: !!userLocation,
    staleTime: 30000,
    retry: 1,
  });

  // Auto-switch to profile location if GPS returns no sellers
  useEffect(() => {
    if (!userLocation || !profileLocation || sellersLoading || sellersError) return;
    if (hasAutoProfileFallbackRef.current) return;
    if (isUsingProfileLocation || isUsingDefaultLocation) return;
    if (sellers.length > 0) return;
    const distanceKm = haversineDistanceKm(userLocation, profileLocation);
    if (distanceKm >= 2) {
      hasAutoProfileFallbackRef.current = true;
      applyCurrentLocation(profileLocation, 'profile');
    }
  }, [sellers, sellersLoading, sellersError, userLocation, profileLocation, isUsingProfileLocation, isUsingDefaultLocation]);

  const getSellerDisplayName = (seller) => {
    const businessName = typeof seller?.businessName === 'string' ? seller.businessName.trim() : '';
    const username = typeof seller?.name === 'string' ? seller.name.trim() : '';
    return businessName || username || 'Seller';
  };

  const getSellerSubtitle = (seller) => {
    const businessType = typeof seller?.businessType === 'string' ? seller.businessType.trim() : '';
    if (businessType && businessType !== 'none') return `${businessType} Enterprise`;
    return 'Local Seller';
  };

  const normalizedSearch = searchQuery.trim().toLowerCase();
  const filteredSellers = useMemo(() => {
    return sellers.filter((seller) => {
      if (!normalizedSearch) return true;
      const displayName = getSellerDisplayName(seller).toLowerCase();
      const city = (seller.location?.city || '').toLowerCase();
      return displayName.includes(normalizedSearch) || city.includes(normalizedSearch);
    });
  }, [sellers, normalizedSearch]);

  // Handle navigation when seller is selected
  useEffect(() => {
    if (!selectedSeller || !userLocation) return;

    const fetchRoute = async () => {
      try {
        const [sellerLng, sellerLat] = selectedSeller.location.coordinates;
        const response = await api.get('/navigation/route', {
          params: {
            originLat: userLocation.lat,
            originLng: userLocation.lng,
            destinationLat: sellerLat,
            destinationLng: sellerLng,
            profile: 'driving',
          },
        });

        const routeData = response.data;
        setNavigationRoute(routeData);
        setIsNavigating(true);

        // Start real-time location tracking
        if (watchIdRef.current === null && navigator.geolocation) {
          watchIdRef.current = navigator.geolocation.watchPosition(
            (position) => {
              const newPos = {
                lat: position.coords.latitude,
                lng: position.coords.longitude,
              };
              setCurrentPosition(newPos);
              setUserLocation(newPos);
            },
            (error) => {
              console.warn('Location watch error:', error);
            },
            { enableHighAccuracy: true, maximumAge: NAVIGATION_UPDATE_INTERVAL, timeout: NAVIGATION_UPDATE_INTERVAL }
          );
        }
      } catch (err) {
        console.error('Error fetching route:', err);
      }
    };

    fetchRoute();

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [selectedSeller]); // eslint-disable-line react-hooks/exhaustive-deps

  // Build route path for Leaflet Polyline
  const routePath = useMemo(() => {
    if (!navigationRoute?.path) return [];
    return navigationRoute.path.map((p) => [p.lat, p.lng]);
  }, [navigationRoute]);

  if (!userLocation) {
    return (
      <div className="nearby-map-page loading-container">
        <div className="loading">{t('nearby.gettingLocation')}</div>
      </div>
    );
  }

  return (
    <div className="nearby-map-page h-[calc(100vh-theme(spacing.16))] flex flex-col md:flex-row">
      {/* Sidebar */}
      <div className="map-sidebar md:w-1/3 lg:w-1/4 p-4 border-r overflow-y-auto">
        <div className="sidebar-header mb-4">
          <h2 className="text-xl font-bold">{t('nearby.findNearbySellers')}</h2>
          <p className="text-sm text-muted-foreground">{t('nearby.discoverMSMEs')}</p>
          {isUsingDefaultLocation && (
            <p className="mt-2 text-xs bg-yellow-100 text-yellow-800 p-2 rounded">
              📍 {t('nearby.defaultLocation')}
            </p>
          )}
          {isUsingProfileLocation && (
            <p className="mt-2 text-xs bg-blue-100 text-blue-800 p-2 rounded">
              📍 Using your saved profile location
            </p>
          )}
          <p className="mt-2 text-xs text-muted-foreground">
            Lat: {userLocation.lat.toFixed(5)}, Lng: {userLocation.lng.toFixed(5)}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleUseCurrentLocation}
              className="px-2 py-1 text-xs rounded border border-border hover:bg-muted"
            >
              Use GPS
            </button>
            {profileLocation && (
              <button
                type="button"
                onClick={handleUseProfileLocation}
                className="px-2 py-1 text-xs rounded border border-border hover:bg-muted"
              >
                Use Profile
              </button>
            )}
          </div>
          {geolocationError && (
            <p className="mt-2 text-xs bg-amber-100 text-amber-800 p-2 rounded">
              {geolocationError}
            </p>
          )}
        </div>

        <div className="search-box mb-4 relative">
          <Search size={16} className="absolute left-3 top-3 text-muted-foreground" />
          <input
            type="text"
            placeholder={t('nearby.searchSellers')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 p-2 border rounded-md"
          />
        </div>

        <div className="radius-control mb-6">
          <label className="block text-sm font-medium mb-2">{t('nearby.searchRadius')}: {(radius / 1000).toFixed(0)} km</label>
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
          <h3 className="font-semibold mb-3">{t('nearby.nearbySellers')} ({filteredSellers.length})</h3>
          {sellersLoading ? (
            <p className="text-sm text-muted-foreground">{t('nearby.loadingSellers')}</p>
          ) : sellersError ? (
            <p className="text-sm text-destructive">
              {t('nearby.errorLoadingMap')}: {sellersQueryError?.message || 'Failed to load sellers'}
            </p>
          ) : filteredSellers.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('nearby.noSellers')}</p>
          ) : (
            <div className="space-y-3">
              {filteredSellers.map((seller) => {
                const sellerId = seller?._id || seller?.id;
                if (!sellerId) return null;
                const displayName = getSellerDisplayName(seller);
                const subtitle = getSellerSubtitle(seller);
                return (
                  <div
                    key={sellerId}
                    className="p-3 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start gap-3" onClick={() => navigate(`/store/${sellerId}`)}>
                      <div className="bg-primary/10 p-2 rounded-full">
                        <Store size={16} className="text-primary" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{displayName}</h4>
                        <p className="text-xs text-muted-foreground">{subtitle}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                          <MapPin size={10} />
                          {seller.location?.city}
                        </p>
                        {seller.rating > 0 && (
                          <p className="text-xs text-yellow-500 mt-1">⭐ {seller.rating.toFixed(1)}</p>
                        )}
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedSeller(seller);
                        }}
                        className="p-2 bg-green-500 hover:bg-green-600 text-white rounded-lg flex items-center gap-1 text-xs font-medium"
                        title="Navigate to store"
                      >
                        <Navigation size={14} />
                        Go
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Map */}
      <div className="map-container flex-1 bg-muted relative">
        <MapContainer
          center={[userLocation.lat, userLocation.lng]}
          zoom={13}
          className="h-full w-full"
          style={{ height: '100%', width: '100%' }}
          zoomControl={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Recenter when user clicks GPS / Profile buttons */}
          {recenterTarget && <RecenterMap center={recenterTarget} />}

          {/* Fit bounds to show all sellers */}
          <FitBoundsOnce
            userLocation={userLocation}
            sellers={filteredSellers}
            hasFitted={hasFittedMarkersRef}
          />

          {/* User location marker */}
          <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon}>
            <Popup>{t('nearby.youAreHere') || 'You are here'}</Popup>
          </Marker>

          {/* Radius circle */}
          <Circle
            center={[userLocation.lat, userLocation.lng]}
            radius={radius}
            pathOptions={{
              fillColor: '#667eea',
              fillOpacity: 0.1,
              color: '#667eea',
              opacity: 0.85,
              weight: 2,
            }}
          />

          {/* Seller markers */}
          {filteredSellers.map((seller) => {
            const sellerId = seller?._id || seller?.id;
            if (!sellerId || !isValidCoordinates(seller?.location?.coordinates)) return null;
            const [lng, lat] = seller.location.coordinates;
            const displayName = getSellerDisplayName(seller);
            const subtitle = getSellerSubtitle(seller);
            return (
              <Marker key={sellerId} position={[lat, lng]} icon={sellerIcon}>
                <Popup>
                  <div style={{ minWidth: '180px' }}>
                    <h4 style={{ margin: '0 0 4px 0', fontWeight: '600' }}>{displayName}</h4>
                    <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#666' }}>{subtitle}</p>
                    <p style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#999' }}>{seller.location.city || ''}</p>
                    {seller.rating > 0 && (
                      <p style={{ margin: '0 0 8px 0', color: '#f59e0b' }}>⭐ {seller.rating.toFixed(1)}</p>
                    )}
                    <button
                      onClick={() => setSelectedSeller(seller)}
                      style={{
                        width: '100%', padding: '8px 12px', background: '#22c55e',
                        color: 'white', border: 'none', borderRadius: '6px',
                        cursor: 'pointer', fontWeight: '500', marginBottom: '6px',
                      }}
                    >
                      🚗 Navigate
                    </button>
                    <button
                      onClick={() => navigate(`/store/${sellerId}`)}
                      style={{
                        width: '100%', padding: '8px 12px', background: '#4169E1',
                        color: 'white', border: 'none', borderRadius: '6px',
                        cursor: 'pointer', fontWeight: '500',
                      }}
                    >
                      View Store
                    </button>
                  </div>
                </Popup>
              </Marker>
            );
          })}

          {/* Navigation route polyline */}
          {routePath.length > 1 && (
            <Polyline
              positions={routePath}
              pathOptions={{
                color: '#22c55e',
                weight: 5,
                opacity: 0.8,
              }}
            />
          )}

          {/* Current navigation position marker */}
          {isNavigating && currentPosition && (
            <Marker position={[currentPosition.lat, currentPosition.lng]} icon={navigationIcon}>
              <Popup>Your current position</Popup>
            </Marker>
          )}
        </MapContainer>

        {/* Navigation overlay */}
        {isNavigating && navigationRoute && (
          <div className="absolute top-4 left-4 right-4 md:left-auto md:right-4 md:w-80 bg-card text-card-foreground border border-border rounded-lg shadow-lg p-4 z-[1000]">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="bg-green-100 dark:bg-green-900/30 p-2 rounded-full">
                  <Navigation className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">Navigating to</h3>
                  <p className="font-medium text-sm">{getSellerDisplayName(selectedSeller)}</p>
                </div>
              </div>
              <button
                onClick={stopNavigation}
                className="p-1 hover:bg-muted rounded-full"
              >
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>

            <div className="flex items-center gap-4 mb-3">
              <div className="flex items-center gap-1">
                <Route className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">
                  {(navigationRoute.distanceMeters / 1000).toFixed(1)} km
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">
                  ~{Math.round(navigationRoute.durationSeconds / 60)} min
                </span>
              </div>
            </div>

            {currentPosition && selectedSeller && (
              <p className="text-xs text-muted-foreground">
                📍 Distance remaining: {haversineDistanceKm(currentPosition, {
                  lat: selectedSeller.location.coordinates[1],
                  lng: selectedSeller.location.coordinates[0]
                }).toFixed(1)} km
              </p>
            )}

            <div className="mt-3 flex gap-2">
              <Button
                onClick={stopNavigation}
                variant="outline"
                className="flex-1"
                size="sm"
              >
                Stop Navigation
              </Button>
              <Button
                onClick={() => navigate(`/store/${selectedSeller?._id || selectedSeller?.id}`)}
                className="flex-1 bg-green-600 hover:bg-green-700"
                size="sm"
              >
                View Store
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default NearbyMap;
