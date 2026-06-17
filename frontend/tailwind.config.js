/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: "hsl(var(--card))",
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        surface: "hsl(var(--surface))",
        "surface-elevated": "hsl(var(--surface-elevated))",
        input: "hsl(var(--input))",
        "sidebar-background": "hsl(var(--sidebar-background))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          dark: "hsl(var(--primary-dark))",
          light: "hsl(var(--primary-light))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: "hsl(var(--accent))",
        success: "hsl(var(--success))",
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "#ffffff",
        },
        warning: "hsl(var(--warning))",
        border: "hsl(var(--border))",
        "geometric-border": "hsl(var(--geometric-border))",
        "text-tertiary": "hsl(var(--text-tertiary))",
      },
      borderRadius: {
        sm: "4px",
        md: "6px",
        lg: "10px",
        xl: "14px",
        "2xl": "18px",
        "3xl": "22px",
        full: "9999px",
      },
      borderWidth: {
        DEFAULT: "3px",
        "0": "0px",
        "1": "1px",
        "2": "2px",
        "3": "3px",
        "4": "4px",
        "6": "6px",
        "8": "8px",
      },
      boxShadow: {
        sm: "2px 2px 0px 0px #F97316",
        DEFAULT: "4px 4px 0px 0px #F97316",
        md: "4px 4px 0px 0px #F97316",
        lg: "6px 6px 0px 0px #F97316",
        xl: "8px 8px 0px 0px #F97316",
        "2xl": "12px 12px 0px 0px #F97316",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        display: ["'Bebas Neue'", "Impact", "sans-serif"],
      }
    },
  },
  plugins: [],
}