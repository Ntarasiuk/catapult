import "styles/globals.css";
import { useReportWebVitals } from "next/web-vitals";
import { Big_Shoulders, Space_Mono } from "next/font/google";

/* Self-host fonts via next/font: removes the render-blocking Google Fonts
   CSS request and inlines @font-face declarations. CSS variables let
   Tailwind + globals.css pick up the resolved family name.

   Note: Google Fonts consolidated "Big Shoulders Display" into "Big Shoulders"
   as a variable font with optical-size + weight axes. */
const display = Big_Shoulders({
  subsets: ["latin"],
  /* Codebase uses only the implicit 400 (brand wordmark) and 900 (font-black
     headlines, marquee, principles, work). 700/800 not referenced — dropped
     to shave font payload and improve LCP. */
  weight: ["400", "900"],
  variable: "--font-display",
  display: "swap",
});

const mono = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  /* Italic isn't used anywhere — dropped to halve the mono font payload. */
  style: ["normal"],
  variable: "--font-mono",
  display: "swap",
});

export default function App({ Component, pageProps }) {
  useReportWebVitals(({ id, name, label, value }) => {
    if (typeof window === "undefined" || typeof window.gtag !== "function")
      return;
    window.gtag("event", name, {
      event_category:
        label === "web-vital" ? "Web Vitals" : "Next.js custom metric",
      value: Math.round(name === "CLS" ? value * 1000 : value),
      event_label: id,
      non_interaction: true,
    });
  });

  return (
    <div className={`${display.variable} ${mono.variable} contents`}>
      <Component {...pageProps} />
    </div>
  );
}
