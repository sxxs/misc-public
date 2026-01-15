/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./*.html"],
  theme: {
    extend: {
      fontFamily: {
        'sans': ['Rubik', 'system-ui', 'sans-serif'],
        'display': ['Outfit', 'system-ui', 'sans-serif'],
        'mono': ['IBM Plex Mono', 'monospace'],
      },
      colors: {
        'primary': '#FACC15',
        'primary-dark': '#EAB308',
      }
    }
  },
  plugins: [],
}
