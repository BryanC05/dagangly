import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Dimensions, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeStore } from '../../store/themeStore';
import { useTranslation } from '../../hooks/useTranslation';
import Map from '../../components/Map';
import { OFFLINE_TESTING_MODE } from '../../config';
import { getMockLocation, getMockSellersLocation, getMockDestination } from '../../data/mockApi';
import { getRouteCoordinates } from '../../services/routingService';

const { width, height } = Dimensions.get('window');

export default function MapViewScreen() {
    const route = useRoute();
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();
    const { colors } = useThemeStore();
    const { t } = useTranslation();
    const { location, title, subtitle, showSellers } = route.params || {};

    const [selectedSeller, setSelectedSeller] = useState(null);

    const userLocation = useMemo(() => {
        if (OFFLINE_TESTING_MODE) {
            const loc = getMockLocation();
            return { latitude: loc.latitude, longitude: loc.longitude };
        }
        return null;
    }, []);

    const mapRegion = useMemo(() => {
        if (showSellers) {
            return getMockLocation();
        }
        if (location?.coordinates) {
            return {
                latitude: location.coordinates[1],
                longitude: location.coordinates[0],
                latitudeDelta: 0.01,
                longitudeDelta: 0.01 * (width / height),
            };
        }
        if (OFFLINE_TESTING_MODE) {
            return getMockDestination();
        }
        return getMockLocation();
    }, [location, showSellers]);

    const sellersMarkers = useMemo(() => {
        if (!showSellers) return [];
        if (OFFLINE_TESTING_MODE) {
            return getMockSellersLocation();
        }
        return [];
    }, [showSellers]);

    const routePolyline = useMemo(() => {
        if (!selectedSeller || !userLocation) return [];

        const sellerLoc = selectedSeller.coordinate;
        const startLat = userLocation.latitude;
        const startLng = userLocation.longitude;
        const endLat = sellerLoc.latitude;
        const endLng = sellerLoc.longitude;

        if (OFFLINE_TESTING_MODE) {
            const points = 20;
            const routeCoords = [];

            for (let i = 0; i <= points; i++) {
                const t_factor = i / points;
                const jitter = (Math.random() - 0.5) * 0.002;

                const lat = startLat + (endLat - startLat) * t_factor + (i > 0 && i < points ? jitter : 0);
                const lng = startLng + (endLng - startLng) * t_factor + (i > 0 && i < points ? jitter : 0);

                routeCoords.push({ latitude: lat, longitude: lng });
            }

            return routeCoords;
        }

        return [];
    }, [selectedSeller, userLocation, OFFLINE_TESTING_MODE]);

    const [routeCoordinates, setRouteCoordinates] = useState([]);
    const [routeInfo, setRouteInfo] = useState(null);

    useEffect(() => {
        if (!selectedSeller || !userLocation) {
            setRouteCoordinates([]);
            setRouteInfo(null);
            return;
        }

        const fetchRoute = async () => {
            const sellerLoc = selectedSeller.coordinate;
            const result = await getRouteCoordinates(
                userLocation.latitude,
                userLocation.longitude,
                sellerLoc.latitude,
                sellerLoc.longitude
            );

            if (result && result.coordinates.length > 0) {
                setRouteCoordinates(result.coordinates);
                setRouteInfo({
                    distance: (result.distanceMeters / 1000).toFixed(1),
                    eta: Math.round(result.durationSeconds / 60),
                });
            } else {
                setRouteCoordinates(routePolyline);
                setRouteInfo(null);
            }
        };

        fetchRoute();
    }, [selectedSeller, userLocation]);

    const displayLocation = useMemo(() => {
        if (location) return location;
        if (OFFLINE_TESTING_MODE) {
            return {
                address: 'Jl. Boulevard Ahmad Yani No. 123, Summarecon Bekasi',
                coordinates: [106.8456, -6.2088],
                city: 'Bekasi',
                state: 'Jawa Barat',
            };
        }
        return null;
    }, [location]);

    const handleMarkerPress = (marker) => {
        setSelectedSeller(marker);
    };

    const handleMapPopupAction = (sellerId, action) => {
        if (action === 'clearRoute') {
            setSelectedSeller(null);
            return;
        }
        if (action === 'selected' || action === 'markerClick') {
            const seller = sellersMarkers.find(s => (s.id || s._id) === sellerId);
            if (seller) {
                setSelectedSeller(seller);
            }
            return;
        }
        const seller = sellersMarkers.find(s => (s.id || s._id) === sellerId);
        if (seller) {
            setSelectedSeller(seller);
            if (action === 'navigate') {
                const { latitude, longitude } = seller.coordinate;
                const url = Platform.OS === 'ios'
                    ? `https://maps.apple.com/?ll=${latitude},${longitude}&dirflg=r`
                    : `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&travelmode=driving`;
                Linking.openURL(url);
            } else if (action === 'store') {
                navigation.navigate('BusinessDetails', { businessId: sellerId });
            }
        }
    };

    const handleNavigateToStore = () => {
        if (selectedSeller) {
            const { latitude, longitude } = selectedSeller.coordinate;
            const url = Platform.OS === 'ios'
                ? `https://maps.apple.com/?ll=${latitude},${longitude}&dirflg=r`
                : `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&travelmode=driving`;
            Linking.openURL(url);
        }
    };

    const handleOpenInMaps = () => {
        if (displayLocation?.coordinates) {
            const lat = displayLocation.coordinates[1];
            const lng = displayLocation.coordinates[0];
            const url = Platform.OS === 'ios'
                ? `https://maps.apple.com/?ll=${lat},${lng}`
                : `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
            Linking.openURL(url);
        }
    };

    const handleGoToStore = () => {
        if (selectedSeller?.id) {
            navigation.navigate('BusinessDetails', { businessId: selectedSeller.id });
        }
    };

    const handleClearRoute = () => {
        setSelectedSeller(null);
    };

    const markers = OFFLINE_TESTING_MODE && showSellers
        ? sellersMarkers
        : (location?.coordinates
            ? [{
                id: 'location',
                coordinate: { latitude: location.coordinates[1], longitude: location.coordinates[0] },
                title: title || 'Location',
                description: subtitle || location?.address || '',
                number: 1,
            }]
            : []);

    const styles = StyleSheet.create({
        container: {
            flex: 1,
        },
        header: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderBottomWidth: 1,
        },
        backBtn: {
            width: 40,
            height: 40,
            borderRadius: 20,
            justifyContent: 'center',
            alignItems: 'center',
        },
        headerTitle: {
            fontSize: 18,
            fontWeight: '600',
        },
        headerRight: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
        },
        clearBtn: {
            width: 40,
            height: 40,
            borderRadius: 20,
            justifyContent: 'center',
            alignItems: 'center',
        },
        externalBtn: {
            width: 40,
            height: 40,
            borderRadius: 20,
            justifyContent: 'center',
            alignItems: 'center',
        },
        placeholder: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
        },
        placeholderText: {
            fontSize: 16,
            marginTop: 12,
        },
        mapContainer: {
            flex: 1,
        },
        routeInfoBar: {
            backgroundColor: '#14b8a6',
            paddingHorizontal: 16,
            paddingVertical: 10,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
        },
        routeInfoText: {
            color: '#fff',
            fontSize: 14,
            fontWeight: '500',
        },
        clearRouteBtn: {
            backgroundColor: 'rgba(255,255,255,20)',
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 16,
        },
        clearRouteText: {
            color: '#fff',
            fontSize: 12,
            fontWeight: '600',
        },
        infoCard: {
            backgroundColor: '#fff',
            borderTopWidth: 1,
            borderTopColor: '#e5e7eb',
            padding: 16,
            paddingBottom: insets.bottom + 16,
        },
        infoRow: {
            flexDirection: 'row',
            alignItems: 'flex-start',
            marginBottom: 12,
        },
        infoIcon: {
            width: 40,
            height: 40,
            borderRadius: 20,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: '#14b8a620',
            marginRight: 12,
        },
        infoContent: {
            flex: 1,
        },
        infoTitle: {
            fontSize: 16,
            fontWeight: '700',
            color: '#111',
            marginBottom: 4,
        },
        infoAddress: {
            fontSize: 14,
            color: '#666',
            lineHeight: 20,
        },
        infoCoords: {
            fontSize: 12,
            color: '#666',
            marginTop: 4,
        },
        navigateBtn: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            backgroundColor: '#14b8a6',
            paddingVertical: 12,
            borderRadius: 8,
            marginTop: 12,
        },
        navigateBtnText: {
            color: '#fff',
            fontSize: 14,
            fontWeight: '600',
        },
        sellerList: {
            backgroundColor: '#fff',
            borderTopWidth: 1,
            borderTopColor: '#e5e7eb',
            padding: 16,
            paddingBottom: insets.bottom + 16,
            maxHeight: 300,
        },
        sellerListTitle: {
            fontSize: 14,
            fontWeight: '600',
            color: '#111',
            marginBottom: 12,
        },
        sellerItem: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: 12,
            borderBottomWidth: 1,
            borderBottomColor: '#e5e7eb',
        },
        sellerItemSelected: {
            backgroundColor: '#14b8a610',
            marginHorizontal: -16,
            paddingHorizontal: 16,
            borderRadius: 8,
        },
        sellerIcon: {
            width: 40,
            height: 40,
            borderRadius: 20,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: '#14b8a620',
            marginRight: 12,
        },
        sellerInfo: {
            flex: 1,
        },
        sellerName: {
            fontSize: 15,
            fontWeight: '600',
            color: '#111',
        },
        sellerDescription: {
            fontSize: 13,
            color: '#666',
            marginTop: 2,
        },
        sellerRating: {
            flexDirection: 'row',
            alignItems: 'center',
            marginTop: 4,
        },
        sellerRatingText: {
            fontSize: 12,
            color: '#666',
            marginLeft: 4,
        },
        actionButtons: {
            flexDirection: 'row',
            gap: 8,
            marginTop: 12,
        },
        actionBtn: {
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            paddingVertical: 10,
            borderRadius: 8,
        },
        actionBtnPrimary: {
            backgroundColor: '#14b8a6',
        },
        actionBtnSecondary: {
            backgroundColor: '#14b8a620',
        },
        actionBtnText: {
            fontSize: 13,
            fontWeight: '600',
        },
        actionBtnTextPrimary: {
            color: '#fff',
        },
        actionBtnTextSecondary: {
            color: '#14b8a6',
        },
    });

    return (
        <View style={styles.container}>
            <View style={[styles.header, {
                backgroundColor: colors.card,
                paddingTop: insets.top + 12,
                borderBottomColor: colors.border
            }]}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>
                    {showSellers ? (t.nearbySellers || 'Nearby Sellers') : (t.location || 'Location')}
                </Text>
                <View style={styles.headerRight}>
                    {selectedSeller && (
                        <TouchableOpacity
                            style={styles.clearBtn}
                            onPress={handleClearRoute}
                        >
                            <Ionicons name="close" size={20} color={colors.danger} />
                        </TouchableOpacity>
                    )}
                    {displayLocation?.coordinates && (
                        <TouchableOpacity
                            style={styles.externalBtn}
                            onPress={handleOpenInMaps}
                        >
                            <Ionicons name="open-outline" size={20} color={colors.primary} />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            <View style={styles.mapContainer}>
                <Map
                    region={mapRegion}
                    markers={markers}
                    selectedMarkerId={selectedSeller?.id}
                    onMarkerPress={handleMarkerPress}
                    onNavigate={handleMapPopupAction}
                    showsUserLocation={true}
                    polylineCoordinates={routeCoordinates.length > 0 ? routeCoordinates : routePolyline}
                    polylineColor={'#14b8a6'}
                />
            </View>

            {routeInfo ? (
                <View style={styles.routeInfoBar}>
                    <Text style={styles.routeInfoText}>{routeInfo.distance} km</Text>
                    <Text style={styles.routeInfoText}>~{routeInfo.eta} min</Text>
                    <TouchableOpacity
                        style={styles.clearRouteBtn}
                        onPress={handleClearRoute}
                    >
                        <Text style={styles.clearRouteText}>Clear Route</Text>
                    </TouchableOpacity>
                </View>
            ) : routePolyline.length > 0 ? (
                <View style={styles.routeInfoBar}>
                    <Text style={styles.routeInfoText}>Route calculated</Text>
                    <TouchableOpacity
                        style={styles.clearRouteBtn}
                        onPress={handleClearRoute}
                    >
                        <Text style={styles.clearRouteText}>Clear Route</Text>
                    </TouchableOpacity>
                </View>
            ) : null}

            {showSellers ? (
                <View style={styles.sellerList}>
                    <Text style={styles.sellerListTitle}>
                        {sellersMarkers.length} {t.sellersNearby || 'sellers nearby'}
                    </Text>

                    {sellersMarkers.map((seller) => (
                        <TouchableOpacity
                            key={seller._id || seller.id}
                            style={[
                                styles.sellerItem,
                                selectedSeller?.id === seller.id && styles.sellerItemSelected,
                            ]}
                            onPress={() => handleMarkerPress(seller)}
                        >
                            <View style={styles.sellerIcon}>
                                <Ionicons name="storefront" size={20} color={colors.primary} />
                            </View>
                            <View style={styles.sellerInfo}>
                                <Text style={styles.sellerName}>{seller.title}</Text>
                                <Text style={styles.sellerDescription}>{seller.description}</Text>
                                <View style={styles.sellerRating}>
                                    <Ionicons name="star" size={14} color="#f59e0b" />
                                    <Text style={styles.sellerRatingText}>
                                        {seller.rating} ({seller.reviewCount} reviews)
                                    </Text>
                                </View>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                        </TouchableOpacity>
                    ))}

                    {selectedSeller && (
                        <View style={styles.actionButtons}>
                            <TouchableOpacity
                                style={[styles.actionBtn, styles.actionBtnPrimary]}
                                onPress={handleNavigateToStore}
                            >
                                <Ionicons name="navigate" size={18} color="#fff" />
                                <Text style={[styles.actionBtnText, styles.actionBtnTextPrimary]}>
                                    {t.navigate || 'Navigate'}
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.actionBtn, styles.actionBtnSecondary]}
                                onPress={handleGoToStore}
                            >
                                <Ionicons name="storefront" size={18} color={colors.primary} />
                                <Text style={[styles.actionBtnText, styles.actionBtnTextSecondary]}>
                                    {t.viewStore || 'View Store'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            ) : (
                <View style={styles.infoCard}>
                    <View style={styles.infoRow}>
                        <View style={styles.infoIcon}>
                            <Ionicons name="location" size={20} color={colors.primary} />
                        </View>
                        <View style={styles.infoContent}>
                            <Text style={styles.infoTitle}>
                                {title || (t.productLocation || 'Product Location')}
                            </Text>
                            <Text style={styles.infoAddress}>
                                {displayLocation?.address || t.noAddressAvailable || 'No address available'}
                            </Text>
                            {displayLocation?.coordinates && (
                                <Text style={styles.infoCoords}>
                                    {displayLocation.coordinates[1]?.toFixed(4)}, {displayLocation.coordinates[0]?.toFixed(4)}
                                </Text>
                            )}
                        </View>
                    </View>

                    <TouchableOpacity
                        style={styles.navigateBtn}
                        onPress={handleOpenInMaps}
                    >
                        <Ionicons name="navigate" size={20} color="#fff" />
                        <Text style={styles.navigateBtnText}>
                            {t.openInMaps || 'Open in Maps'}
                        </Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
}

function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function deg2rad(deg) {
    return deg * (Math.PI / 180);
}
