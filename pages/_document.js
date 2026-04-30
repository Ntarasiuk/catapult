import { Head, Html, Main, NextScript } from "next/document";

const GA_TRACKING_ID = "G-QZK2D7ZVWJ";

const orgSchema = {
  "@context": "https://schema.org",
  "@type": "ProfessionalService",
  name: "Catapult",
  description:
    "Independent studio for websites, SEO, and AI consulting. We build the systems behind modern brands.",
  url: "https://devcatapult.com",
  serviceType: [
    "Web Design",
    "Web Development",
    "Search Engine Optimization",
    "AI Consulting",
  ],
  areaServed: "Worldwide",
  brand: { "@type": "Brand", name: "Catapult" },
  knowsAbout: [
    "Website design",
    "Programmatic SEO",
    "AI search optimization",
    "LLM applications",
    "Conversion optimization",
  ],
};

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Big+Shoulders+Display:wght@400;600;700;800;900&family=Space+Mono:ital,wght@0,400;0,700;1,400;1,700&display=swap"
          rel="stylesheet"
        />

        <link href="/static/favicons/favicon.ico" rel="shortcut icon" />
        <link href="/static/favicons/site.webmanifest" rel="manifest" />
        <link
          href="/static/favicons/apple-touch-icon.png"
          rel="apple-touch-icon"
          sizes="180x180"
        />
        <link
          href="/static/favicons/favicon-32x32.png"
          rel="icon"
          sizes="32x32"
          type="image/png"
        />
        <link
          href="/static/favicons/favicon-16x16.png"
          rel="icon"
          sizes="16x16"
          type="image/png"
        />
        <link
          color="#CCFF02"
          href="/static/favicons/safari-pinned-tab.svg"
          rel="mask-icon"
        />
        <meta content="#EAE6D8" name="theme-color" />
        <meta content="#EAE6D8" name="msapplication-TileColor" />
        <meta
          content="/static/favicons/browserconfig.xml"
          name="msapplication-config"
        />

        <script
          async
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_TRACKING_ID}`}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${GA_TRACKING_ID}');
            `,
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }}
        />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
