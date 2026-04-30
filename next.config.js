const path = require("node:path");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  turbopack: {
    root: path.resolve(__dirname),
  },
  async headers() {
    const linkValue = [
      '</sitemap.xml>; rel="sitemap"; type="application/xml"',
      '</robots.txt>; rel="describedby"; type="text/plain"',
      '</>; rel="alternate"; type="text/markdown"',
    ].join(", ");
    return [
      {
        source: "/",
        headers: [
          { key: "Link", value: linkValue },
          { key: "Vary", value: "Accept" },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
