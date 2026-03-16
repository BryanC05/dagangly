import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAccessibilityStore = create(
  persist(
    (set) => ({
      fontSize: 'medium',
      reducedMotion: false,
      highContrast: false,

      setFontSize: (size) => set({ fontSize: size }),
      setReducedMotion: (enabled) => set({ reducedMotion: enabled }),
      setHighContrast: (enabled) => set({ highContrast: enabled }),

      getFontSizeScale: () => {
        const { fontSize } = useAccessibilityStore.getState();
        switch (fontSize) {
          case 'small': return 0.85;
          case 'large': return 1.15;
          case 'extra-large': return 1.3;
          default: return 1;
        }
      },
    }),
    {
      name: 'accessibility-storage',
    }
  )
);

if (typeof window !== 'undefined') {
  const { fontSize, reducedMotion } = useAccessibilityStore.getState();
  
  if (fontSize) {
    const scale = {
      small: 0.85,
      medium: 1,
      large: 1.15,
      'extra-large': 1.3,
    }[fontSize] || 1;
    document.documentElement.style.setProperty('--font-size-scale', scale);
  }

  const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (motionQuery.matches && !reducedMotion) {
    document.documentElement.classList.add('reduce-motion');
  }

  motionQuery.addEventListener('change', (e) => {
    if (e.matches) {
      document.documentElement.classList.add('reduce-motion');
    } else {
      document.documentElement.classList.remove('reduce-motion');
    }
  });
}
