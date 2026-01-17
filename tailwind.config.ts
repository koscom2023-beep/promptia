import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class", // next-themes를 위한 클래스 기반 다크 모드
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // 넷플릭스 스타일 다크 모드 색상
        netflix: {
          black: "#000000",
          dark: "#0f172a", // slate-900
          "dark-secondary": "#1e293b", // slate-800
          "dark-tertiary": "#334155", // slate-700
          red: "#e50914",
          "red-hover": "#f40612",
        },
        background: {
          DEFAULT: "#000000",
          secondary: "#0f172a",
          tertiary: "#1e293b",
        },
        foreground: {
          DEFAULT: "#ffffff",
          secondary: "#e5e7eb",
          muted: "#9ca3af",
        },
        border: "hsl(var(--border))", // CSS 변수 사용
      },
      fontFamily: {
        sans: ["var(--font-noto-sans-kr)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
