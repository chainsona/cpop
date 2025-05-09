/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  prefix: '',
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      colors: {
        border: 'var(--border)',
        input: 'var(--input)',
        ring: 'var(--ring)',
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        primary: {
          DEFAULT: 'var(--primary)',
          foreground: 'var(--primary-foreground)',
        },
        secondary: {
          DEFAULT: 'var(--secondary)',
          foreground: 'var(--secondary-foreground)',
        },
        destructive: {
          DEFAULT: 'var(--destructive)',
          foreground: 'var(--destructive-foreground)',
        },
        muted: {
          DEFAULT: 'var(--muted)',
          foreground: 'var(--muted-foreground)',
        },
        accent: {
          DEFAULT: 'var(--accent)',
          foreground: 'var(--accent-foreground)',
        },
        popover: {
          DEFAULT: 'var(--popover)',
          foreground: 'var(--popover-foreground)',
        },
        card: {
          DEFAULT: 'var(--card)',
          foreground: 'var(--card-foreground)',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'blue-radial':
          'radial-gradient(at 47% 33%, hsla(205,85%,85%,1) 0px, transparent 50%), radial-gradient(at 82% 65%, hsla(218,96%,90%,1) 0px, transparent 50%)',
        'purple-radial':
          'radial-gradient(at 40% 20%, hsla(270,100%,90%,1) 0px, transparent 50%), radial-gradient(at 80% 70%, hsla(240,100%,90%,1) 0px, transparent 50%)',
        'green-radial':
          'radial-gradient(at 60% 25%, hsla(150,100%,90%,1) 0px, transparent 50%), radial-gradient(at 20% 70%, hsla(160,100%,90%,1) 0px, transparent 50%)',
        'orange-radial':
          'radial-gradient(at 30% 40%, hsla(30,100%,90%,1) 0px, transparent 50%), radial-gradient(at 70% 60%, hsla(20,100%,90%,1) 0px, transparent 50%)',
        'pink-radial':
          'radial-gradient(at 50% 30%, hsla(330,100%,90%,1) 0px, transparent 50%), radial-gradient(at 70% 75%, hsla(320,100%,90%,1) 0px, transparent 50%)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
