import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        jamia: {
          50: "#f0fdf4",
          100: "#dcfce7",
          200: "#bbf7d0",
          300: "#86efac",
          400: "#4ade80",
          500: "#10b981",
          600: "#059669",
          700: "#047857",
          800: "#065f46",
          900: "#064e3b",
          950: "#022c22",
        },
        gold: {
          50: "#fffbeb",
          100: "#fef3c7",
          200: "#fde68a",
          300: "#fcd34d",
          400: "#fbbf24",
          500: "#f59e0b",
          600: "#d97706",
          700: "#b45309",
          800: "#92400e",
          900: "#78350f",
        },
        sarkari: {
          light: "#eff6ff",
          border: "#bfdbfe",
          DEFAULT: "#2563eb",
          dark: "#1e40af",
        },
        khususi: {
          light: "#fffbeb",
          border: "#fde68a",
          DEFAULT: "#d97706",
          dark: "#92400e",
        }
      },
      fontFamily: {
        urdu: ['"Noto Nastaliq Urdu"', '"Noto Sans Arabic"', '"Jameel Noori Nastaleeq"', 'serif'],
        arabic: ['"Noto Sans Arabic"', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'jamia': '0 4px 20px -2px rgba(6, 78, 59, 0.08), 0 2px 6px -1px rgba(6, 78, 59, 0.04)',
        'jamia-lg': '0 10px 30px -4px rgba(6, 78, 59, 0.12), 0 4px 10px -2px rgba(6, 78, 59, 0.06)',
      }
    },
  },
  plugins: [],
};
export default config;
