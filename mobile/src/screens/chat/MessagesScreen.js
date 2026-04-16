import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, FlatList, TouchableOpacity, Image, StyleSheet, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import api from '../../api/api';
import { useAuthStore } from '../../store/authStore';
import { formatRelativeTime, getImageUrl } from '../../utils/helpers';
import { useTranslation } from '../../hooks/useTranslation';
import { useThemeStore } from '../../store/themeStore';
import { MessagesScreenSkeleton } from '../../components/LoadingSkeleton';

export default function MessagesScreen({ navigation }) {
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState('direct');
    const user = useAuthStore((s) => s.user);
    const { t, language } = useTranslation();
    const { colors } = useThemeStore();

    const fetchRooms = useCallback(async () => {
        try {
            const response = await api.get('/chat/rooms');
            console.log('Chat rooms response:', JSON.stringify(response.data, null, 2));
            setRooms(response.data || []);
        } catch (error) {
            console.error('Failed to fetch chat rooms:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    // Refresh when screen is focused
    useFocusEffect(
        useCallback(() => {
            fetchRooms();
        }, [fetchRooms])
    );

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchRooms();
        setRefreshing(false);
    };

    const directRooms = rooms.filter(r => !r.order);
    const orderRooms = rooms.filter(r => r.order);
    const displayedRooms = activeTab === 'direct' ? directRooms : orderRooms;

    const getAvatarUri = (profileImage) => {
        if (!profileImage) return null;
        if (profileImage.startsWith('data:')) return profileImage;
        return getImageUrl(profileImage);
    };

    const getInitials = (name) => {
        return (name || 'U').charAt(0).toUpperCase();
    };

    const getOtherParticipant = (room) => {
        if (!user) return {};
        
        const buyerId = room.buyer?._id || room.buyer;
        const sellerId = room.seller?._id || room.seller;
        
        const isBuyerMe = String(buyerId) === String(user.id);
        const isSellerMe = String(sellerId) === String(user.id);
        
        let other;
        if (isBuyerMe) {
            other = room.seller;
        } else if (isSellerMe) {
            other = room.buyer;
        } else {
            other = room.seller;
        }
        
        const otherId = other?._id || other;
        const otherName = other?.businessName || other?.name;
        const isSeller = other?.isSeller || false;
        const profileImage = other?.profileImage;
        
        return {
            _id: otherId,
            name: otherName || 'User',
            isSeller,
            profileImage,
            businessName: other?.businessName,
        };
    };

    if (loading) return <MessagesScreenSkeleton />;

    const styles = StyleSheet.create({
        container: { flex: 1, backgroundColor: colors.background },
        list: { paddingBottom: 20 },
        roomCard: {
            flexDirection: 'row', alignItems: 'center', padding: 16,
            backgroundColor: colors.card, borderBottomWidth: 1, borderColor: colors.border,
        },
        avatarContainer: {
            width: 56, height: 56, borderRadius: 28, marginRight: 12,
            justifyContent: 'center', alignItems: 'center', position: 'relative',
        },
        avatar: {
            width: 56, height: 56, borderRadius: 28, backgroundColor: colors.primary,
            justifyContent: 'center', alignItems: 'center',
        },
        avatarImage: { width: 56, height: 56, borderRadius: 28 },
        avatarText: { color: colors.white, fontWeight: '700', fontSize: 22 },
        sellerBadge: {
            position: 'absolute', bottom: 0, right: 0,
            width: 18, height: 18, borderRadius: 9,
            backgroundColor: '#10b981', justifyContent: 'center', alignItems: 'center',
            borderWidth: 2, borderColor: colors.card,
        },
        roomInfo: { flex: 1 },
        roomHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
        roomNameRow: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 8 },
        roomName: { fontSize: 15, fontWeight: '600', color: colors.text },
        sellerLabel: {
            fontSize: 10, fontWeight: '600', color: '#10b981',
            marginLeft: 6, backgroundColor: '#10b98115',
            paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4,
        },
        roomTime: { fontSize: 11, color: colors.textTertiary },
        lastMessage: { fontSize: 13, color: colors.textSecondary, lineHeight: 18 },
        productTag: {
            flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4,
            backgroundColor: colors.input, paddingHorizontal: 8, paddingVertical: 3,
            borderRadius: 8, alignSelf: 'flex-start',
        },
        productTagText: { fontSize: 10, color: colors.textSecondary },
unreadBadge: {
            width: 22, height: 22, borderRadius: 11, backgroundColor: colors.primary,
            justifyContent: 'center', alignItems: 'center', marginLeft: 8,
        },
        tabContainer: {
            flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 12,
            backgroundColor: colors.card, borderBottomWidth: 1, borderColor: colors.border,
        },
        tab: {
            flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8,
        },
        tabActive: { backgroundColor: colors.primary },
        tabText: { fontSize: 14, fontWeight: '600', color: colors.textSecondary },
        tabTextActive: { color: colors.white },
        tabBadge: {
            position: 'absolute', top: 4, right: '35%',
            minWidth: 18, height: 18, borderRadius: 9, backgroundColor: colors.danger,
            justifyContent: 'center', alignItems: 'center', paddingHorizontal: 4,
        },
        tabBadgeText: { color: colors.white, fontSize: 10, fontWeight: '700' },
        orderTag: {
            flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4,
            backgroundColor: '#3b82f615', paddingHorizontal: 8, paddingVertical: 3,
            borderRadius: 8, alignSelf: 'flex-start',
        },
        orderTagText: { fontSize: 10, color: '#3b82f6', fontWeight: '600' },
        empty: { alignItems: 'center', paddingTop: 80 },
        emptyTitle: { fontSize: 16, fontWeight: '600', color: colors.textSecondary, marginTop: 12 },
        emptyText: { fontSize: 13, color: colors.textTertiary, marginTop: 4, textAlign: 'center', paddingHorizontal: 32 },
    });

    const renderRoom = ({ item: room }) => {
        const other = getOtherParticipant(room);
        const lastMessage = room.lastMessage;
        const displayName = other?.name || 'User';
        const avatarUri = getAvatarUri(other?.profileImage);
        const isOrderChat = !!room.order;
        
        return (
            <TouchableOpacity
                style={styles.roomCard}
                onPress={() => navigation.navigate('Chat', { 
                    roomId: room._id, 
                    otherUser: other,
                    orderId: room.order?._id,
                })}
                activeOpacity={0.7}
            >
                <View style={styles.avatarContainer}>
                    {isOrderChat ? (
                        <View style={[styles.avatar, { backgroundColor: '#3b82f6' }]}>
                            <Ionicons name="receipt" size={24} color="#fff" />
                        </View>
                    ) : (
                        <>
                            {avatarUri ? (
                                <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
                            ) : (
                                <View style={styles.avatar}>
                                    <Text style={styles.avatarText}>{getInitials(displayName)}</Text>
                                </View>
                            )}
                            {other?.isSeller && (
                                <View style={styles.sellerBadge}>
                                    <Ionicons name="storefront" size={10} color="#fff" />
                                </View>
                            )}
                        </>
                    )}
                </View>
                <View style={styles.roomInfo}>
                    <View style={styles.roomHeader}>
                        <View style={styles.roomNameRow}>
                            <Text style={styles.roomName} numberOfLines={1}>
                                {isOrderChat ? (room.order?.orderId || `Order #${room.order?._id?.slice(-6)}`) : displayName}
                            </Text>
                            {!isOrderChat && other?.isSeller && (
                                <Text style={styles.sellerLabel}>{t.seller || 'Seller'}</Text>
                            )}
                            {isOrderChat && (
                                <Text style={styles.orderTagText}>{t.order || 'Order'}</Text>
                            )}
                        </View>
                        {lastMessage?.createdAt && (
                            <Text style={styles.roomTime}>{formatRelativeTime(lastMessage.createdAt)}</Text>
                        )}
                    </View>
                    <Text style={styles.lastMessage} numberOfLines={1}>
                        {lastMessage?.content || t.noMessages}
                    </Text>
                    {room.product && (
                        <View style={styles.productTag}>
                            <Ionicons name="cube-outline" size={10} color="#6b7280" />
                            <Text style={styles.productTagText} numberOfLines={1}>{room.product.name}</Text>
                        </View>
                    )}
                    {isOrderChat && (
                        <View style={styles.orderTag}>
                            <Ionicons name="receipt-outline" size={10} color="#3b82f6" />
                            <Text style={styles.orderTagText}>{room.order?.status || 'Active'}</Text>
                        </View>
                    )}
                </View>
                {room.unreadCount > 0 && (
                    <View style={styles.unreadBadge}>
                        <Text style={styles.unreadText}>{room.unreadCount}</Text>
                    </View>
                )}
            </TouchableOpacity>
        );
    };

    const directUnread = directRooms.reduce((sum, r) => sum + (r.unreadCount || 0), 0);
    const orderUnread = orderRooms.reduce((sum, r) => sum + (r.unreadCount || 0), 0);

    return (
        <View style={styles.container}>
            <View style={styles.tabContainer}>
                <TouchableOpacity 
                    style={[styles.tab, activeTab === 'direct' && styles.tabActive]}
                    onPress={() => setActiveTab('direct')}
                >
                    <Text style={[styles.tabText, activeTab === 'direct' && styles.tabTextActive]}>
                        {t.directChats || 'Direct Chats'}
                    </Text>
                    {directUnread > 0 && (
                        <View style={styles.tabBadge}>
                            <Text style={styles.tabBadgeText}>{directUnread > 9 ? '9+' : directUnread}</Text>
                        </View>
                    )}
                </TouchableOpacity>
                <TouchableOpacity 
                    style={[styles.tab, activeTab === 'order' && styles.tabActive]}
                    onPress={() => setActiveTab('order')}
                >
                    <Text style={[styles.tabText, activeTab === 'order' && styles.tabTextActive]}>
                        {t.orderChats || 'Order Chats'}
                    </Text>
                    {orderUnread > 0 && (
                        <View style={styles.tabBadge}>
                            <Text style={styles.tabBadgeText}>{orderUnread > 9 ? '9+' : orderUnread}</Text>
                        </View>
                    )}
                </TouchableOpacity>
            </View>
            <FlatList
                data={displayedRooms}
                keyExtractor={(item) => item._id}
                renderItem={renderRoom}
                contentContainerStyle={styles.list}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#14b8a6" />}
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <View style={{
                            width: 100, height: 100, borderRadius: 50,
                            backgroundColor: colors.primary + '15',
                            justifyContent: 'center', alignItems: 'center',
                            marginBottom: 16
                        }}>
                            <Ionicons name="chatbubbles" size={50} color={colors.primary} />
                        </View>
                        <Text style={styles.emptyTitle}>{t.noMessages || 'No messages yet'}</Text>
                        <Text style={styles.emptyText}>
                            {activeTab === 'direct' 
                                ? (t.noDirectChatsDesc || 'When you contact sellers about products, your conversations will appear here.')
                                : (t.noOrderChatsDesc || 'When you have order-related questions, your conversations will appear here.')
                            }
                        </Text>
                    </View>
                }
            />
        </View>
    );
}
