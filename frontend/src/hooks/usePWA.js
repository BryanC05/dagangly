import { useEffect, useState } from 'react';

export function usePWA() {
  const [is_installed, setIsInstalled] = useState(false);
  const [is_pwa, setIsPWA] = useState(false);
  const [deferred_prompt, setDeferredPrompt] = useState(null);
  const [sw_version, setSwVersion] = useState(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const checkPWA = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isInWebAppiOS = (window.navigator as any).standalone === true;
      setIsPWA(isStandalone || isInWebAppiOS);
      setIsInstalled(isStandalone || isInWebAppiOS);
    };

    checkPWA();

    window.matchMedia('(display-mode: standalone)').addEventListener('change', checkPWA);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.active?.postMessage({ type: 'GET_VERSION' });
        
        navigator.serviceWorker.addEventListener('message', (event) => {
          if (event.data?.version) {
            setSwVersion(event.data.version);
          }
        });
      });
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.matchMedia('(display-mode: standalone)').removeEventListener('change', checkPWA);
    };
  }, []);

  const installPWA = async () => {
    if (!deferred_prompt) return false;

    deferred_prompt.prompt();
    
    const { outcome } = await deferred_prompt.userChoice;
    
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setIsInstalled(true);
      return true;
    }
    
    return false;
  };

  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }

    return false;
  };

  const subscribeToPush = async (token) => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VITE_PUSH_PUBLIC_KEY || ''),
      });
      
      await fetch('/api/devices/push-token', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ token: subscription.endpoint }),
      });
      
      return true;
    } catch (error) {
      console.error('Failed to subscribe to push:', error);
      return false;
    }
  };

  return {
    is_installed,
    is_pwa,
    deferred_prompt: !!deferred_prompt,
    sw_version,
    installPWA,
    requestNotificationPermission,
    subscribeToPush,
  };
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

const VITE_PUSH_PUBLIC_KEY = import.meta.env.VITE_PUSH_PUBLIC_KEY;

export default usePWA;
