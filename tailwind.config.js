const { fontFamily } = require("tailwindcss/defaultTheme");

module.exports = {
  content: ["./pages/**/*.js", "./components/**/*.js"],
  theme: {
    extend: {
      colors: {
        bone: {
          DEFAULT: "#EAE6D8",
          soft: "#E0DBC9",
          deep: "#D4CDB6",
        },
        ink: {
          DEFAULT: "#080808",
          soft: "#1A1A1A",
          muted: "#444444",
          /* Was #7A7368 — failed WCAG AA contrast on bone (3.62:1).
             #5A5247 lands at ~6.2:1 which clears 4.5:1 for normal text. */
          faint: "#5A5247",
        },
        acid: {
          DEFAULT: "#CCFF02",
          deep: "#A6CC02",
        },
      },
      fontFamily: {
        display: [
          "var(--font-display)",
          '"Big Shoulders Display"',
          "Impact",
          "sans-serif",
        ],
        mono: [
          "var(--font-mono)",
          '"Space Mono"',
          "ui-monospace",
          "monospace",
        ],
        sans: ["var(--font-mono)", '"Space Mono"', ...fontFamily.sans],
      },
      letterSpacing: {
        ultratight: "-0.06em",
        brutal: "-0.04em",
      },
      animation: {
        rise: "rise 0.95s cubic-bezier(0.2, 0.8, 0.2, 1) backwards",
        fade: "fade 1.4s ease-out backwards",
        marquee: "marquee 38s linear infinite",
        flicker: "flicker 6s linear infinite",
        wobble: "wobble 0.6s ease-in-out infinite",
      },
      keyframes: {
        rise: {
          "0%": { opacity: "0", transform: "translateY(34px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fade: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        flicker: {
          "0%, 95%, 100%": { opacity: "1" },
          "96%": { opacity: "0.4" },
          "97%": { opacity: "1" },
          "98%": { opacity: "0.5" },
          "99%": { opacity: "0.95" },
        },
        wobble: {
          "0%, 100%": { transform: "translate(0,0) rotate(0)" },
          "25%": { transform: "translate(1px,-1px) rotate(0.4deg)" },
          "50%": { transform: "translate(-1px,1px) rotate(-0.4deg)" },
          "75%": { transform: "translate(1px,1px) rotate(0.2deg)" },
        },
      },
    },
  },
  plugins: [],
};
