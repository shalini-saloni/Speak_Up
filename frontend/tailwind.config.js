import colors from "tailwindcss/colors";

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Semantic aliases that map to Tailwind's default palette.
        background: colors.slate[950],
        surface: colors.slate[900],
        primary: colors.orange[500],
        "primary-light": colors.orange[400],
        accent: colors.amber[400],
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        display: ["Outfit", "sans-serif"],
      },
    },
  },
  plugins: [],
};
