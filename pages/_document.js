import { Head, Html, Main, NextScript } from "next/document";

const GA_TRACKING_ID = "G-QSMP2FV3Y5";

const orgSchema = {
  "@context": "https://schema.org",
  "@type": "ProfessionalService",
  "@id": "https://devcatapult.com/#organization",
  name: "Catapult",
  description:
    "Catapult builds a custom intelligence layer for each portfolio company a private-equity firm acquires. From day one of ownership the operating partner can query the company in natural language; by exit the portco is AI-native.",
  url: "https://devcatapult.com",
  image: "https://devcatapult.com/static/og.png",
  slogan: "Built for the hold period.",
  serviceType: [
    "Operational Intelligence",
    "Knowledge Graph Construction",
    "Investigation Tooling",
    "AI Implementation",
    "Value-Creation Reporting",
  ],
  areaServed: "United States",
  brand: { "@type": "Brand", name: "Catapult" },
  knowsAbout: [
    "Hold-period intelligence",
    "Private equity value creation",
    "Knowledge graph construction",
    "Retrieval-augmented generation",
    "Investigation tooling",
    "Portfolio company operations",
    "Industrial services",
    "Mechanical contracting",
    "HVAC operations",
    "Construction services",
  ],
  contactPoint: {
    "@type": "ContactPoint",
    email: "hello@devcatapult.com",
    contactType: "sales",
    availableLanguage: ["English"],
    areaServed: "United States",
  },
  sameAs: [],
};

const siteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": "https://devcatapult.com/#website",
  name: "Catapult",
  url: "https://devcatapult.com",
  description:
    "The intelligence layer for private-equity portfolio companies.",
  publisher: { "@id": "https://devcatapult.com/#organization" },
  inLanguage: "en-US",
};

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* Fonts are self-hosted via next/font in _app.js — no render-blocking
            Google Fonts request needed. */}
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
          color="#6F1D2C"
          href="/static/favicons/safari-pinned-tab.svg"
          rel="mask-icon"
        />
        <meta content="#F2ECDD" name="theme-color" />
        <meta content="#F2ECDD" name="msapplication-TileColor" />
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(siteSchema) }}
        />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
