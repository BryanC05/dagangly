import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../store/themeStore';

const EMPTY_STATES = {
    noProducts: {
        icon: 'bag-remove-outline',
        title: 'noProductsFound',
        subtitle: 'tryDifferentSearch',
    },
    noSellers: {
        icon: 'storefront-outline',
        title: 'noSellersFound',
        subtitle: 'checkDifferentLocation',
    },
    noOrders: {
        icon: 'receipt-outline',
        title: 'noOrdersYet',
        subtitle: 'startShopping',
    },
    noSaved: {
        icon: 'heart-outline',
        title: 'noSavedProducts',
        subtitle: 'saveProductsYouLove',
    },
    noCart: {
        icon: 'cart-outline',
        title: 'cartEmpty',
        subtitle: 'addProductsToCart',
    },
    noResults: {
        icon: 'search-outline',
        title: 'noResults',
        subtitle: 'tryDifferentKeywords',
    },
    noReviews: {
        icon: 'chatbubble-outline',
        title: 'noReviewsYet',
        subtitle: 'beFirstToReview',
    },
    noNotifications: {
        icon: 'notifications-outline',
        title: 'noNotifications',
        subtitle: 'notificationsWillAppear',
    },
};

export default function EmptyState({ 
    type = 'noProducts', 
    title, 
    subtitle, 
    actionLabel, 
    onAction,
    style 
}) {
    const { colors } = useThemeStore();
    
    const emptyState = EMPTY_STATES[type] || EMPTY_STATES.noProducts;
    
    return (
        <View style={[styles.container, style]}>
            <View style={[styles.iconContainer, { backgroundColor: colors.primary + '15' }]}>
                <Ionicons 
                    name={emptyState.icon} 
                    size={48} 
                    color={colors.primary} 
                />
            </View>
            
            <Text style={[styles.title, { color: colors.text }]}>
                {title || emptyState.title}
            </Text>
            
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                {subtitle || emptyState.subtitle}
            </Text>
            
            {actionLabel && onAction && (
                <TouchableOpacity 
                    style={[styles.button, { backgroundColor: colors.primary }]}
                    onPress={onAction}
                >
                    <Text style={styles.buttonText}>{actionLabel}</Text>
                </TouchableOpacity>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
    },
    iconContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 8,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 20,
        lineHeight: 20,
    },
    button: {
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 10,
    },
    buttonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
});
