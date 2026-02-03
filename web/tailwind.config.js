/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#5B7CFF',
        primaryDark: '#3E5BDB',
        background: '#F6F8FF',
        text: '#0F172A',
        mutedText: '#64748B',
        card: '#FFFFFF',
        borderSoft: 'rgba(15, 23, 42, 0.08)'
      },
      borderRadius: {
        xl: '1.25rem', // 20px
        '3xl': '1.5rem'
      },
      boxShadow: {
        card: '0 18px 45px rgba(15, 23, 42, 0.08)'
      }
    }
  },
  plugins: []
};

