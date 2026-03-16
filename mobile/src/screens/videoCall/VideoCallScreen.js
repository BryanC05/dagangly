import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from '../hooks/useTranslation';
import { useThemeStore } from '../theme/ThemeContext';
import api from '../api/api';

const VideoCallScreen = () => {
  const { t } = useTranslation();
  const { colors } = useThemeStore();
  const [rooms, setRooms] = useState([]);
  const [upcomingCalls, setUpcomingCalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [participantId, setParticipantId] = useState('');
  const [duration, setDuration] = useState('30');

  useEffect(() => {
    fetchRooms();
    fetchUpcomingCalls();
  }, []);

  const fetchRooms = async () => {
    try {
      const res = await api.get('/video-call/rooms');
      setRooms(res.data || []);
    } catch (err) {
      console.error('Failed to fetch rooms:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUpcomingCalls = async () => {
    try {
      const res = await api.get('/video-call/upcoming');
      setUpcomingCalls(res.data || []);
    } catch (err) {
      console.error('Failed to fetch upcoming calls:', err);
    }
  };

  const handleCreateRoom = async () => {
    if (!participantId) {
      Alert.alert('Error', 'Please enter participant ID');
      return;
    }
    try {
      const res = await api.post('/video-call/room', {
        participantId,
        duration: parseInt(duration),
      });
      Alert.alert('Success', 'Room created', [
        { text: 'OK' },
        {
          text: 'Join Now',
          onPress: () => Linking.openURL(res.data.meetingUrl),
        },
      ]);
      setShowCreate(false);
      setParticipantId('');
      fetchRooms();
      fetchUpcomingCalls();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to create room');
    }
  };

  const handleJoin = (meetingUrl) => {
    Linking.openURL(meetingUrl);
  };

  const formatDate = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <Text style={styles.headerTitle}>{t('videoCall')}</Text>
      </View>

      <TouchableOpacity
        style={[styles.createButton, { backgroundColor: colors.card }]}
        onPress={() => setShowCreate(true)}
      >
        <Ionicons name="videocam" size={24} color={colors.primary} />
        <Text style={[styles.createText, { color: colors.text }]}>
          {t('newCall')}
        </Text>
        <Ionicons name="add-circle" size={24} color={colors.primary} />
      </TouchableOpacity>

      {upcomingCalls.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {t('upcomingCalls')}
          </Text>
          {upcomingCalls.map((call) => (
            <View
              key={call.roomId}
              style={[styles.callCard, { backgroundColor: colors.card }]}
            >
              <View style={styles.callInfo}>
                <Ionicons name="videocam" size={24} color={colors.primary} />
                <View style={{ marginLeft: 12 }}>
                  <Text style={[styles.callTitle, { color: colors.text }]}>
                    Video Call
                  </Text>
                  <Text style={[styles.callTime, { color: colors.textSecondary }]}>
                    {formatDate(call.scheduledAt)}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={[styles.joinButton, { backgroundColor: colors.primary }]}
                onPress={() => handleJoin(call.meetingURL)}
              >
                <Text style={styles.joinButtonText}>{t('joinCall')}</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          {t('callHistory')}
        </Text>
        {rooms.length === 0 ? (
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            {t('noCallHistory')}
          </Text>
        ) : (
          rooms.map((room) => (
            <View
              key={room.roomId}
              style={[styles.historyCard, { backgroundColor: colors.card }]}
            >
              <View style={styles.historyInfo}>
                <Ionicons
                  name="videocam"
                  size={20}
                  color={
                    room.status === 'active'
                      ? colors.success
                      : room.status === 'ended'
                      ? colors.textSecondary
                      : colors.warning
                  }
                />
                <View style={{ marginLeft: 12 }}>
                  <Text style={[styles.historyTitle, { color: colors.text }]}>
                    {room.status === 'scheduled' ? 'Scheduled Call' : 'Video Call'}
                  </Text>
                  <Text style={[styles.historyTime, { color: colors.textSecondary }]}>
                    {formatDate(room.createdAt)} - {room.duration} min
                  </Text>
                </View>
              </View>
              <View
                style={[
                  styles.statusBadge,
                  {
                    backgroundColor:
                      room.status === 'active'
                        ? colors.success + '20'
                        : room.status === 'ended'
                        ? colors.textSecondary + '20'
                        : colors.warning + '20',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.statusText,
                    {
                      color:
                        room.status === 'active'
                          ? colors.success
                          : room.status === 'ended'
                          ? colors.textSecondary
                          : colors.warning,
                    },
                  ]}
                >
                  {room.status}
                </Text>
              </View>
            </View>
          ))
        )}
      </View>

      {/* Create Room Modal */}
      <Modal visible={showCreate} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {t('createRoom')}
            </Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.input, color: colors.text }]}
              placeholder="Participant ID"
              placeholderTextColor={colors.textSecondary}
              value={participantId}
              onChangeText={setParticipantId}
            />
            <Text style={[styles.selectLabel, { color: colors.text }]}>{t('duration')}:</Text>
            <View style={styles.selectButtons}>
              {['15', '30', '45', '60'].map((d) => (
                <TouchableOpacity
                  key={d}
                  style={[
                    styles.selectButton,
                    { backgroundColor: duration === d ? colors.primary : colors.input },
                  ]}
                  onPress={() => setDuration(d)}
                >
                  <Text style={{ color: duration === d ? '#fff' : colors.text }}>
                    {d} min
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { borderColor: colors.border }]}
                onPress={() => setShowCreate(false)}
              >
                <Text style={{ color: colors.text }}>{t('cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.primary }]}
                onPress={handleCreateRoom}
              >
                <Text style={{ color: '#fff' }}>{t('create')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 24,
    paddingTop: 40,
    alignItems: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  createText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  emptyText: {
    textAlign: 'center',
    padding: 24,
  },
  callCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  callInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  callTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  callTime: {
    fontSize: 12,
    marginTop: 2,
  },
  joinButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  joinButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  historyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  historyInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  historyTitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  historyTime: {
    fontSize: 12,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 16,
  },
  modalContent: {
    borderRadius: 16,
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  input: {
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
  },
  selectLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  selectButtons: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  selectButton: {
    flex: 1,
    padding: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
  },
});

export default VideoCallScreen;
