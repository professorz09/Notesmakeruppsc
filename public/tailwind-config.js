// Tailwind CSS Configuration
tailwind.config = {
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        serif: ['Merriweather', 'serif'],
      },
      colors: {
        sidebar: '#0f172a',
        paper: '#ffffff',
      },
      screens: {
        'print': {'raw': 'print'},
      }
    },
  },
}
