/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Space Grotesk', 'sans-serif'],
        headline: ['Space Grotesk', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
      },
      colors: {
        'concord-dark': '#000000',
        'concord-card': '#0a0a0f',
        'concord-red': '#e31e44',
        'concord-accent': '#4B018C',
        'primary': '#dab9ff',
        'secondary': '#dab9ff',
        'surface': '#050507',
      },
    }
  },
  plugins: [],
}
