import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, Dimensions, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../store/themeStore';
import { useAuthStore } from '../store/authStore';
import { getImageUrl, formatPrice } from '../utils/helpers';
import api from '../api/api';
import { particleEvents } from './BackgroundEffect';
import { tokens } from '../theme/tokens';
import LiveStockBadge from './LiveStockBadge';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;

export default function ProductCard({ product, onPress }) {
    const { colors, isDarkMode } = useThemeStore();
    const { user, isAuthenticated } = useAuthStore();
    const imageUrl = product.images?.[0] ? getImageUrl(product.images[0]) : '';

    const productId = product._id || product.id;

    const [isSaved, setIsSaved] = useState(
        () => user?.savedProducts?.includes(productId) ?? false
    );
    const [savingLoading, setSavingLoading] = useState(false);

    const handleSavePress = async (e) => {
        if (!isAuthenticated) return;
        if (!isSaved && e?.nativeEvent) {
            particleEvents.emit('particle-burst', {
                type: 'save',
                x: e.nativeEvent.pageX,
                y: e.nativeEvent.pageY,
            });
        }
        setSavingLoading(true);
        try {
            if (isSaved) {
                await api.delete(`/users/saved-products/${productId}`);
                setIsSaved(false);
            } else {
                await api.post(`/users/saved-products/${productId}`);
                setIsSaved(true);
            }
        } catch (err) {
            console.error('Failed to toggle save:', err);
        } finally {
            setSavingLoading(false);
        }
    };

    const hasDiscount = product.originalPrice && product.originalPrice > product.price;
    const discountPercent = hasDiscount 
        ? Math.round((1 - product.price / product.originalPrice) * 100) 
        : 0;

    const dynamicStyles = {
        card: {
            width: CARD_WIDTH,
            borderRadius: 6,
            overflow: 'hidden',
            marginBottom: 12,
            backgroundColor: colors.card,
            borderWidth: 1,
            borderColor: colors.border,
            shadowColor: isDarkMode ? '#14b8a6' : '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: isDarkMode ? 0.15 : 0.08,
            shadowRadius: 8,
            elevation: 3,
        },
        imageWrapper: {
            position: 'relative',
        },
        image: {
            width: '100%',
            height: CARD_WIDTH,
            backgroundColor: isDarkMode ? '#1e293b' : '#f1f5f9',
        },
        heartBtn: {
            position: 'absolute',
            top: 8,
            right: 8,
            width: 32,
            height: 32,
            borderRadius: 16,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: colors.card + 'cc',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.1,
            shadowRadius: 2,
            elevation: 2,
        },
        discountBadge: {
            position: 'absolute',
            top: 8,
            left: 8,
            backgroundColor: '#ef4444',
            paddingHorizontal: 6,
            paddingVertical: 2,
            borderRadius: 4,
        },
        discountText: {
            color: '#fff',
            fontSize: 10,
            fontWeight: '700',
        },
        content: {
            padding: 12,
        },
        sellerName: {
            fontSize: 11,
            color: colors.textSecondary,
            marginBottom: 4,
        },
        name: {
            fontSize: 13,
            fontWeight: '600',
            marginBottom: 8,
            lineHeight: 18,
            color: colors.text,
        },
        priceRow: {
            flexDirection: 'row',
            alignItems: 'flex-end',
            gap: 6,
        },
        price: {
            fontSize: 15,
            fontWeight: '700',
            color: colors.primary,
        },
        originalPrice: {
            fontSize: 11,
            color: colors.textSecondary,
            textDecorationLine: 'line-through',
        },
        ratingRow: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 4,
            marginTop: 8,
        },
        starIcon: {
            color: colors.primary,
        },
        rating: {
            fontSize: 11,
            fontWeight: '600',
            color: colors.textSecondary,
        },
    };

    return (
        <TouchableOpacity
            style={dynamicStyles.card}
            onPress={onPress}
            activeOpacity={0.9}
        >
            <View style={dynamicStyles.imageWrapper}>
                {imageUrl ? (
                    <Image
                        source={{ uri: imageUrl }}
                        style={dynamicStyles.image}
                        resizeMode="cover"
                    />
                ) : (
                    <View style={dynamicStyles.image} />
                )}
                {hasDiscount && (
                    <View style={dynamicStyles.discountBadge}>
                        <Text style={dynamicStyles.discountText}>-{discountPercent}%</Text>
                    </View>
                )}
                {isAuthenticated && (
                    <TouchableOpacity
                        style={dynamicStyles.heartBtn}
                        onPress={handleSavePress}
                        disabled={savingLoading}
                        activeOpacity={0.8}
                    >
                        <Ionicons
                            name={isSaved ? 'heart' : 'heart-outline'}
                            size={16}
                            color={isSaved ? '#ef4444' : colors.textSecondary}
                        />
                    </TouchableOpacity>
                )}
            </View>
            <View style={dynamicStyles.content}>
                {/* Business Info with Logo */}
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                    {product.business?.logoInfo?.url && (
                        <Image
                            source={{ uri: product.business.logoInfo.url }}
                            style={{ width: 16, height: 16, borderRadius: 8, marginRight: 6, borderWidth: 1, borderColor: colors.border }}
                            resizeMode="cover"
                        />
                    )}
                    <Text style={dynamicStyles.sellerName} numberOfLines={1}>
                        {product.business?.name || product.seller?.name || product.seller?.location?.city || 'UMKM'}
                    </Text>
                </View>
                <Text style={dynamicStyles.name} numberOfLines={2}>
                    {product.name}
                </Text>
                <View style={dynamicStyles.priceRow}>
                    <Text style={dynamicStyles.price}>{formatPrice(product.price)}</Text>
                    {hasDiscount && (
                        <Text style={dynamicStyles.originalPrice}>
                            {formatPrice(product.originalPrice)}
                        </Text>
                    )}
                </View>
                <View style={dynamicStyles.ratingRow}>
                    <Ionicons name="star" size={12} style={dynamicStyles.starIcon} fill={colors.primary} />
                    <Text style={dynamicStyles.rating}>
                        {product.rating ? product.rating.toFixed(1) : '4.5'} ({product.reviewCount || 0})
                    </Text>
                </View>
                <LiveStockBadge stock={product.stock || 0} />
            </View>
        </TouchableOpacity>
    );
}
