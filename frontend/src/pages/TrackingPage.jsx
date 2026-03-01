import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft, Navigation, Phone, User, Clock, MapPin,
  Store, Package, CheckCircle, RefreshCw
} from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../utils/api';
import { useAuthStore } from '../store/authStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DEFAULT_LOCATION } from '@/utils/constants';

import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import { storeMarkerIcon as storeIcon, deliveryMarkerIcon as deliveryIcon, driverMarkerIcon as driverIcon } from '@/utils/leafletSetup';

const isNotFoundError = (error) => error?.response?.status === 404;

const statusConfig = {
  pending: { color: 'bg-yellow-100 text-yellow-800', label: 'Pending' },
  confirmed: { color: 'bg-blue-100 text-blue-800', label: 'Confirmed' },
  preparing: { color: 'bg-purple-100 text-purple-800', label: 'Preparing' },
  ready: { color: 'bg-indigo-100 text-indigo-800', label: 'Ready for Pickup' },
  out_for_delivery: { color: 'bg-orange-100 text-orange-800', label: 'Out for Delivery' },
  delivered: { color: 'bg-green-100 text-green-800', label: 'Delivered' },
  cancelled: { color: 'bg-red-100 text-red-800', label: 'Cancelled' },
};

export default function TrackingPage() {
  const { orderId } = useParams();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [lastUpdated, setLastUpdated] = useState(null);
  const [mapError, setMapError] = useState(null);

  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const storeMarkerRef = useRef(null);
  const deliveryMarkerRef = useRef(null);
  const driverMarkerRef = useRef(null);
  const routePolylineRef = useRef(null);
  const isInitRef = useRef(false);

  const defaultCenter = DEFAULT_LOCATION.Jakarta;

  // Fetch order details
  const {
    data: order,
    isLoading: orderLoading,
    isError: orderError,
    error: orderQueryError,
  } = useQuery({
    queryKey: ['order', orderId],
    queryFn: async () => {
      const response = await api.get(`/orders/${orderId}`);
      return response.data;
    },
    enabled: !!orderId,
    retry: (failureCount, error) => {
      if (isNotFoundError(error)) return false;
      return failureCount < 2;
    },
    retryOnMount: false,
    refetchOnMount: false,
    refetchInterval: (query) => (query.state.data ? 30000 : false),
  });

  // Fetch driver location (buyer only)
  const { data: driverLocation } = useQuery({
    queryKey: ['driverLocation', orderId],
    queryFn: async () => {
      const response = await api.get(`/orders/${orderId}/driver/location`);
      setLastUpdated(new Date());
      return response.data;
    },
    enabled: !!orderId && order?.deliveryType === 'delivery' && order?.status !== 'delivered' && order?.status !== 'cancelled',
    retry: 1,
    refetchInterval: 10000,
  });

  // Get coordinates
  const storeLocation = order?.seller?.location?.coordinates
    ? { lat: order.seller.location.coordinates[1], lng: order.seller.location.coordinates[0] }
    : null;
  const deliveryLocation = order?.deliveryAddress?.coordinates
    ? { lat: order.deliveryAddress.coordinates[1], lng: order.deliveryAddress.coordinates[0] }
    : null;
  const driverLoc = driverLocation
    ? { lat: driverLocation.latitude, lng: driverLocation.longitude }
    : null;
  const routeOrigin = driverLoc || storeLocation;

  // Fetch route data
  const { data: routeData } = useQuery({
    queryKey: [
      'deliveryRoute', orderId,
      routeOrigin?.lat, routeOrigin?.lng,
      deliveryLocation?.lat, deliveryLocation?.lng,
      order?.status,
    ],
    queryFn: async () => {
      const response = await api.get('/navigation/route', {
        params: {
          originLat: routeOrigin.lat,
          originLng: routeOrigin.lng,
          destinationLat: deliveryLocation.lat,
          destinationLng: deliveryLocation.lng,
          profile: 'driving',
        },
      });
      return response.data;
    },
    enabled:
      !!orderId &&
      order?.deliveryType === 'delivery' &&
      order?.status !== 'delivered' &&
      order?.status !== 'cancelled' &&
      !!routeOrigin &&
      !!deliveryLocation,
    retry: 1,
    refetchInterval: 10000,
  });

  const isSeller = order?.seller?._id === user?.id;

  // Update driver location (seller only)
  const updateLocation = useCallback(async (position) => {
    if (!isSeller) return;
    try {
      await api.post(`/orders/${orderId}/driver/location`, {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });
      queryClient.invalidateQueries(['driverLocation', orderId]);
    } catch (error) {
      console.error('Failed to update location:', error);
    }
  }, [isSeller, orderId, queryClient]);

  // Auto-update location for seller
  useEffect(() => {
    if (!isSeller || order?.status === 'delivered') return;
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(updateLocation);
    }
    const interval = setInterval(() => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(updateLocation);
      }
    }, 15000);
    return () => clearInterval(interval);
  }, [isSeller, order?.status, updateLocation]);

  // Initialize Leaflet map
  useEffect(() => {
    const el = mapContainerRef.current;
    if (!el || mapRef.current || isInitRef.current) return;
    isInitRef.current = true;

    try {
      let center = [defaultCenter.lat, defaultCenter.lng];
      if (driverLoc) center = [driverLoc.lat, driverLoc.lng];
      else if (deliveryLocation) center = [deliveryLocation.lat, deliveryLocation.lng];
      else if (storeLocation) center = [storeLocation.lat, storeLocation.lng];

      const map = L.map(el).setView(center, 14);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);

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
      storeMarkerRef.current = null;
      deliveryMarkerRef.current = null;
      driverMarkerRef.current = null;
      routePolylineRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update markers when locations change
  useEffect(() => {
    if (!mapRef.current) return;

    // Store marker
    if (storeLocation) {
      if (!storeMarkerRef.current) {
        storeMarkerRef.current = L.marker([storeLocation.lat, storeLocation.lng], { icon: storeIcon })
          .addTo(mapRef.current)
          .bindPopup(`<b>${order?.seller?.businessName || order?.seller?.name || 'Store'}</b><br>Store Location`);
      } else {
        storeMarkerRef.current.setLatLng([storeLocation.lat, storeLocation.lng]);
      }
    }

    // Delivery marker
    if (deliveryLocation) {
      if (!deliveryMarkerRef.current) {
        deliveryMarkerRef.current = L.marker([deliveryLocation.lat, deliveryLocation.lng], { icon: deliveryIcon })
          .addTo(mapRef.current)
          .bindPopup(`<b>Delivery Address</b><br>${order?.deliveryAddress?.address || ''}`);
      } else {
        deliveryMarkerRef.current.setLatLng([deliveryLocation.lat, deliveryLocation.lng]);
      }
    }

    // Driver marker
    if (driverLoc) {
      if (!driverMarkerRef.current) {
        driverMarkerRef.current = L.marker([driverLoc.lat, driverLoc.lng], { icon: driverIcon })
          .addTo(mapRef.current)
          .bindPopup(`<b>Driver Location</b><br>Last updated: ${lastUpdated?.toLocaleTimeString() || 'N/A'}`);
      } else {
        driverMarkerRef.current.setLatLng([driverLoc.lat, driverLoc.lng]);
        driverMarkerRef.current.setPopupContent(`<b>Driver Location</b><br>Last updated: ${lastUpdated?.toLocaleTimeString() || 'N/A'}`);
      }
      mapRef.current.setView([driverLoc.lat, driverLoc.lng]);
    }

    // Draw route
    if (routeOrigin && deliveryLocation && routeData?.path) {
      if (routePolylineRef.current) {
        routePolylineRef.current.remove();
      }
      const path = routeData.path.map(point => [point.lat, point.lng]);
      routePolylineRef.current = L.polyline(path, {
        color: '#22c55e',
        weight: 4,
        opacity: 0.8,
      }).addTo(mapRef.current);

      const bounds = L.latLngBounds(path);
      mapRef.current.fitBounds(bounds, { padding: [50, 50] });
    } else if (storeLocation && deliveryLocation) {
      // Fit bounds to show store and delivery
      const bounds = L.latLngBounds([
        [storeLocation.lat, storeLocation.lng],
        [deliveryLocation.lat, deliveryLocation.lng],
      ]);
      if (driverLoc) bounds.extend([driverLoc.lat, driverLoc.lng]);
      mapRef.current.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [storeLocation, deliveryLocation, driverLoc, routeData, order, lastUpdated, routeOrigin]);

  if (orderLoading) {
    return (
      <>
        <div className="container py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-secondary rounded w-1/4"></div>
            <div className="h-[500px] bg-secondary rounded"></div>
          </div>
        </div>
      </>
    );
  }

  if (!order && !orderLoading) {
    const notFound = isNotFoundError(orderQueryError);
    return (
      <>
        <div className="container py-8 text-center">
          <h1 className="text-2xl font-bold mb-4">
            {notFound ? 'Order Not Found' : 'Failed to Load Order'}
          </h1>
          {orderError && !notFound && (
            <p className="text-sm text-muted-foreground mb-4">
              {orderQueryError?.response?.data?.message || orderQueryError?.message || 'Unexpected error'}
            </p>
          )}
          <Button asChild>
            <Link to="/orders">Back to Orders</Link>
          </Button>
        </div>
      </>
    );
  }

  const status = statusConfig[order.status] || statusConfig.pending;
  const isDelivery = order.deliveryType === 'delivery';
  const routeDistanceKm = routeData?.distanceMeters
    ? routeData.distanceMeters / 1000
    : null;
  const routeDurationMinutes = routeData?.durationSeconds
    ? Math.round(routeData.durationSeconds / 60)
    : null;

  return (
    <>
      <div className="container py-4">
        {/* Header */}
        <div className="flex items-center gap-4 mb-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/orders">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-bold">Order Tracking</h1>
            <p className="text-sm text-muted-foreground">#{orderId?.slice(-8).toUpperCase()}</p>
          </div>
          <Badge className={status.color}>{status.label}</Badge>
        </div>

        <div className="grid lg:grid-cols-3 gap-4">
          {/* Main Map */}
          <div className="lg:col-span-2">
            <Card className="h-[600px]">
              <CardContent className="p-0 h-full">
                {mapError ? (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-center text-muted-foreground p-4">
                      <Navigation className="h-10 w-10 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Unable to load map</p>
                      <p className="text-xs text-red-500 mt-1">{mapError}</p>
                    </div>
                  </div>
                ) : (
                  <div
                    ref={mapContainerRef}
                    style={{ height: '100%', width: '100%', borderRadius: '0.5rem' }}
                  />
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar Info */}
          <div className="space-y-4">
            {/* Order Info */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Order Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Store</p>
                  <p className="font-medium">{order.seller?.businessName || order.seller?.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Delivery Type</p>
                  <p className="font-medium flex items-center gap-1">
                    {isDelivery ? '🚗 Delivery' : '🏪 Pickup'}
                  </p>
                </div>
                {isDelivery && routeDistanceKm && (
                  <div>
                    <p className="text-sm text-muted-foreground">Route</p>
                    <p className="font-medium">
                      {routeDistanceKm.toFixed(2)} km
                      {routeDurationMinutes ? ` • ~${routeDurationMinutes} min` : ''}
                    </p>
                  </div>
                )}
                {order.preorderTime && (
                  <div>
                    <p className="text-sm text-muted-foreground">Scheduled Time</p>
                    <p className="font-medium flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {order.preorderTime}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Driver Info */}
            {isDelivery && (order.driverName || driverLocation) && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Navigation className="h-4 w-4" />
                    Driver Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {order.driverName && (
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{order.driverName}</p>
                        <p className="text-sm text-muted-foreground">Driver</p>
                      </div>
                    </div>
                  )}

                  {order.driverPhone && (
                    <a
                      href={`tel:${order.driverPhone}`}
                      className="flex items-center gap-2 text-primary hover:underline"
                    >
                      <Phone className="h-4 w-4" />
                      {order.driverPhone}
                    </a>
                  )}

                  {lastUpdated && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <RefreshCw className="h-3 w-3" />
                      Last updated: {lastUpdated.toLocaleTimeString()}
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Delivery Address */}
            {isDelivery && order.deliveryAddress && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Delivery Address
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">{order.deliveryAddress.address}</p>
                  {order.deliveryAddress.city && (
                    <p className="text-sm text-muted-foreground">
                      {order.deliveryAddress.city}, {order.deliveryAddress.pincode}
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Seller Actions */}
            {isSeller && isDelivery && order.status !== 'delivered' && order.status !== 'cancelled' && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Driver Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button
                    className="w-full"
                    onClick={() => {
                      if (navigator.geolocation) {
                        navigator.geolocation.getCurrentPosition(updateLocation);
                      }
                    }}
                  >
                    <Navigation className="h-4 w-4 mr-2" />
                    Update Location Now
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">
                    Auto-updating every 15 seconds
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Progress Steps */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Delivery Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {['pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered'].map((step, index) => {
                    const isActive = order.status === step;
                    const isPast = ['pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered']
                      .indexOf(order.status) >= index;

                    if (!isDelivery && step === 'out_for_delivery') return null;

                    return (
                      <div key={step} className="flex items-center gap-3">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${isPast ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                          } ${isActive ? 'ring-2 ring-primary ring-offset-2' : ''}`}>
                          {isPast ? '✓' : index + 1}
                        </div>
                        <span className={`text-sm ${isActive ? 'font-medium' : isPast ? '' : 'text-muted-foreground'}`}>
                          {statusConfig[step]?.label || step}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
