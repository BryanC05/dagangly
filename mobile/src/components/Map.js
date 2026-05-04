import React, { useRef, useState, Component, forwardRef } from 'react';
import { View, Text, Dimensions, StyleSheet } from 'react-native';
import { useThemeStore } from '../store/themeStore';
import { WebView } from 'react-native-webview';

const { width, height } = Dimensions.get('window');

// Disable native react-native-maps in Expo Go - it requires Google Play Services
let MapView = null;

// Embedded WebView Map using OpenStreetMap tile server
function EmbeddedMapFallback({ region, markers, style, onMarkerPress, onNavigate }) {
    const webviewRef = useRef(null);
    
    const centerLat = region?.latitude || -6.2088;
    const centerLng = region?.longitude || 106.8456;
    const zoom = 14;
    
    // Convert markers to JSON for JS
    const markersJson = JSON.stringify(markers || []);
    
    const mapHtml = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes">
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            html, body { width: 100%; height: 100%; overflow: hidden; }
            #map { width: 100%; height: 100%; }
            .popup-content { min-width: 150px; }
            .popup-title { font-weight: bold; font-size: 14px; margin-bottom: 4px; }
            .popup-rating { color: #666; font-size: 12px; margin-bottom: 8px; }
            .popup-btn {
                background: #14b8a6;
                color: white;
                padding: 8px 16px;
                border-radius: 6px;
                text-align: center;
                cursor: pointer;
                font-size: 13px;
                border: none;
                display: block;
                text-decoration: none;
            }
            .popup-btn:active { background: #0d9488; }
            .star { color: #f59e0b; }
        </style>
    </head>
    <body>
        <div id="map"></div>
        <script>
            try {
                var map = L.map('map').setView([${centerLat}, ${centerLng}], ${zoom});
                
                L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    maxZoom: 19,
                    attribution: '© OpenStreetMap'
                }).addTo(map);
                
                // Add markers from React Native data
                var markersData = ${markersJson};
                if (markersData && markersData.length > 0) {
                    markersData.forEach(function(m) {
                        var lat = m.coordinate ? m.coordinate.latitude : m.latitude;
                        var lng = m.coordinate ? m.coordinate.longitude : m.longitude;
                        var title = m.title || m.description || 'Seller';
                        var rating = m.rating || 0;
                        var reviewCount = m.reviewCount || 0;
                        var id = m.id || '';
                        
                        // Create popup content
                        var stars = '';
                        for(var i=0; i<5; i++) {
                            stars += i < Math.floor(rating) ? '<span class="star">★</span>' : '<span style="color:#ddd">★</span>';
                        }
                        
                        var popupContent = '<div class="popup-content">' +
                            '<div class="popup-title">' + title + '</div>' +
                            '<div class="popup-rating">' + stars + ' (' + reviewCount + ' reviews)</div>' +
                            '<button class="popup-btn" onclick="window.ReactNativeWebView.postMessage(\\'navigate:' + id + '\\')">🧭 Go to Store</button>' +
                        '</div>';
                        
                        // Add circle marker (dot)
                        L.circleMarker([lat, lng], {
                            radius: 10,
                            fillColor: '#14b8a6',
                            color: '#0f766e',
                            weight: 2,
                            opacity: 1,
                            fillOpacity: 0.8
                        }).addTo(map).bindPopup(popupContent);
                    });
                }
                
                window.ReactNativeWebView.postMessage('mapReady');
            } catch(e) {
                document.body.innerHTML = '<div style="padding:20px;color:red;">Error: ' + e.message + '</div>';
            }
        </script>
    </body>
    </html>
    `;
    
    const handleMessage = (event) => {
        const data = event.nativeEvent.data;
        if (data && data.startsWith('navigate:')) {
            const sellerId = data.split(':')[1];
            if (onNavigate) {
                onNavigate(sellerId);
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
                javaScriptEnabled={true}
                mixedContentMode="always"
                domStorageEnabled={true}
                onMessage={handleMessage}
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
                onNavigate={onMarkerPress}
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
