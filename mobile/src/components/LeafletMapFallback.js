import React, { Component } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../store/themeStore';
import { useTranslation } from '../hooks/useTranslation';

const OSM_TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';

class LeafletMapFallback extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError() {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        console.warn('Map component error:', error.message);
    }

    openExternalMaps = () => {
        const { latitude, longitude, label } = this.props;
        const scheme = Platform.OS === 'ios' ? 'maps:' : 'geo:';
        const url = scheme + `?daddr=${latitude},${longitude}`;
        
        Linking.canOpenURL(url).then(supported => {
            if (supported) {
                Linking.openURL(url);
            } else {
                // Fallback to web browser
                const webUrl = `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}&zoom=16`;
                Linking.openURL(webUrl);
            }
        });
    };

    render() {
        const { latitude, longitude, markerTitle, showControls = true } = this.props;
        const { colors } = useThemeStore();
        const { t, language } = useTranslation();

        // Generate static map URL for preview image
        const staticMapUrl = `https://tile.openstreetmap.org/?lat=${latitude}&lon=${longitude}&zoom=14&mlat=${latitude}&mlon=${longitude}`;

        return (
            <View style={[styles.container, { backgroundColor: colors.card }]}>
                {/* Map Preview Area */}
                <View style={[styles.mapPreview, { backgroundColor: colors.background }]}>
                    <Text style={[styles.mapIcon]}>🗺️</Text>
                    <Text style={[styles.mapText, { color: colors.textSecondary }]}>
                        {language === 'id' ? 'Peta tidak tersedia' : 'Map not available'}
                    </Text>
                    <Text style={[styles.mapHint, { color: colors.textSecondary }]}>
                        {latitude && longitude 
                            ? `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
                            : 'No location'}
                    </Text>
                </View>

                {/* Location Info */}
                {markerTitle && (
                    <View style={styles.locationInfo}>
                        <Ionicons name="location" size={16} color={colors.primary} />
                        <Text style={[styles.locationText, { color: colors.text }]} numberOfLines={1}>
                            {markerTitle}
                        </Text>
                    </View>
                )}

                {/* Action Buttons */}
                <View style={styles.buttonRow}>
                    <TouchableOpacity 
                        style={[styles.button, { backgroundColor: colors.primary }]}
                        onPress={this.openExternalMaps}
                    >
                        <Ionicons name="navigate" size={18} color="#fff" />
                        <Text style={styles.buttonText}>
                            {language === 'id' ? 'Buka Peta' : 'Open Map'}
                        </Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                        style={[styles.button, { backgroundColor: colors.primary + '20' }]}
                        onPress={() => {
                            const url = `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}&zoom=16`;
                            Linking.openURL(url);
                        }}
                    >
                        <Ionicons name="globe" size={18} color={colors.primary} />
                        <Text style={[styles.buttonTextAlt, { color: colors.primary }]}>
                            {language === 'id' ? 'OpenStreetMap' : 'OSM'}
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Coordinates */}
                <View style={[styles.coordBox, { backgroundColor: colors.background }]}>
                    <Text style={[styles.coordLabel, { color: colors.textSecondary }]}>
                        {language === 'id' ? 'Koordinat' : 'Coordinates'}
                    </Text>
                    <Text style={[styles.coordValue, { color: colors.text }]}>
                        {latitude.toFixed(6)}, {longitude.toFixed(6)}
                    </Text>
                </View>
            </View>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        borderRadius: 12,
        padding: 12,
        overflow: 'hidden',
    },
    mapPreview: {
        height: 150,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    mapIcon: {
        fontSize: 40,
        marginBottom: 8,
    },
    mapText: {
        fontSize: 14,
        fontWeight: '500',
    },
    mapHint: {
        fontSize: 12,
        marginTop: 4,
    },
    locationInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 12,
    },
    locationText: {
        fontSize: 14,
        fontWeight: '500',
        flex: 1,
    },
    buttonRow: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 12,
    },
    button: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 12,
        borderRadius: 8,
    },
    buttonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    buttonTextAlt: {
        fontSize: 14,
        fontWeight: '600',
    },
    coordBox: {
        padding: 12,
        borderRadius: 8,
    },
    coordLabel: {
        fontSize: 11,
        marginBottom: 2,
    },
    coordValue: {
        fontSize: 14,
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    },
});

export default LeafletMapFallback;