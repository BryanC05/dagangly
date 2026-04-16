import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../store/themeStore';
import { useTranslation } from '../hooks/useTranslation';

const STATUS_FLOW = ['pending', 'payment_pending', 'confirmed', 'preparing', 'ready', 'delivered'];

const STEP_LABELS = {
    pending: { en: 'New Order', id: 'Pesanan Baru' },
    payment_pending: { en: 'Awaiting Payment', id: 'Menunggu Pembayaran' },
    confirmed: { en: 'Paid', id: 'Terbayar' },
    preparing: { en: 'Preparing', id: 'Sedang Disiapkan' },
    ready: { en: 'Ready', id: 'Siap' },
    delivered: { en: 'Completed', id: 'Selesai' },
};

const STEP_ICONS = {
    pending: 'cart-outline',
    payment_pending: 'wallet-outline',
    confirmed: 'checkmark-circle-outline',
    preparing: 'restaurant-outline',
    ready: 'ios-bag-check-outline',
    delivered: 'ios-flag-outline',
};

const STEP_COLORS = {
    pending: { bg: '#fef3c7', text: '#92400e', line: '#d97706' },
    payment_pending: { bg: '#fef3c7', text: '#92400e', line: '#d97706' },
    confirmed: { bg: '#dbeafe', text: '#1e40af', line: '#3b82f6' },
    preparing: { bg: '#e0e7ff', text: '#3730a3', line: '#6366f1' },
    ready: { bg: '#d1fae5', text: '#065f46', line: '#10b981' },
    delivered: { bg: '#d1fae5', text: '#065f46', line: '#10b981' },
};

export default function OrderProgressStepper({ currentStatus, cancelled = false }) {
    const { colors } = useThemeStore();
    const { language, t } = useTranslation();

    const currentIndex = STATUS_FLOW.indexOf(currentStatus);
    const isCancelled = cancelled || currentStatus === 'cancelled';

    if (isCancelled) {
        return (
            <View style={[styles.container, { backgroundColor: colors?.card }]}>
                <View style={styles.cancelledContainer}>
                    <Ionicons name="close-circle" size={48} color="#ef4444" />
                    <Text style={[styles.cancelledText, { color: colors?.text }]}>
                        {language === 'id' ? 'Pesanan Dibatalkan' : 'Order Cancelled'}
                    </Text>
                </View>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: colors?.card }]}>
            <Text style={[styles.title, { color: colors?.text }]}>
                {t.orderProgress || (language === 'id' ? 'Progress Pesanan' : 'Order Progress')}
            </Text>
            {STATUS_FLOW.map((status, index) => {
                const stepColors = STEP_COLORS[status] || STEP_COLORS.pending;
                const isCompleted = index < currentIndex;
                const isCurrent = index === currentIndex;
                const isPending = index > currentIndex;

                return (
                    <View key={status} style={styles.stepContainer}>
                        <View style={styles.stepLeft}>
                            <View style={[
                                styles.iconContainer,
                                {
                                    backgroundColor: isCompleted || isCurrent ? stepColors.bg : (colors?.border || '#e5e7eb'),
                                    borderColor: isCompleted || isCurrent ? stepColors.line : 'transparent',
                                }
                            ]}>
                                {isCompleted ? (
                                    <Ionicons name="checkmark" size={16} color={stepColors.text} />
                                ) : (
                                    <Ionicons 
                                        name={STEP_ICONS[status]} 
                                        size={16} 
                                        color={isPending ? (colors?.textSecondary || '#9ca3af') : stepColors.text} 
                                    />
                                )}
                            </View>
                            {index < STATUS_FLOW.length - 1 && (
                                <View style={[
                                    styles.line,
                                    {
                                        backgroundColor: isCompleted ? stepColors.line : (colors?.border || '#e5e7eb'),
                                    }
                                ]} />
                            )}
                        </View>
                        <View style={styles.stepRight}>
                            <Text style={[
                                styles.stepLabel,
                                { 
                                    color: isPending ? (colors?.textSecondary || '#9ca3af') : colors?.text,
                                    fontWeight: isCurrent ? '700' : '500',
                                }
                            ]}>
                                {language === 'id' ? STEP_LABELS[status].id : STEP_LABELS[status].en}
                            </Text>
                            {isCurrent && (
                                <View style={[styles.currentBadge, { backgroundColor: stepColors.bg }]}>
                                    <Text style={[styles.currentBadgeText, { color: stepColors.text }]}>
                                        {language === 'id' ? 'Saat ini' : 'Current'}
                                    </Text>
                                </View>
                            )}
                        </View>
                    </View>
                );
            })}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
    },
    title: {
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 16,
    },
    stepContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        minHeight: 40,
    },
    stepLeft: {
        alignItems: 'center',
        width: 32,
    },
    iconContainer: {
        width: 28,
        height: 28,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
    },
    line: {
        width: 2,
        flex: 1,
        marginVertical: 2,
        minHeight: 20,
    },
    stepRight: {
        flex: 1,
        marginLeft: 12,
        paddingBottom: 16,
    },
    stepLabel: {
        fontSize: 14,
    },
    currentBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
        marginTop: 4,
    },
    currentBadgeText: {
        fontSize: 10,
        fontWeight: '600',
    },
    cancelledContainer: {
        alignItems: 'center',
        paddingVertical: 20,
    },
    cancelledText: {
        fontSize: 16,
        fontWeight: '600',
        marginTop: 8,
    },
});