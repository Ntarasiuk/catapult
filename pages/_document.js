import { Head, Html, Main, NextScript } from "next/document";

const GA_TRACKING_ID = "G-QZK2D7ZVWJ";

const orgSchema = {
  "@context": "https://schema.org",
  "@type": "ProfessionalService",
  "@id": "https://devcatapult.com/#organization",
  name: "Catapult",
  alternateName: "Catapult Studio",
  description:
    "Independent studio for websites, SEO, and AI consulting. We build the systems behind modern brands.",
  url: "https://devcatapult.com",
  image: "https://devcatapult.com/static/og.png",
  slogan: "Sites that rank. AI that ships.",
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
  contactPoint: {
    "@type": "ContactPoint",
    email: "hello@devcatapult.com",
    contactType: "customer support",
    availableLanguage: ["English"],
    areaServed: "Worldwide",
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
    "Independent studio for websites, SEO, and AI consulting.",
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
