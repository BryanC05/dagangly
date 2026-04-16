import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../store/themeStore';
import { useTranslation } from '../hooks/useTranslation';

const STATUS_TIMELINES = {
    pending: { label: 'minutes', duration: 5 },
    payment_pending: { label: 'minutes', duration: 30 },
    confirmed: { label: 'minutes', duration: 15 },
    preparing: { label: 'minutes', duration: 30 },
    ready: { label: 'minutes', duration: 60 },
};

export default function OrderStatusCountdown({ status, orderDate, showProgress = true }) {
    const { colors } = useThemeStore();
    const { language } = useTranslation();
    const [timeLeft, setTimeLeft] = useState(null);
    
    const timeline = STATUS_TIMELINES[status];
    const isId = language === 'id';
    
    useEffect(() => {
        if (!timeline || !orderDate) return;
        
        const updateTimer = () => {
            const now = new Date();
            const orderTime = new Date(orderDate);
            const elapsedMinutes = Math.floor((now - orderTime) / 60000);
            const remaining = timeline.duration - elapsedMinutes;
            setTimeLeft(remaining > 0 ? remaining : 0);
        };
        
        updateTimer();
        const interval = setInterval(updateTimer, 30000);
        return () => clearInterval(interval);
    }, [status, orderDate]);
    
    if (!timeline || timeLeft === null) return null;
    
    const getProgress = () => {
        if (timeLeft === 0) return 100;
        return ((timeline.duration - timeLeft) / timeline.duration) * 100;
    };
    
    const getColor = () => {
        if (timeLeft === 0) return '#ef4444';
        if (timeLeft <= 5) return '#f97316';
        return colors.primary || '#14b8a6';
    };
    
    const formatTime = () => {
        if (timeLeft >= 60) {
            const hours = Math.floor(timeLeft / 60);
            return isId ? `${hours} jam` : `${hours}h`;
        }
        return isId ? `${timeLeft} menit` : `${timeLeft}m`;
    };
    
    return (
        <View style={styles.container}>
            <View style={styles.timerRow}>
                <Ionicons name="time-outline" size={14} color={getColor()} />
                <Text style={[styles.timerText, { color: getColor() }]}>
                    {timeLeft > 0 ? formatTime() : (isId ? 'Waktu habis' : 'Time up')}
                </Text>
            </View>
            {showProgress && (
                <View style={[styles.progressBar, { backgroundColor: colors?.input || '#e5e7eb' }]}>
                    <View 
                        style={[
                            styles.progressFill, 
                            { 
                                backgroundColor: getColor(),
                                width: `${Math.min(getProgress(), 100)}%` 
                            }
                        ]} 
                    />
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        gap: 6,
    },
    timerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    timerText: {
        fontSize: 13,
        fontWeight: '700',
    },
    progressBar: {
        height: 4,
        borderRadius: 2,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        borderRadius: 2,
    },
});