import React, { useRef, useState, Component, forwardRef, useImperativeHandle, useEffect } from 'react';
import { View, Text, Dimensions, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../store/themeStore';
import { tokens } from '../theme/tokens';
import { WebView } from 'react-native-webview';
import { OFFLINE_TESTING_MODE } from '../config';

const { width, height } = Dimensions.get('window');

let MapView = null;
let mapLoaded = false;

function EmbeddedMapFallback({ region, markers, style, onMarkerPress, onNavigate, polylineCoordinates, polylineColor }) {
    const webviewRef = useRef(null);
    const [isReady, setIsReady] = useState(false);
    const [routeCoords, setRouteCoords] = useState([]);

    const centerLat = region?.latitude || -6.2088;
    const centerLng = region?.longitude || 106.8456;
    const zoom = 14;
    const routeColor = polylineColor || '#14b8a6';

    const markersJson = JSON.stringify(markers || []);

    useEffect(() => {
        if (polylineCoordinates && polylineCoordinates.length > 0) {
            const coords = polylineCoordinates.map(c => [c.longitude, c.latitude]);
            setRouteCoords(coords);
            if (isReady && webviewRef.current) {
                const coordsJson = JSON.stringify(coords);
                webviewRef.current.injectJavaScript(`drawRoute(${coordsJson});void(0);`);
            }
        } else {
            setRouteCoords([]);
            if (isReady && webviewRef.current) {
                webviewRef.current.injectJavaScript('clearRoute();void(0);');
            }
        }
    }, [polylineCoordinates, isReady]);

    const routeCoordsJson = JSON.stringify(routeCoords);

    const mapHtml = `<!DOCTYPE html>
<html>
<head>
    <meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1">
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
    <style>
        * { margin: 0; padding: 0; }
        html, body { width: 100%; height: 100%; overflow: hidden; }
        #map { width: 100%; height: 100%; background: #e5e5e5; }
        .leaflet-container { width: 100% !important; height: 100% !important; background: #e5e5e5 !important; }
    </style>
</head>
<body>
    <div id="map"></div>
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <script>
        var map, userMarker, routePolyline, userIcon;
        var routeCoords = ${routeCoordsJson};
        var markers = ${markersJson};
        var routeColor = '${routeColor}';

        function clearRoute() {
            if (routePolyline) {
                map.removeLayer(routePolyline);
                routePolyline = null;
            }
            routeCoords = [];
        }

        function drawRoute(coords) {
            if (routePolyline) {
                map.removeLayer(routePolyline);
            }
            if (coords && coords.length > 1) {
                var latlngs = coords.map(function(c) {
                    return [c[1], c[0]];
                });
                routePolyline = L.polyline(latlngs, {
                    color: routeColor,
                    weight: 5,
                    opacity: 0.8,
                    dashArray: '10, 10'
                }).addTo(map);
                map.fitBounds(routePolyline.getBounds(), { padding: [30, 30] });
            }
        }

        function init() {
            try {
                map = L.map('map', {
                    center: [${centerLat}, ${centerLng}],
                    zoom: ${zoom}
                });
                L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    maxZoom: 19,
                    attribution: '© OSM'
                }).addTo(map);

                if (routeCoords && routeCoords.length > 0) {
                    drawRoute(routeCoords);
                }

                markers.forEach(function(m, i) {
                    var lat = m.coordinate ? m.coordinate.latitude : m.latitude;
                    var lng = m.coordinate ? m.coordinate.longitude : m.longitude;
                    var title = m.title || m.description || 'Seller';
                    var id = m.id || m._id || 's' + i;
                    var popupContent = '<div style="padding:10px;font-family:sans-serif">' +
                        '<b style="font-size:14px">' + title + '</b><br/>' +
                        '<button onclick="nav(\\'' + id + '\\',' + lat + ',' + lng + ')" ' +
                        'style="margin-top:8px;padding:8px;background:' + routeColor + ';color:white;border:none;border-radius:4px;cursor:pointer">Navigate</button> ' +
                        '<button onclick="sto(\\'' + id + '\\')" ' +
                        'style="margin-top:8px;padding:8px;background:#6366f1;color:white;border:none;border-radius:4px;cursor:pointer">Store</button>' +
                        '</div>';
                    L.circleMarker([lat, lng], {
                        radius: 10,
                        fillColor: routeColor,
                        color: '#fff',
                        weight: 2,
                        fillOpacity: 0.8
                    }).addTo(map).bindPopup(popupContent);
                });

                if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(function(p) {
                        userIcon = L.divIcon({
                            className: '',
                            iconSize: [20, 20],
                            iconAnchor: [10, 10],
                            html: '<div style="width:20px;height:20px;background:#3b82f6;border:3px solid #fff;border-radius:50%;box-shadow:0 2px 4px rgba(0,0,0,0.3)"></div>'
                        });
                        userMarker = L.marker([p.coords.latitude, p.coords.longitude], { icon: userIcon }).addTo(map);
                        map.setView([p.coords.latitude, p.coords.longitude], ${zoom});
                    }, null, { timeout: 5000 });
                }

                window.ReactNativeWebView.postMessage('ready');
            } catch (e) {
                console.error(e);
            }
        }

        function nav(id, lat, lng) {
            window.ReactNativeWebView.postMessage('nav:' + id + ':navigate');
        }

        function sto(id) {
            window.ReactNativeWebView.postMessage('store:' + id);
        }

        function handleNativeMessage(event) {
            var data = event.data || event;
            if (typeof data === 'string') {
                if (data === 'clearRoute') {
                    clearRoute();
                } else if (data.startsWith('route:')) {
                    try {
                        var coords = JSON.parse(data.substring(6));
                        routeCoords = coords;
                        drawRoute(coords);
                    } catch (e) {
                        console.error('Failed to parse route:', e);
                    }
                }
            }
        }

        document.addEventListener('message', handleNativeMessage);
        window.addEventListener('message', handleNativeMessage);

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', init);
        } else {
            init();
        }
    </script>
</body>
</html>`;

    const handleMessage = (event) => {
        const data = event.nativeEvent.data;
        const handler = onNavigate || onMarkerPress;

        if (data === 'ready') {
            setIsReady(true);
        } else if (data === 'cleared') {
            if (handler) handler(null, 'clearRoute');
        } else if (data && data.startsWith('store:')) {
            const id = data.split(':')[1];
            if (handler) handler(id, 'store');
        } else if (data && data.startsWith('nav:')) {
            const parts = data.split(':');
            const id = parts[1];
            const action = parts[2];
            if (handler) handler(id, action);
        }
    };

    return (
        <View style={[styles.fallbackContainer, style, { minHeight: 300 }]}>
            <WebView
                ref={webviewRef}
                source={{ html: mapHtml }}
                style={styles.webview}
                scrollEnabled={false}
                zoomEnabled={false}
                bounces={false}
                originWhitelist={['*']}
                javaScriptEnabled={true}
                mixedContentMode="always"
                domStorageEnabled={true}
                onMessage={handleMessage}
                onError={(e) => console.log('WebView error:', e)}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    fallbackContainer: { flex: 1 },
    webview: { flex: 1 },
});

class MapErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError() {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        console.warn('Map crashed:', error.message);
    }

    render() {
        if (this.state.hasError || !MapView) {
            return (
                <View style={[this.props.fallbackStyles.container, this.props.style]}>
                    <Text style={this.props.fallbackStyles.icon}>🗺️</Text>
                    <Text style={this.props.fallbackStyles.title}>Map Unavailable</Text>
                    <Text style={this.props.fallbackStyles.text}>
                        Google Maps API key is not configured.{'\n'}
                        Seller data is still shown in the list below.
                    </Text>
                </View>
            );
        }
        return this.props.children;
    }
}

