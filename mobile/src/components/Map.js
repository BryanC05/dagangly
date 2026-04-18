import React, { useRef, useImperativeHandle, forwardRef, Component } from 'react';
import { View, Text, Dimensions, StyleSheet, TouchableOpacity, Linking, Platform } from 'react-native';
import { useThemeStore } from '../store/themeStore';
import { useTranslation } from '../hooks/useTranslation';
import { Ionicons } from '@expo/vector-icons';
import { tokens } from '../theme/tokens';

const { width, height } = Dimensions.get('window');

// Try to import MapView - it may crash on standalone builds without a valid API key
let MapView, Marker, Circle, Polyline, PROVIDER_GOOGLE;
try {
    const maps = require('react-native-maps');
    MapView = maps.default;
    Marker = maps.Marker;
    Circle = maps.Circle;
    Polyline = maps.Polyline;
    PROVIDER_GOOGLE = maps.PROVIDER_GOOGLE;
} catch (e) {
    console.warn('Failed to load react-native-maps:', e);
    MapView = null;
    Marker = null;
    Circle = null;
    Polyline = null;
    PROVIDER_GOOGLE = null;
}

// Error boundary to catch runtime map crashes
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
 * Reusable Map Component with error handling
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
    const innerMapRef = useRef(null);
    const { colors } = useThemeStore();

    useImperativeHandle(ref, () => ({
        animateToRegion: (region, duration) => {
            innerMapRef.current?.animateToRegion(region, duration);
        },
    }));

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
        const { colors } = useThemeStore();
        const { t, language } = useTranslation();
        
        return (
            <View style={[dynamicStyles.fallbackContainer, style]}>
                <Text style={dynamicStyles.fallbackIcon}>🗺️</Text>
                <Text style={dynamicStyles.fallbackTitle}>
                    {language === 'id' ? 'Peta Tidak Tersedia' : 'Map Unavailable'}
                </Text>
                <Text style={dynamicStyles.fallbackText}>
                    {language === 'id' 
                        ? 'Google Maps API belum dikonfigurasi.\nCek app.json untuk menambahkan API key.'
                        : 'Google Maps API not configured.\nAdd your API key in app.json.'}
                </Text>
                
                {/* OpenStreetMap Fallback Button */}
                {region && (
                    <TouchableOpacity 
                        style={styles.osmButton}
                        onPress={() => {
                            const url = `https://www.openstreetmap.org/?mlat=${region.latitude}&mlon=${region.longitude}&zoom=14`;
                            Linking.openURL(url);
                        }}
                    >
                        <Ionicons name="globe-outline" size={18} color="#fff" />
                        <Text style={styles.osmButtonText}>OpenStreetMap</Text>
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
                    provider={PROVIDER_GOOGLE}
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
                    {/* Map Padding for better UI */}
                    {MapView && MapView.setMapPadding && MapView.setMapPadding(0, 0, 0, 100)}
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
