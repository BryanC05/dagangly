import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet,
    KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { io } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import api from '../../api/api';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import { SOCKET_URL } from '../../config';
import { formatTime } from '../../utils/helpers';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function ChatScreen({ route, navigation }) {
    const { roomId: initialRoomId, sellerId, otherUser, productName, productId } = route.params || {};
    const { colors } = useThemeStore();
    const [messages, setMessages] = useState([]);
    const [message, setMessage] = useState('');
    const [roomId, setRoomId] = useState(initialRoomId);
    const [loading, setLoading] = useState(true);
    const socketRef = useRef(null);
    const flatListRef = useRef(null);
    const user = useAuthStore((s) => s.user);

    // Set title with subtitle
    useEffect(() => {
        navigation.setOptions({
            title: otherUser?.name || 'Chat',
            headerTitle: () => (
                <View style={{ alignItems: 'center' }}>
                    <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text }}>
                        {otherUser?.name || 'Chat'}
                    </Text>
                    {productName && (
                        <Text style={{ fontSize: 11, color: colors.textSecondary, marginTop: 1 }}>
                            {productName}
                        </Text>
                    )}
                </View>
            ),
        });
    }, [otherUser, productName, navigation, colors]);

    // Create room immediately if we have sellerId but no roomId
    useEffect(() => {
        const createRoomIfNeeded = async () => {
            // Only create room if we don't have one and we have a sellerId
            if (!roomId && sellerId) {
                try {
                    const roomRes = await api.post('/chat/rooms/direct', { sellerId });
                    if (roomRes.data?._id) {
                        setRoomId(roomRes.data._id);
                    }
                } catch (error) {
                    console.error('Failed to create chat room:', error);
                    setLoading(false);
                }
            } else if (roomId) {
                // If we already have a roomId, just set loading to false
                setLoading(false);
            }
        };
        createRoomIfNeeded();
    }, [sellerId, roomId]);

    // Fetch initial messages if we already have a roomId
    useEffect(() => {
        const initChat = async () => {
            if (roomId) {
                try {
                    const msgResponse = await api.get(`/chat/rooms/${roomId}/messages`);
                    setMessages((msgResponse.data || []).reverse());
                } catch (error) {
                    console.error('Failed to init chat:', error);
                }
            }
            setLoading(false);
        };
        initChat();
    }, [roomId]);

    // Socket.io connection
    useEffect(() => {
        if (!roomId) return;

        const connectSocket = async () => {
            const token = await SecureStore.getItemAsync('token');
            const socket = io(SOCKET_URL, {
                auth: { token },
                transports: ['websocket', 'polling'],
            });

            socket.on('connect', () => {
                socket.emit('join-room', roomId);
            });

            socket.on('receive-message', (newMessage) => {
                setMessages((prev) => [newMessage, ...prev]);
            });

            socketRef.current = socket;
        };

        connectSocket();

        return () => {
            if (socketRef.current) {
                socketRef.current.emit('leave-room', roomId);
                socketRef.current.disconnect();
            }
        };
    }, [roomId]);

    const sendMessage = async () => {
        if (!message.trim()) return;

        try {
            let currentRoomId = roomId;

            // If we don't have a room yet, create one now with the seller
            if (!currentRoomId && sellerId) {
                const roomRes = await api.post('/chat/rooms/direct', { sellerId });
                currentRoomId = roomRes.data._id;
                setRoomId(currentRoomId);
            }

            if (!currentRoomId) return; // Still failed to get a room

            const response = await api.post(`/chat/rooms/${currentRoomId}/messages`, {
                content: message.trim(),
            });

            const newMsg = response.data;
            setMessages((prev) => [newMsg, ...prev]);

            // Emit via socket for real-time delivery
            if (socketRef.current) {
                socketRef.current.emit('send-message', {
                    roomId: currentRoomId,
                    message: newMsg,
                });
            }

            setMessage('');
        } catch (error) {
            console.error('Failed to send message:', error);
        }
    };

    const getSenderId = (msg) => {
        if (!msg.sender) return null;
        if (typeof msg.sender === 'object' && msg.sender._id) {
            return msg.sender._id;
        }
        if (typeof msg.sender === 'string') {
            return msg.sender;
        }
        return null;
    };

    const renderMessage = ({ item: msg }) => {
        const senderId = getSenderId(msg);
        const userId = user?.id;
        const isMe = senderId === userId || senderId === String(userId);
        return (
            <View style={[styles.msgRow, isMe && styles.msgRowMe]}>
                <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleOther]}>
                    <Text style={[styles.msgText, isMe && styles.msgTextMe]}>{msg.content}</Text>
                    <Text style={[styles.msgTime, isMe && styles.msgTimeMe]}>
                        {formatTime(msg.createdAt)}
                    </Text>
                </View>
            </View>
        );
    };

    if (loading) return <LoadingSpinner />;

    const styles = StyleSheet.create({
        container: { flex: 1, backgroundColor: colors.background },
        messageList: { padding: 16, paddingBottom: 8 },
        msgRow: { marginBottom: 8, alignItems: 'flex-start' },
        msgRowMe: { alignItems: 'flex-end' },
        bubble: { maxWidth: '78%', padding: 12, borderRadius: 16 },
        bubbleMe: { backgroundColor: colors.primary, borderBottomRightRadius: 4 },
        bubbleOther: {
            backgroundColor: colors.card, borderBottomLeftRadius: 4,
            shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.05, shadowRadius: 2, elevation: 1,
        },
        msgText: { fontSize: 14, color: colors.text, lineHeight: 20 },
        msgTextMe: { color: colors.white },
        msgTime: { fontSize: 10, color: colors.textTertiary, marginTop: 4, alignSelf: 'flex-end' },
        msgTimeMe: { color: 'rgba(255,255,255,0.7)' },
        empty: { alignItems: 'center', justifyContent: 'center', paddingTop: 40, transform: [{ scaleY: -1 }] },
        emptyText: { fontSize: 14, color: colors.textTertiary },
        inputBar: {
            flexDirection: 'row', alignItems: 'flex-end', padding: 12, paddingBottom: 90,
            backgroundColor: colors.card, borderTopWidth: 1, borderColor: colors.border, gap: 10,
        },
        textInput: {
            flex: 1, backgroundColor: colors.input, borderRadius: 20, paddingHorizontal: 16,
            paddingVertical: 10, fontSize: 14, color: colors.text, maxHeight: 100,
        },
        sendBtn: {
            width: 42, height: 42, borderRadius: 21, backgroundColor: colors.primary,
            justifyContent: 'center', alignItems: 'center',
        },
        sendBtnDisabled: { backgroundColor: colors.textTertiary },
    });

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={90}
        >
            <FlatList
                ref={flatListRef}
                data={messages}
                keyExtractor={(item) => item._id || String(Math.random())}
                renderItem={renderMessage}
                inverted
                contentContainerStyle={styles.messageList}
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <Text style={styles.emptyText}>Start the conversation!</Text>
                    </View>
                }
            />

            <View style={styles.inputBar}>
                <TextInput
                    style={styles.textInput}
                    value={message}
                    onChangeText={setMessage}
                    placeholder="Type a message..."
                    placeholderTextColor="#9ca3af"
                    multiline
                    maxLength={1000}
                />
                <TouchableOpacity
                    style={[styles.sendBtn, !message.trim() && styles.sendBtnDisabled]}
                    onPress={sendMessage}
                    disabled={!message.trim()}
                >
                    <Ionicons name="send" size={20} color="#fff" />
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
}
