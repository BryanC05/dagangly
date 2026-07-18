import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Package, Truck, CheckCircle, Clock, Calendar, MapPin } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '../utils/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { showError } from '../utils/toast';

const statusConfig = {
  pending: { color: 'bg-yellow-100 text-yellow-800 border-yellow-300', label: 'Pending', icon: Clock },
  picked_up: { color: 'bg-blue-100 text-blue-800 border-blue-300', label: 'Picked Up', icon: Package },
  in_transit: { color: 'bg-indigo-100 text-indigo-800 border-indigo-300', label: 'In Transit', icon: Truck },
  out_for_delivery: { color: 'bg-orange-100 text-orange-800 border-orange-300', label: 'Out for Delivery', icon: Truck },
  delivered: { color: 'bg-green-100 text-green-800 border-green-300', label: 'Delivered', icon: CheckCircle },
  cancelled: { color: 'bg-red-100 text-red-800 border-red-300', label: 'Cancelled', icon: Clock },
  failed: { color: 'bg-red-100 text-red-800 border-red-300', label: 'Failed', icon: Clock },
};

const courierBranding = {
  jne: { name: 'JNE Express', color: 'bg-orange-500' },
  jnt: { name: 'J&T Express', color: 'bg-green-600' },
  sicepat: { name: 'SiCepat', color: 'bg-blue-500' },
  ninja: { name: 'Ninja Express', color: 'bg-red-500' },
  antaraja: { name: 'Antar Aja', color: 'bg-yellow-500' },
};

export default function ShipmentTrackingPage() {
  const { trackingId } = useParams();
  const [refreshKey, setRefreshKey] = useState(0);

  // Fetch shipment tracking from public API
  const { data: shipment, isLoading, isError, error } = useQuery({
    queryKey: ['shipment', trackingId, refreshKey],
    queryFn: async () => {
      const response = await api.get(`/shipping/public/track/${trackingId}`);
      return response.data;
    },
    enabled: !!trackingId,
    retry: 1,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  useEffect(() => {
    if (error) {
      showError('Failed to load tracking info', error.response?.data?.message || error.message);
    }
  }, [error]);

  if (isLoading) {
    return (
      <div className="container py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-secondary rounded w-1/4"></div>
          <div className="h-[400px] bg-secondary rounded"></div>
        </div>
      </div>
    );
  }

  if (!shipment && !isLoading) {
    return (
      <div className="container py-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Shipment Not Found</h1>
        <p className="text-sm text-muted-foreground mb-4">
          Tracking ID <code className="bg-muted px-2 py-1 rounded">{trackingId}</code> not found
        </p>
        <Button asChild>
          <Link to="/orders">Back to Orders</Link>
        </Button>
      </div>
    );
  }

  const status = statusConfig[shipment.status] || statusConfig.pending;
  const StatusIcon = status.icon;
  const courier = courierBranding[shipment.courierCode?.toLowerCase()] || {
    name: shipment.courierCode?.toUpperCase() || 'Courier',
    color: 'bg-gray-500',
  };

  return (
    <div className="container py-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/orders">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Shipment Tracking</h1>
          <p className="text-sm text-muted-foreground">
            Track your package with {courier.name}
          </p>
        </div>
        <Badge className={`${status.color} border`} variant="outline">
          <StatusIcon className="h-3 w-3 mr-1" />
          {status.label}
        </Badge>
      </div>

      {/* Main Tracking Card */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Shipment Details
            </div>
            <div className={`px-3 py-1 rounded-full text-xs font-medium text-white ${courier.color}`}>
              {courier.name}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Tracking Number</p>
              <p className="font-mono font-medium text-lg">{shipment.trackingId}</p>
            </div>
            {shipment.awbNumber && (
              <div>
                <p className="text-sm text-muted-foreground">AWB Number</p>
                <p className="font-mono font-medium">{shipment.awbNumber}</p>
              </div>
            )}
            {shipment.courierName && (
              <div>
                <p className="text-sm text-muted-foreground">Courier</p>
                <p className="font-medium">{shipment.courierName}</p>
              </div>
            )}
            {shipment.serviceName && (
              <div>
                <p className="text-sm text-muted-foreground">Service</p>
                <p className="font-medium">{shipment.serviceName}</p>
              </div>
            )}
          </div>

          <Separator />

          <div className="grid grid-cols-2 gap-4">
            {shipment.etd && (
              <div>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Estimated Delivery
                </p>
                <p className="font-medium">
                  {new Date(shipment.etd).toLocaleDateString('id-ID', {
                    weekday: 'short',
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </p>
              </div>
            )}
            {shipment.deliveredAt && (
              <div>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <CheckCircle className="h-4 w-4" />
                  Delivered At
                </p>
                <p className="font-medium">
                  {new Date(shipment.deliveredAt).toLocaleString('id-ID')}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tracking Timeline */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Tracking Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {shipment.events && shipment.events.length > 0 ? (
              shipment.events.map((event, index) => {
                const isLatest = index === 0;
                const EventIcon = statusConfig[event.status]?.icon || Clock;
                
                return (
                  <div key={index} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          isLatest
                            ? 'bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        <EventIcon className="h-4 w-4" />
                      </div>
                      {index < shipment.events.length - 1 && (
                        <div className="w-0.5 h-full bg-muted mt-2"></div>
                      )}
                    </div>
                    <div className="flex-1 pb-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <p
                            className={`font-medium ${
                              isLatest ? 'text-primary' : ''
                            }`}
                          >
                            {event.statusDetail || event.message}
                          </p>
                          {event.address && (
                            <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                              <MapPin className="h-3 w-3" />
                              {event.address}, {event.city}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">
                            {new Date(event.timestamp).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                            })}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(event.timestamp).toLocaleTimeString('id-ID', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                      </div>
                      {isLatest && (
                        <Badge className="mt-2" variant="outline">
                          Latest Update
                        </Badge>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-center text-muted-foreground py-8">
                No tracking events available yet
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Footer */}
      <div className="mt-6 text-center text-sm text-muted-foreground">
        <p>
          Powered by Biteship • Updates every 30 seconds
        </p>
        <p className="mt-1">
          Need help? Contact {courier.name} support with your tracking number
        </p>
      </div>
    </div>
  );
}
