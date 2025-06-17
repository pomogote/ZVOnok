/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#4038FF",
        secondary: "#1F1D2B",
        accent: "#FF7A00",
        background: "#0E0E10",
        surface: "#1A1A1D",
        text: "#FFFFFF",
        muted: "#9CA3AF",
      },
      fontFamily: {
        mono: ["'Rubik Mono One'", "monospace"],
        sans: ["'Reddit Sans'", "sans-serif"],
        rubik: ["'Rubik One'", "sans-serif"],
      },
    },
  },
  plugins: [],
};