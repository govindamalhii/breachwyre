/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Breachwyre cybersecurity color palette
        brand: {
          50:  '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
        cyber: {
          'dark':    '#050d1a',
          'darker':  '#030b14',
          'surface': '#0a1628',
          'card':    '#0f1f35',
          'border':  '#1a3050',
          'glow':    '#00d4ff',
          'accent':  '#7c3aed',
          'danger':  '#ef4444',
          'warning': '#f59e0b',
          'success': '#10b981',
          'text':    '#e2e8f0',
          'muted':   '#64748b',
        },
        severity: {
          'critical': '#ef4444',
          'high':     '#f97316',
          'medium':   '#f59e0b',
          'low':      '#10b981',
        }
      },
      fontFamily: {
        sans:  ['Inter', 'system-ui', 'sans-serif'],
        mono:  ['JetBrains Mono', 'Fira Code', 'monospace'],
        display: ['Outfit', 'Inter', 'sans-serif'],
      },
      backgroundImage: {
        'grid-pattern': "linear-gradient(rgba(0,212,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.03) 1px, transparent 1px)",
        'hero-gradient': "radial-gradient(ellipse at 50% 0%, rgba(124,58,237,0.15) 0%, transparent 60%), radial-gradient(ellipse at 100% 50%, rgba(0,212,255,0.08) 0%, transparent 50%)",
        'glow-radial': "radial-gradient(circle at center, rgba(0,212,255,0.15) 0%, transparent 70%)",
        'card-gradient': "linear-gradient(135deg, rgba(15,31,53,0.9) 0%, rgba(10,22,40,0.95) 100%)",
      },
      backgroundSize: {
        'grid': '40px 40px',
      },
      boxShadow: {
        'glow-cyan':    '0 0 20px rgba(0,212,255,0.3), 0 0 60px rgba(0,212,255,0.1)',
        'glow-purple':  '0 0 20px rgba(124,58,237,0.4), 0 0 60px rgba(124,58,237,0.15)',
        'glow-red':     '0 0 20px rgba(239,68,68,0.4), 0 0 60px rgba(239,68,68,0.15)',
        'glow-green':   '0 0 20px rgba(16,185,129,0.3)',
        'card':         '0 4px 24px rgba(0,0,0,0.4), 0 1px 4px rgba(0,212,255,0.05)',
        'card-hover':   '0 8px 40px rgba(0,0,0,0.5), 0 2px 8px rgba(0,212,255,0.1)',
      },
      animation: {
        'pulse-glow':   'pulseGlow 2s ease-in-out infinite',
        'scan-line':    'scanLine 3s linear infinite',
        'float':        'float 6s ease-in-out infinite',
        'fade-in':      'fadeIn 0.5s ease-out',
        'slide-up':     'slideUp 0.4s ease-out',
        'glitch':       'glitch 0.3s ease-in-out',
        'ping-slow':    'ping 2s cubic-bezier(0,0,0.2,1) infinite',
        'blink':        'blink 1s step-end infinite',
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(239,68,68,0.5), 0 0 60px rgba(239,68,68,0.2)' },
          '50%':      { boxShadow: '0 0 40px rgba(239,68,68,0.8), 0 0 100px rgba(239,68,68,0.4)' },
        },
        scanLine: {
          '0%':   { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%':      { transform: 'translateY(-10px)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        glitch: {
          '0%, 100%': { transform: 'translate(0)' },
          '20%':      { transform: 'translate(-2px, 2px)' },
          '40%':      { transform: 'translate(2px, -2px)' },
          '60%':      { transform: 'translate(-1px, 1px)' },
          '80%':      { transform: 'translate(1px, -1px)' },
        },
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0' },
        },
      },
      borderRadius: {
        'xl2': '1rem',
        'xl3': '1.5rem',
      },
      backdropBlur: {
        'xs': '2px',
      },
    },
  },
  plugins: [],
}
