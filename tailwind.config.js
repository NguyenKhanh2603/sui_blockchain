import forms from "@tailwindcss/forms";

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ["'Sora'", "ui-sans-serif", "system-ui"],
        sans: ["'Sora'", "ui-sans-serif", "system-ui"],
      },
      colors: {
        navy: {
          50: "#f3f7ff",
          100: "#e5edff",
          200: "#c8d8ff",
          300: "#9cb8ff",
          400: "#6f93ff",
          500: "#4b74f8",
          600: "#345adf",
          700: "#2947b2",
          800: "#233b8f",
          900: "#1d316f",
        },
        graphite: "#121420",
      },
      boxShadow: {
        soft: "0 10px 40px rgba(17, 24, 39, 0.12)",
      },
    },
  },
  plugins: [
    forms({
      strategy: "class",
    }),
  ],
};
