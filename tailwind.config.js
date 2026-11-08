module.exports = {
  content: ['./app/**/*.{js,jsx}', './components/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: { sans: ['Nunito', 'system-ui', 'sans-serif'] },
      boxShadow: { card: '0 8px 28px rgba(60,90,40,.09)' },
      colors: {
        pandan: { 50: '#F5F8EF', 100: '#E6EFD8', 200: '#D3E2BE', 300: '#B2CD94', 500: '#4A8C3F', 700: '#2F5D34', 900: '#173A1F' },
        kelinci: { 100: '#FBEBD3', 300: '#EBBB83', 500: '#CC8A47', 700: '#9A5E27' },
      },
    },
  },
};