const Map = forwardRef(({
    region,
    userLocation,
    radius,
    markers = [],
    polylineCoordinates = [],
    polylineColor,
    polylineWidth = 4,
    onMarkerPress,
    onNavigate,
    selectedMarkerId,
    style,
    showsUserLocation = true,
    showsMyLocationButton = true,
    showsCompass = true,
    children,
}, ref) => {
    const innerMapRef = useRef(null);
    const { colors } = useThemeStore();

    useImperativeHandle(ref, () => ({
        animateToRegion: (rgn, duration) => {
            innerMapRef.current?.animateToRegion(rgn, duration);
        },
    }));

    if (!mapLoaded) {
        return (
            <EmbeddedMapFallback 
                region={region}
                markers={markers}
                style={style}
                onMarkerPress={onMarkerPress}
                onNavigate={onNavigate}
                polylineCoordinates={polylineCoordinates}
                polylineColor={polylineColor}
            />
        );
    }

    const dynamicStyles = {
        container: { flex: 1 },
        map: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
        fallbackContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
        fallbackIcon: { fontSize: 48, marginBottom: 16 },
        fallbackTitle: { fontSize: 18, fontWeight: 'bold', color: colors.text, marginBottom: 8 },
        fallbackText: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', paddingHorizontal: 40 },
        osmButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.primary, paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8, marginTop: 16 },
        osmButtonText: { color: '#fff', fontSize: 14, fontWeight: '600' },
        markerContainer: { alignItems: 'center' },
        markerSelected: { transform: [{ scale: 1.1 }] },
        markerBubble: { width: 30, height: 30, borderRadius: 15, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: colors.card, backgroundColor: colors.primary },
        markerText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
        markerArrow: { width: 0, height: 0, backgroundColor: 'transparent', borderStyle: 'solid', borderLeftWidth: 6, borderRightWidth: 6, borderTopWidth: 8, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderTopColor: colors.primary, marginTop: -2 },
    };

    if (!MapView) {
        return (
            <View style={[dynamicStyles.fallbackContainer, style]}>
                <Text style={dynamicStyles.fallbackIcon}>🗺️</Text>
                <Text style={dynamicStyles.fallbackTitle}>Map Unavailable</Text>
                <Text style={dynamicStyles.fallbackText}>Google Maps API not configured.{'\n'}Add your API key in app.json.</Text>
                {region && (
                    <TouchableOpacity style={dynamicStyles.osmButton} onPress={() => { Linking.openURL(`https://www.openstreetmap.org/?mlat=${region.latitude}&mlon=${region.longitude}&zoom=14`); }}>
                        <Ionicons name="globe-outline" size={18} color="#fff" />
                        <Text style={dynamicStyles.osmButtonText}>OpenStreetMap</Text>
                    </TouchableOpacity>
                )}
            </View>
        );
    }

    return (
        <MapErrorBoundary style={style} fallbackStyles={dynamicStyles}>
            <View style={[dynamicStyles.container, style]}>
                <MapView
                    ref={innerMapRef}
                    style={dynamicStyles.map}
                    provider={Platform.OS === 'ios' ? PROVIDER_GOOGLE : undefined}
                    region={region}
                    showsUserLocation={showsUserLocation}
                    showsMyLocationButton={showsMyLocationButton}
                    showsCompass={showsCompass}
                    customMapStyle={[
                        { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
                        { featureType: 'transit', elementType: 'labels', stylers: [{ visibility: 'off' }] },
                        { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#e3f2fd' }] },
                        { featureType: 'landscape', elementType: 'geometry', stylers: [{ color: '#f8fafc' }] },
                    ]}
                    mapType="standard"
                    loadingEnabled={true}
                    loadingIndicatorColor={colors.primary}
                    loadingBackgroundColor={colors.background}
                >
                    {userLocation && radius && Circle && (
                        <Circle center={userLocation} radius={radius} strokeColor={colors.primary + '50'} fillColor={colors.primary + '20'} strokeWidth={2} />
                    )}
                    {markers.map((marker, index) => {
                        if (!Marker) return null;
                        const isSelected = selectedMarkerId === marker.id;
                        const markerColor = marker.color || (isSelected ? tokens.colors.accent || '#f59e0b' : colors.primary);
                        return (
                            <Marker key={marker.id || index} coordinate={marker.coordinate} onPress={() => onMarkerPress?.(marker)} zIndex={isSelected ? 999 : index} hitSlop={{ top: 20, right: 20, bottom: 20, left: 20 }} anchor={{ x: 0.5, y: 1 }}>
                                <View style={[dynamicStyles.markerContainer, isSelected && dynamicStyles.markerSelected]}>
                                    <View style={[dynamicStyles.markerBubble, { backgroundColor: markerColor, borderColor: isSelected ? '#fff' : colors.card, borderWidth: isSelected ? 3 : 2 }]}>
                                        <Text style={dynamicStyles.markerText}>{marker.icon || (marker.number || index + 1)}</Text>
                                    </View>
                                    <View style={[dynamicStyles.markerArrow, { borderTopColor: markerColor }]} />
                                </View>
                            </Marker>
                        );
                    })}
                    {Polyline && Array.isArray(polylineCoordinates) && polylineCoordinates.length > 1 && (
                        <Polyline coordinates={polylineCoordinates} strokeColor={polylineColor || colors.primary} strokeWidth={polylineWidth} />
                    )}
                    {children}
                </MapView>
            </View>
        </MapErrorBoundary>
    );
});

export default Map;