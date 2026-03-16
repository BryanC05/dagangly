import { useState, useEffect } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { useVideoCallStore } from '../store/videoCallStore';
import { useAuthStore } from '../store/authStore';
import { Video, Calendar, Clock, User, Plus, ExternalLink } from 'lucide-react';

const VideoCallPage = () => {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const {
    rooms,
    upcomingCalls,
    loading,
    fetchRooms,
    fetchUpcomingCalls,
    createRoom,
  } = useVideoCallStore();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [participantId, setParticipantId] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [duration, setDuration] = useState(30);

  useEffect(() => {
    fetchRooms();
    fetchUpcomingCalls();
  }, []);

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    const result = await createRoom(participantId, scheduledTime || null, duration);
    if (result.success) {
      setShowCreateModal(false);
      setParticipantId('');
      setScheduledTime('');
      setDuration(30);
    }
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

  const formatRelativeTime = (date) => {
    if (!date) return '';
    const now = new Date();
    const then = new Date(date);
    const diff = then - now;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} day(s)`;
    if (hours > 0) return `${hours} hour(s)`;
    return 'Soon';
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>{t('common.pleaseLogin')}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Video className="h-6 w-6" />
            {t('videoCall.title')}
          </h1>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <Plus className="h-4 w-4" />
            {t('videoCall.newCall')}
          </button>
        </div>

        {upcomingCalls.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              {t('videoCall.upcoming')}
            </h2>
            <div className="space-y-3">
              {upcomingCalls.map((call) => (
                <div
                  key={call.roomId}
                  className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <User className="h-8 w-8 text-blue-600" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {call.hostId === user._id ? 'Call with Participant' : 'Video Call'}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(call.scheduledAt)} ({formatRelativeTime(call.scheduledAt)})
                      </p>
                    </div>
                  </div>
                  <a
                    href={call.meetingURL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
                  >
                    <ExternalLink className="h-4 w-4" />
                    {t('videoCall.join')}
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {t('videoCall.history')}
          </h2>
          {rooms.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">
              {t('videoCall.noHistory')}
            </p>
          ) : (
            <div className="space-y-3">
              {rooms.map((room) => (
                <div
                  key={room.roomId}
                  className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <Video className="h-8 w-8 text-gray-400" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {room.hostId === user._id ? 'Outgoing Call' : 'Incoming Call'}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(room.createdAt)} - {room.duration} min
                      </p>
                    </div>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-sm ${
                      room.status === 'active'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : room.status === 'ended'
                        ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                    }`}
                  >
                    {room.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                {t('videoCall.createRoom')}
              </h3>
              <form onSubmit={handleCreateRoom}>
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Participant ID
                  </label>
                  <input
                    type="text"
                    value={participantId}
                    onChange={(e) => setParticipantId(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('videoCall.scheduledTime')} (Optional)
                  </label>
                  <input
                    type="datetime-local"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('videoCall.duration')} (minutes)
                  </label>
                  <select
                    value={duration}
                    onChange={(e) => setDuration(parseInt(e.target.value))}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value={15}>15 min</option>
                    <option value={30}>30 min</option>
                    <option value={45}>45 min</option>
                    <option value={60}>60 min</option>
                  </select>
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    {t('common.cancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50"
                  >
                    {loading ? t('common.loading') : t('videoCall.create')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoCallPage;
