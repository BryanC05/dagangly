// Design tokens matching web frontend (Tailwind CSS based)
// These are static values that don't depend on the theme store

export const tokens = {
  // Border radius matching web (--radius: 0.375rem = 6px)
  radius: {
    none: 0,
    sm: 4,
    DEFAULT: 6,
    md: 8,
    lg: 10,
    xl: 12,
    '2xl': 16,
    '3xl': 24,
    full: 9999,
  },

  // Spacing scale (4px base unit like Tailwind)
  spacing: {
    0: 0,
    0.5: 2,
    1: 4,
    1.5: 6,
    2: 8,
    2.5: 10,
    3: 12,
    4: 16,
    5: 20,
    6: 24,
    8: 32,
    10: 40,
    12: 48,
    16: 64,
  },

  // Font sizes
  fontSize: {
    xs: 11,
    sm: 12,
    base: 14,
    lg: 16,
    xl: 18,
    '2xl': 20,
    '3xl': 24,
    '4xl': 28,
    '5xl': 32,
  },

  // Font weights
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
  },

  // Line heights
  lineHeight: {
    none: 1,
    tight: 1.2,
    snug: 1.375,
    normal: 1.5,
    relaxed: 1.625,
  },

  // Shadow definitions
  shadows: {
    none: {
      shadowColor: 'transparent',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0,
      shadowRadius: 0,
      elevation: 0,
    },
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    DEFAULT: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 3,
      elevation: 2,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 6,
      elevation: 4,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.1,
      shadowRadius: 10,
      elevation: 6,
    },
    xl: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.15,
      shadowRadius: 16,
      elevation: 8,
    },
    primary: {
      shadowColor: '#06b6d4',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 4,
    },
    glow: {
      shadowColor: '#06b6d4',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.5,
      shadowRadius: 12,
      elevation: 8,
    },
  },

  // Colors (matching web CSS variables - using hex for React Native compatibility)
  colors: {
    // Light mode - matching web frontend
    light: {
      background: '#f3f5f7',
      foreground: '#1e293b',
      card: '#ffffff',
      'card-foreground': '#1e293b',
      border: '#e2e8f0',
      input: '#e2e8f0',
      primary: '#06b6d4',
      'primary-foreground': '#0f172a',
      secondary: '#e2e8f0',
      'secondary-foreground': '#1e293b',
      muted: '#f1f5f9',
      'muted-foreground': '#64748b',
      accent: '#06b6d4',
      'accent-foreground': '#0f172a',
      destructive: '#ef4444',
      'destructive-foreground': '#ffffff',
      success: '#10b981',
      'success-light': '#d1fae5',
      warning: '#f59e0b',
      'warning-light': '#fef3c7',
      danger: '#ef4444',
      'danger-light': '#fee2e2',
      ring: '#06b6d4',
      surface: '#f1f5f9',
      glow: '#06b6d4',
    },
    // Dark mode - matching web frontend
    dark: {
      background: '#0f172a',
      foreground: '#e2e8f0',
      card: '#1e293b',
      'card-foreground': '#e2e8f0',
      border: '#334155',
      input: '#334155',
      primary: '#22d3ee',
      'primary-foreground': '#0f172a',
      secondary: '#1e293b',
      'secondary-foreground': '#e2e8f0',
      muted: '#1e293b',
      'muted-foreground': '#94a3b8',
      accent: '#22d3ee',
      'accent-foreground': '#0f172a',
      destructive: '#f87171',
      'destructive-foreground': '#ffffff',
      success: '#34d399',
      'success-light': '#064e3b',
      warning: '#fbbf24',
      'warning-light': '#451a03',
      danger: '#f87171',
      'danger-light': '#450a0a',
      ring: '#22d3ee',
      surface: '#1e293b',
      glow: '#22d3ee',
    },
  },
};

// Helper to get shadow style
export const getShadow = (size = 'DEFAULT') => tokens.shadows[size] || tokens.shadows.DEFAULT;

// Helper to get spacing value
export const getSpacing = (value) => tokens.spacing[value] || value * 4;

// Helper to get radius value
export const getRadius = (value) => tokens.radius[value] || value;

// Helper to get font size
export const getFontSize = (size) => tokens.fontSize[size] || tokens.fontSize.base;

// Helper to get font weight
export const getFontWeight = (weight) => tokens.fontWeight[weight] || tokens.fontWeight.normal;
