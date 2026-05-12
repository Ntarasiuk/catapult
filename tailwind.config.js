const { fontFamily } = require("tailwindcss/defaultTheme");

module.exports = {
  content: ["./pages/**/*.js", "./components/**/*.js"],
  theme: {
    extend: {
      colors: {
        /* Document palette — confidential PE memo aesthetic */
        paper: {
          DEFAULT: "#F2ECDD",
          deep: "#E8E1CE",
          shadow: "#D6CCB4",
        },
        ink: {
          DEFAULT: "#0E1726",
          soft: "#2A3242",
          muted: "#4C566A",
          faint: "#6B7184",
        },
        oxblood: {
          DEFAULT: "#6F1D2C",
          soft: "#9B3E50",
        },
        brass: {
          DEFAULT: "#B08838",
          soft: "#D4B26E",
        },
      },
      fontFamily: {
        sans: [
          "var(--font-sans)",
          '"Wix Madefor Text"',
          ...fontFamily.sans,
        ],
        mono: [
          "var(--font-mono)",
          '"JetBrains Mono"',
          "ui-monospace",
          "SFMono-Regular",
          "monospace",
        ],
      },
      letterSpacing: {
        memo: "0.22em",
        chrome: "0.28em",
      },
      animation: {
        rise: "rise 1.1s cubic-bezier(0.2, 0.8, 0.2, 1) backwards",
        fade: "fade 1.4s ease-out backwards",
        rule: "rule 1.6s cubic-bezier(0.6, 0.05, 0.2, 1) backwards",
        stamp: "stamp 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) backwards",
      },
      keyframes: {
        rise: {
          "0%": { opacity: "0", transform: "translateY(24px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fade: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        rule: {
          "0%": { transform: "scaleX(0)", transformOrigin: "left" },
          "100%": { transform: "scaleX(1)", transformOrigin: "left" },
        },
        stamp: {
          "0%": { opacity: "0", transform: "scale(1.4) rotate(-8deg)" },
          "60%": { opacity: "1", transform: "scale(0.96) rotate(-3deg)" },
          "100%": { opacity: "1", transform: "scale(1) rotate(-2deg)" },
        },
      },
    },
  },
  plugins: [],
};
