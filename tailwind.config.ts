import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "1rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        pageBg: "#FAEEDC", // main background
        accent: "#F9A826", // orange
        accentLight: "#FFCC70",
        textPrimary: "#1A1A1A",
        textSecondary: "#6B6B6B",
        cardBg: "#FFF7DA",
        borderRing: "#1A1A1A",
      },
      boxShadow: {
        card: "0 16px 32px rgba(0,0,0,0.07)",
        img: "0 24px 40px rgba(0,0,0,0.15)",
      },
      fontFamily: {
        heading: ["var(--font-heading)", "serif"], // Cormorant Garamond style serif
        body: ["var(--font-body)", "sans-serif"], // Inter / Poppins like
      },
      backgroundImage: {
        "hero-stripes":
          "repeating-linear-gradient(to bottom, rgba(0,0,0,0) 0px, rgba(0,0,0,0) 20px, rgba(0,0,0,0.03) 20px, rgba(0,0,0,0.03) 24px)",
        "btn-accent":
          "linear-gradient(90deg, #F9A826 0%, #FFCC70 100%)",
      },
      borderRadius: {
        pill: "9999px",
        soft: "12px",
      },
    },
  },
  plugins: [],
};
export default config;
