import "styles/globals.css";
import { useReportWebVitals } from "next/web-vitals";
import { JetBrains_Mono, Wix_Madefor_Text } from "next/font/google";

const sans = Wix_Madefor_Text({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-sans",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
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
    <div className={`${sans.variable} ${mono.variable} contents font-sans`}>
      <Component {...pageProps} />
    </div>
  );
}
