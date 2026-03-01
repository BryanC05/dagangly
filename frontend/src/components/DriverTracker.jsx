import { useEffect, useState, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Navigation, Phone, User, RefreshCw } from 'lucide-react';
import api from '@/utils/api';
import { DEFAULT_LOCATION } from '@/utils/constants';

import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { driverMarkerIcon, deliveryMarkerIcon as destIcon } from '@/utils/leafletSetup';

export default function DriverTracker({ orderId, deliveryAddress, driverInfo }) {
    const [driverLocation, setDriverLocation] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [lastUpdated, setLastUpdated] = useState(null);
    const [mapError, setMapError] = useState(null);

    const mapContainerRef = useRef(null);
    const mapRef = useRef(null);
    const driverMarkerRef = useRef(null);
    const routePolylineRef = useRef(null);
    const isInitRef = useRef(false);

    const defaultCenter = DEFAULT_LOCATION.Jakarta;

    const fetchDriverLocation = useCallback(async () => {
        if (!orderId) return;
        setLoading(true);
        try {
            const response = await api.get(`/orders/${orderId}/driver/location`);
            setDriverLocation(response.data);
            setLastUpdated(new Date());
            setError(null);
        } catch (err) {
            if (err.response?.status !== 404) {
                setError('Failed to fetch driver location');
            }
        } finally {
            setLoading(false);
        }
    }, [orderId]);

    // Poll for driver location every 10 seconds
    useEffect(() => {
        fetchDriverLocation();
        const interval = setInterval(fetchDriverLocation, 10000);
        return () => clearInterval(interval);
    }, [fetchDriverLocation]);

    // Initialize Leaflet map
    useEffect(() => {
        const el = mapContainerRef.current;
        if (!el || mapRef.current || isInitRef.current) return;
        isInitRef.current = true;

        try {
            const center = driverLocation
                ? [driverLocation.latitude, driverLocation.longitude]
                : deliveryAddress?.coordinates
                    ? [deliveryAddress.coordinates[1], deliveryAddress.coordinates[0]]
                    : [defaultCenter.lat, defaultCenter.lng];

            const map = L.map(el).setView(center, 14);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
            }).addTo(map);

            // Destination marker
            if (deliveryAddress?.coordinates) {
                L.marker(
                    [deliveryAddress.coordinates[1], deliveryAddress.coordinates[0]],
                    { icon: destIcon }
                )
                    .addTo(map)
                    .bindPopup('Delivery Address');
            }

            mapRef.current = map;
            setTimeout(() => map.invalidateSize(), 300);
        } catch (err) {
            console.error('Error initializing map:', err);
            setMapError(err.message || 'Failed to load map');
        }

        return () => {
            isInitRef.current = false;
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
            }
            driverMarkerRef.current = null;
            routePolylineRef.current = null;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Update driver marker when location changes
    useEffect(() => {
        if (!mapRef.current || !driverLocation) return;

        const driverPos = [driverLocation.latitude, driverLocation.longitude];

        if (!driverMarkerRef.current) {
            driverMarkerRef.current = L.marker(driverPos, { icon: driverMarkerIcon })
                .addTo(mapRef.current)
                .bindPopup('Driver Location');
        } else {
            driverMarkerRef.current.setLatLng(driverPos);
        }

        mapRef.current.setView(driverPos);

        // Draw route polyline from driver to destination
        if (deliveryAddress?.coordinates) {
            const destPos = [deliveryAddress.coordinates[1], deliveryAddress.coordinates[0]];

            if (routePolylineRef.current) {
                routePolylineRef.current.remove();
            }
            routePolylineRef.current = L.polyline([driverPos, destPos], {
                color: '#22c55e',
                weight: 4,
                opacity: 0.8,
                dashArray: '10, 6',
            }).addTo(mapRef.current);

            // Fit bounds to show both markers
            const bounds = L.latLngBounds([driverPos, destPos]);
            mapRef.current.fitBounds(bounds, { padding: [50, 50] });
        }
    }, [driverLocation, deliveryAddress]);

    if (!driverLocation && !driverInfo) {
        return (
            <Card>
                <CardContent className="p-6 text-center text-muted-foreground">
                    <Navigation className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Driver hasn't started delivery yet</p>
                    {driverInfo?.driverName && (
                        <p className="text-sm mt-2">
                            Assigned Driver: {driverInfo.driverName}
                        </p>
                    )}
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                        <Navigation className="h-5 w-5" />
                        Live Driver Tracking
                    </span>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={fetchDriverLocation}
                        disabled={loading}
                    >
                        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    </Button>
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Driver Info */}
                {driverInfo && (
                    <div className="flex items-center gap-4 p-3 bg-secondary rounded-lg">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <User className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1">
                            <p className="font-medium">{driverInfo.driverName || 'Driver'}</p>
                            {driverInfo.driverPhone && (
                                <a
                                    href={`tel:${driverInfo.driverPhone}`}
                                    className="text-sm text-primary flex items-center gap-1"
                                >
                                    <Phone className="h-3 w-3" />
                                    {driverInfo.driverPhone}
                                </a>
                            )}
                        </div>
                    </div>
                )}

                {/* Map */}
                {mapError ? (
                    <div className="h-[300px] rounded-lg overflow-hidden border flex items-center justify-center">
                        <div className="text-center text-muted-foreground p-4">
                            <Navigation className="h-10 w-10 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">Unable to load map</p>
                            <p className="text-xs text-red-500 mt-1">{mapError}</p>
                        </div>
                    </div>
                ) : (
                    <div ref={mapContainerRef} className="h-[300px] rounded-lg overflow-hidden border" />
                )}

                {/* Driver location info */}
                {driverLocation && (
                    <div className="p-3 bg-secondary rounded-lg">
                        <p className="text-sm font-medium">Driver Position</p>
                        <p className="text-xs text-muted-foreground">
                            Lat: {driverLocation.latitude?.toFixed(6)}, Lng: {driverLocation.longitude?.toFixed(6)}
                        </p>
                        {driverLocation.timestamp && (
                            <p className="text-xs text-muted-foreground mt-1">
                                Last updated: {new Date(driverLocation.timestamp).toLocaleTimeString()}
                            </p>
                        )}
                    </div>
                )}

                {lastUpdated && (
                    <p className="text-xs text-muted-foreground text-center">
                        Last updated: {lastUpdated.toLocaleTimeString()}
                    </p>
                )}
            </CardContent>
        </Card>
    );
}
