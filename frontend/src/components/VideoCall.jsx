import { useState, useEffect, useRef } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { useVideoCallStore } from '../store/videoCallStore';
import { useAuthStore } from '../store/authStore';
import { Video, Phone, Calendar, Clock, User, X } from 'lucide-react';

const VideoCall = ({ roomId, onClose }) => {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const { currentRoom, fetchRoom, endRoom } = useVideoCallStore();
  const iframeRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (roomId) {
      fetchRoom(roomId);
    }
  }, [roomId]);

  const handleEndCall = async () => {
    if (roomId) {
      await endRoom(roomId);
    }
    if (onClose) onClose();
  };

  if (!currentRoom) {
    return (
      <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black flex flex-col z-50">
      <div className="flex items-center justify-between p-4 bg-gray-900">
        <div className="flex items-center gap-3">
          <Video className="h-5 w-5 text-white" />
          <span className="text-white font-medium">
            {currentRoom.status === 'scheduled' ? t('videoCall.scheduled') : t('videoCall.inProgress')}
          </span>
        </div>
        <button
          onClick={handleEndCall}
          className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Phone className="h-4 w-4 rotate-[135deg]" />
          {t('videoCall.endCall')}
        </button>
      </div>

      <div className="flex-1 relative">
        {currentRoom.meetingURL && (
          <iframe
            ref={iframeRef}
            src={currentRoom.meetingURL}
            className="w-full h-full border-0"
            allow="camera; microphone; display-capture; fullscreen"
            title="Video Call"
            onLoad={() => setIsLoading(false)}
          />
        )}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoCall;
