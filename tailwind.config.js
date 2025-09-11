/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        'sans': ['Inter', 'system-ui', 'sans-serif'],
        'serif': ['Georgia', 'Times New Roman', 'serif'],
        'mono': ['Menlo', 'Monaco', 'monospace'],
        'display': ['Playfair Display', 'serif'],
        'body': ['Open Sans', 'sans-serif'],
      },
      colors: {
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
          hover: 'hsl(var(--primary-hover))',
          glow: 'hsl(var(--primary-glow))',
        },
        surface: {
          DEFAULT: 'hsl(var(--surface))',
          elevated: 'hsl(var(--surface-elevated))',
          hover: 'hsl(var(--surface-hover))',
        },
        foreground: {
          DEFAULT: 'hsl(var(--foreground))',
          muted: 'hsl(var(--foreground-muted))',
          subtle: 'hsl(var(--foreground-subtle))',
        },
        border: {
          DEFAULT: 'hsl(var(--border))',
          hover: 'hsl(var(--border-hover))',
        },
        success: 'hsl(var(--success))',
        warning: 'hsl(var(--warning))',
        error: 'hsl(var(--error))',
      },
      boxShadow: {
        'sm': 'var(--shadow-sm)',
        'md': 'var(--shadow-md)',
        'lg': 'var(--shadow-lg)',
        'xl': 'var(--shadow-xl)',
      },
      animation: {
        'fade-in': 'fade-in 0.3s var(--ease-out-cubic) forwards',
        'fade-out': 'fade-out 0.3s var(--ease-out-cubic) forwards',
        'scale-in': 'scale-in 0.2s var(--ease-out-cubic) forwards',
        'scale-out': 'scale-out 0.2s var(--ease-out-cubic) forwards',
        'slide-in-right': 'slide-in-right 0.3s var(--ease-out-cubic) forwards',
        'slide-in-left': 'slide-in-left 0.3s var(--ease-out-cubic) forwards',
        'bounce-in': 'bounce-in 0.4s var(--ease-out-cubic) forwards',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
      },
      transitionTimingFunction: {
        'ease-out-cubic': 'var(--ease-out-cubic)',
        'ease-in-out-cubic': 'var(--ease-in-out-cubic)',
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
    },
  },
  plugins: [],
};
