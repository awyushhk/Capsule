/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './sidebar/**/*.{ts,tsx,html}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Capsule dark theme palette
        capsule: {
          bg: '#0A0A0A',
          surface: '#141414',
          elevated: '#1C1C1C',
          border: '#2A2A2A',
          'border-light': '#383838',
          text: '#E8E8E8',
          muted: '#888888',
          faint: '#555555',
          accent: '#FF2D2D',
          'accent-dim': '#CC2424',
          'accent-glow': 'rgba(255, 45, 45, 0.15)',
          folder: '#F5A623',
          'folder-dim': 'rgba(245, 166, 35, 0.12)',
          video: '#4FBBF0',
          'video-dim': 'rgba(79, 187, 240, 0.1)',
        },
      },
      fontFamily: {
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
        display: ['Syne', 'DM Sans', 'sans-serif'],
      },
      animation: {
        'slide-in': 'slideIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-out': 'slideOut 0.2s cubic-bezier(0.4, 0, 1, 1)',
        'fade-in': 'fadeIn 0.15s ease-out',
        'scale-in': 'scaleIn 0.15s cubic-bezier(0.16, 1, 0.3, 1)',
      },
      keyframes: {
        slideIn: {
          from: { transform: 'translateX(100%)' },
          to: { transform: 'translateX(0)' },
        },
        slideOut: {
          from: { transform: 'translateX(0)' },
          to: { transform: 'translateX(100%)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        scaleIn: {
          from: { transform: 'scale(0.95)', opacity: '0' },
          to: { transform: 'scale(1)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};
