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
        sm: "6px",
        md: "10px",
        lg: "16px",
        full: "9999px",
      }
    },
  },
  plugins: [],
}