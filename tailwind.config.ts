import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        forest: {
          950: "#071910",
          900: "#0c2a1c",
          800: "#13432c",
          700: "#1a5c3b",
          600: "#21754b",
          500: "#2d8a5a",
          400: "#3da870",
          100: "#ddf0e7",
          50:  "#f0faf4",
        },
        clay: {
          700: "#8c3a12",
          600: "#a84a1a",
          500: "#c45c26",
          400: "#d9783f",
          300: "#e8a87c",
          200: "#f3ceaf",
          100: "#fde9d9",
          50:  "#fff5ee",
        },
        sand: {
          50:  "#faf7f2",
          100: "#f4efe6",
          200: "#e8e0d2",
          300: "#d4c9b4",
        },
        ink: "#1a1714",
      },
      fontFamily: {
        display: ["Fraunces", "Georgia", "serif"],
        sans: ["Outfit", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 0 rgba(26,23,20,0.04), 0 12px 32px -16px rgba(12,42,28,0.18)",
        phone: "0 24px 64px -20px rgba(7,25,16,0.45)",
      },
    },
  },
  plugins: [],
};

export default config;
