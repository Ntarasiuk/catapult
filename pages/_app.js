import "styles/globals.css";
import { useReportWebVitals } from "next/web-vitals";

export default function App({ Component, pageProps }) {
  useReportWebVitals(({ id, name, label, value }) => {
    if (typeof window === "undefined" || typeof window.gtag !== "function") return;
    window.gtag("event", name, {
      event_category:
        label === "web-vital" ? "Web Vitals" : "Next.js custom metric",
      value: Math.round(name === "CLS" ? value * 1000 : value),
      event_label: id,
      non_interaction: true,
    });
  });

  return <Component {...pageProps} />;
}
