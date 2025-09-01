/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        inter: ['Inter', 'sans-serif'],
      },
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem' }],    // 12px
        'sm': ['0.875rem', { lineHeight: '1.25rem' }], // 14px
        'base': ['1rem', { lineHeight: '1.5rem' }],    // 16px
        'lg': ['1.125rem', { lineHeight: '1.75rem' }], // 18px
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],  // 20px
        '2xl': ['1.5rem', { lineHeight: '2rem' }],     // 24px
        '3xl': ['2rem', { lineHeight: '2.25rem' }],    // 32px
      },
      colors: {
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
          hover: 'hsl(var(--primary-hover))',
          glow: 'hsl(var(--primary-glow))',
          accent: 'hsl(var(--primary-accent))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          light: 'hsl(var(--secondary-light))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        surface: {
          DEFAULT: 'hsl(var(--surface))',
          elevated: 'hsl(var(--surface-elevated))',
          hover: 'hsl(var(--surface-hover))',
          glass: 'hsl(var(--surface-glass))',
        },
        foreground: {
          DEFAULT: 'hsl(var(--foreground))',
          muted: 'hsl(var(--foreground-muted))',
          subtle: 'hsl(var(--foreground-subtle))',
        },
        border: {
          DEFAULT: 'hsl(var(--border))',
          hover: 'hsl(var(--border-hover))',
          glass: 'hsl(var(--border-glass))',
        },
        success: 'hsl(var(--success))',
        warning: 'hsl(var(--warning))',
        error: 'hsl(var(--error))',
      },
      backgroundImage: {
        'gradient-primary': 'var(--gradient-primary)',
        'gradient-secondary': 'var(--gradient-secondary)',
        'gradient-glass': 'var(--gradient-glass)',
      },
      boxShadow: {
        'sm': 'var(--shadow-sm)',
        'md': 'var(--shadow-md)',
        'lg': 'var(--shadow-lg)',
        'xl': 'var(--shadow-xl)',
        'glass': 'var(--shadow-glass)',
      },
      borderRadius: {
        'xl': '0.75rem',  // 12px
        '2xl': '1rem',    // 16px
        '3xl': '1.5rem',  // 24px
      },
      animation: {
        'fade-in': 'fade-in 0.3s var(--ease-out-cubic) forwards',
        'fade-out': 'fade-out 0.3s var(--ease-out-cubic) forwards',
        'scale-in': 'scale-in 0.2s var(--ease-out-cubic) forwards',
        'scale-out': 'scale-out 0.2s var(--ease-out-cubic) forwards',
        'slide-in-right': 'slide-in-right 0.3s var(--ease-out-cubic) forwards',
        'slide-in-left': 'slide-in-left 0.3s var(--ease-out-cubic) forwards',
        'bounce-in': 'bounce-in 0.4s var(--ease-bounce) forwards',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'gradient-shift': 'gradient-shift 3s ease-in-out infinite',
      },
      transitionTimingFunction: {
        'ease-out-cubic': 'var(--ease-out-cubic)',
        'ease-in-out-cubic': 'var(--ease-in-out-cubic)',
        'ease-bounce': 'var(--ease-bounce)',
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
      backdropBlur: {
        'xs': '2px',
      },
    },
  },
  plugins: [],
};
