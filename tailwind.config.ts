import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontWeight: {
        '500': '500',
        '600': '600',
        '700': '700',
        '800': '800',
      },
      fontFamily: {
        display: ["var(--font-syne)", "sans-serif"],
        body: ["var(--font-dm-sans)", "sans-serif"],
        mono: ["var(--font-jetbrains-mono)", "monospace"],
      },
      colors: {
        bg: {
          base: "#08080E",
          surface: "#0F0F1A",
          elevated: "#161625",
          border: "#1E1E30",
        },
        brand: {
          green: "#00E87A",
          "green-dim": "#00A855",
          red: "#FF4545",
          amber: "#F5A623",
        },
        text: {
          primary: "#EEEEF5",
          secondary: "#8888A8",
          muted: "#55556A",
        },
      },
      animation: {
        "fade-up": "fadeUp 0.5s ease forwards",
        "count-up": "countUp 1s ease forwards",
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
