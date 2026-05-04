import React, { useRef, useImperativeHandle, forwardRef, useState, Component } from 'react';
import { View, Text, Dimensions, StyleSheet, TouchableOpacity, Linking, Platform, ActivityIndicator } from 'react-native';
import { useThemeStore } from '../store/themeStore';
import { useTranslation } from '../hooks/useTranslation';
import { Ionicons } from '@expo/vector-icons';
import { tokens } from '../theme/tokens';
// Import WebView for embedded map
import { WebView } from 'react-native-webview';

const { width, height } = Dimensions.get('window');

// Disable native react-native-maps in Expo Go - it requires Google Play Services
let MapView = null;
let Marker = null;
let mapLoaded = false;

// Embedded WebView Map using OpenStreetMap
function EmbeddedMapFallback({ region, markers, style, onMarkerPress }) {
    const { colors } = useThemeStore();
    const webviewRef = useRef(null);
    const [loading, setLoading] = useState(true);
    
    const centerLat = region?.latitude || -6.2088;
    const centerLng = region?.longitude || 106.8456;
    const zoom = region?.latitudeDelta > 0.1 ? 10 : 14;
    
    // Calculate bounding box for the map
    const latDelta = 0.02;
    const lngDelta = 0.02;
    const minLat = centerLat - latDelta;
    const maxLat = centerLat + latDelta;
    const minLng = centerLng - lngDelta;
    const maxLng = centerLng + lngDelta;
    
    // Generate markers HTML for the webview
    const markersHtml = markers?.map((marker, idx) => {
        const lat = marker.lat || marker.latitude;
        const lng = marker.lng || marker.longitude;
        if (!lat || !lng) return '';
        return `
            <div class="marker" style="
                position: absolute;
                left: ${((lng - minLng) / (maxLng - minLng)) * 100}%;
                top: ${((maxLat - lat) / (maxLat - minLat)) * 100}%;
                transform: translate(-50%, -100%);
                font-size: 32px;
                cursor: pointer;
                z-index: 1000;
            " onclick="window.ReactNativeWebView.postMessage('marker:${idx}')">📍</div>
        `;
    }).join('') || '';
    
    const mapHtml = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=3.0, user-scalable=yes">
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            html, body { width: 100%; height: 100%; overflow: hidden; background: #f0f0f0; }
            #map { width: 100%; height: 100%; position: relative; }
            .marker { transition: transform 0.1s; }
            .marker:active { transform: translate(-50%, -100%) scale(1.2); }
            #loading { 
                position: absolute; top: 50%; left: 50%; 
                transform: translate(-50%, -50%);
                font-family: -apple-system, sans-serif;
                color: #666;
            }
        </style>
    </head>
    <body>
        <div id="map">
            <div id="loading">Loading map...</div>
            <img src="https://www.openstreetmap.org/export/embed.html?bbox=${minLng}%2C${minLat}%2C${maxLng}%2C${maxLat}&layer=mapnik&marker=${centerLat}%2C${centerLng}" 
                style="width: 100%; height: 100%; object-fit: cover;"
                onload="document.getElementById('loading').style.display='none'"
                onerror="document.getElementById('loading').innerText='Failed to load map'" />
            ${markersHtml}
        </div>
        <script>
            document.addEventListener('message', function(e) {
                if (e.data.startsWith('marker:')) {
                    window.ReactNativeWebView.postMessage(e.data);
                }
            });
        </script>
    </body>
    </html>
    `;
    
    const handleMessage = (event) => {
        const data = event.nativeEvent.data;
        if (data && data.startsWith('marker:')) {
            const idx = parseInt(data.split(':')[1]);
            if (markers && markers[idx]) {
                onMarkerPress?.(markers[idx]);
            }
        }
    };
    
    return (
        <View style={[styles.fallbackContainer, style]}>
            <WebView
                ref={webviewRef}
                source={{ html: mapHtml }}
                style={styles.webview}
                scrollEnabled={true}
                zoomEnabled={true}
                bounces={true}
                originWhitelist={['*']}
                allowFileAccess={true}
                startInLoadingState={true}
                onLoadStart={() => setLoading(true)}
                onLoadEnd={() => setLoading(false)}
                onMessage={handleMessage}
                renderLoading={() => (
                    <View style={styles.loadingOverlay}>
                        <ActivityIndicator size="large" color={colors?.primary || '#14b8a6'} />
                        <Text style={styles.loadingText}>Loading map...</Text>
                    </View>
                )}
            />
        </View>
    );
}

// Fallback styles
const styles = StyleSheet.create({
    fallbackContainer: { flex: 1 },
    webview: { flex: 1 },
    loadingOverlay: { 
        position: 'absolute', 
        top: 0, left: 0, right: 0, bottom: 0, 
        justifyContent: 'center', alignItems: 'center', 
        backgroundColor: 'rgba(255,255,255,0.9)' 
    },
    loadingText: { marginTop: 10, color: '#666', fontSize: 14 },
    mapPlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
    mapPlaceholderIcon: { fontSize: 48, marginBottom: 16 },
    mapPlaceholderText: { fontSize: 14, marginBottom: 16, textAlign: 'center' },
    mapButton: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 8, gap: 8 },
    mapButtonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
});

// Error boundary
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

/**
 * Reusable Map Component - uses react-native-maps if available, otherwise shows fallback
 */
const Map = forwardRef(({
    region,
    userLocation,
    radius,
    markers = [],
    polylineCoordinates = [],
    polylineColor,
    polylineWidth = 4,
    onMarkerPress,
    selectedMarkerId,
    style,
    showsUserLocation = true,
    showsMyLocationButton = true,
    showsCompass = true,
    children,
}, ref) => {
    // All hooks must be called before any conditional returns (Rules of Hooks)
    const innerMapRef = useRef(null);
    const { colors } = useThemeStore();

    useImperativeHandle(ref, () => ({
        animateToRegion: (rgn, duration) => {
            innerMapRef.current?.animateToRegion(rgn, duration);
        },
    }));

    // If maps didn't load, show embedded map fallback
    if (!mapLoaded) {
        return (
            <EmbeddedMapFallback 
                region={region}
                markers={markers}
                style={style}
                onMarkerPress={onMarkerPress}
            />
        );
    }

    const dynamicStyles = {
        container: {
            flex: 1,
        },
        map: {
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
        },
        fallbackContainer: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: colors.background,
        },
        fallbackIcon: {
            fontSize: tokens.fontSize['5xl'],
            marginBottom: tokens.spacing[3],
        },
        fallbackTitle: {
            fontSize: tokens.fontSize.lg,
            fontWeight: tokens.fontWeight.bold,
            color: colors.text,
            marginBottom: tokens.spacing[2],
        },
        fallbackText: {
            fontSize: tokens.fontSize.sm,
            color: colors.textSecondary,
            textAlign: 'center',
            lineHeight: tokens.lineHeight.normal * tokens.fontSize.sm,
            paddingHorizontal: tokens.spacing[10],
        },
        osmButton: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            backgroundColor: colors.primary,
            paddingVertical: 10,
            paddingHorizontal: 20,
            borderRadius: tokens.radius.md,
            marginTop: tokens.spacing[4],
        },
        osmButtonText: {
            color: '#fff',
            fontSize: tokens.fontSize.sm,
            fontWeight: tokens.fontWeight.semibold,
        },
        markerContainer: {
            alignItems: 'center',
        },
        markerSelected: {
            transform: [{ scale: 1.1 }],
        },
        markerBubble: {
            width: 30,
            height: 30,
            borderRadius: tokens.radius.full,
            justifyContent: 'center',
            alignItems: 'center',
            borderWidth: 2,
            borderColor: colors.card,
            backgroundColor: colors.primary,
            ...tokens.shadows.md,
        },
        markerText: {
            color: '#fff',
            fontSize: tokens.fontSize.sm,
            fontWeight: tokens.fontWeight.bold,
        },
        markerArrow: {
            width: 0,
            height: 0,
            backgroundColor: 'transparent',
            borderStyle: 'solid',
            borderLeftWidth: 6,
            borderRightWidth: 6,
            borderTopWidth: 8,
            borderLeftColor: 'transparent',
            borderRightColor: 'transparent',
            borderTopColor: colors.primary,
            marginTop: -2,
        },
    };

    if (!MapView) {
        return (
            <View style={[dynamicStyles.fallbackContainer, style]}>
                <Text style={dynamicStyles.fallbackIcon}>🗺️</Text>
                <Text style={dynamicStyles.fallbackTitle}>Map Unavailable</Text>
                <Text style={dynamicStyles.fallbackText}>
                    Google Maps API not configured.{'\n'}Add your API key in app.json.
                </Text>
                
                {/* OpenStreetMap Fallback Button */}
                {region && (
                    <TouchableOpacity 
                        style={dynamicStyles.osmButton}
                        onPress={() => {
                            const url = `https://www.openstreetmap.org/?mlat=${region.latitude}&mlon=${region.longitude}&zoom=14`;
                            Linking.openURL(url);
                        }}
                    >
                        <Ionicons name="globe-outline" size={18} color="#fff" />
                        <Text style={dynamicStyles.osmButtonText}>OpenStreetMap</Text>
                    </TouchableOpacity>
                )}
            </View>
        );
    }

    // Custom map style for better integration with app theme
    const mapStyle = [
        {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }]
        },
        {
            featureType: 'transit',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }]
        },
        {
            featureType: 'water',
            elementType: 'geometry',
            stylers: [{ color: '#e3f2fd' }]
        },
        {
            featureType: 'landscape',
            elementType: 'geometry',
            stylers: [{ color: '#f8fafc' }]
        }
    ];

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
                    customMapStyle={mapStyle}
                    mapType="standard"
                    loadingEnabled={true}
                    loadingIndicatorColor={colors.primary}
                    loadingBackgroundColor={colors.background}
                >

                    {/* User Location Circle */}
                    {userLocation && radius && Circle && (
                        <Circle
                            center={userLocation}
                            radius={radius}
                            strokeColor={colors.primary + '50'}
                            fillColor={colors.primary + '20'}
                            strokeWidth={2}
                        />
                    )}

                    {/* Custom Markers */}
                    {markers.map((marker, index) => {
                        if (!Marker) return null;
                        const isSelected = selectedMarkerId === marker.id;
                        const markerColor = marker.color || (isSelected ? tokens.colors.accent || '#f59e0b' : colors.primary);

                        return (
                            <Marker
                                key={marker.id || index}
                                coordinate={marker.coordinate}
                                onPress={() => onMarkerPress?.(marker)}
                                zIndex={isSelected ? 999 : index}
                                hitSlop={{ top: 20, right: 20, bottom: 20, left: 20 }}
                                anchor={{ x: 0.5, y: 1 }} // Ensures tip points exactly at coordinate
                            >
                                <View style={[
                                    dynamicStyles.markerContainer,
                                    isSelected && dynamicStyles.markerSelected
                                ]}>
                                    <View style={[
                                        dynamicStyles.markerBubble,
                                        { backgroundColor: markerColor, borderColor: isSelected ? '#fff' : colors.card, borderWidth: isSelected ? 3 : 2 }
                                    ]}>
                                        <Text style={dynamicStyles.markerText}>
                                            {marker.icon || (marker.number || index + 1)}
                                        </Text>
                                    </View>
                                    <View style={[dynamicStyles.markerArrow, { borderTopColor: markerColor }]} />
                                </View>
                            </Marker>
                        );
                    })}

                    {Polyline && Array.isArray(polylineCoordinates) && polylineCoordinates.length > 1 && (
                        <Polyline
                            coordinates={polylineCoordinates}
                            strokeColor={polylineColor || colors.primary}
                            strokeWidth={polylineWidth}
                        />
                    )}

                    {children}
                </MapView>
            </View>
        </MapErrorBoundary>
    );
});

export default Map;
