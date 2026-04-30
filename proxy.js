import { NextResponse } from "next/server";

export const config = {
  matcher: "/",
};

const HOMEPAGE_MARKDOWN = `# Catapult

> Sites that rank. AI that ships.

Catapult is an independent studio that builds **websites that convert**, **search that ranks**, and **AI that ships**. We handle the strategy, the build, and the long tail.

- Status: Available for Q3 (2 slots left)
- Engagements: 2–12 weeks
- Site: https://devcatapult.com
- Contact: see the form at https://devcatapult.com/#contact

---

## Three practices, one studio

### 01 — Build · Websites & Web Apps

Custom marketing sites, product surfaces, and internal tools — designed for trust, speed, and conversion.

- Marketing sites
- Product UI & dashboards
- Headless CMS & content infrastructure
- Conversion-led design
- Performance & accessibility

### 02 — Rank · SEO & Visibility

Technical SEO, programmatic content, and AI-search optimization. We make sure the right people find you — in Google and in ChatGPT.

- Technical SEO audits
- Programmatic SEO at scale
- AI / LLM search optimization
- Schema & structured data
- Content & keyword strategy

### 03 — Automate · AI & Systems

From LLM-powered features to internal automations — we ship AI that does real work, not demos.

- LLM features & agents
- Workflow automation
- RAG & internal tooling
- Model evals & guardrails
- Custom integrations

---

## Recent ship

**Alpha Mechanical** — https://www.alphamechanicals.com

A new marketing site engineered for both humans and agents. Custom build, technical SEO, and agent-ready content architecture — shipped to a perfect 100 / Level 5 on isagentready.com.

Scope:

- Marketing site & visual identity
- Technical SEO & schema
- Agent-ready content architecture
- Performance & accessibility

Agent-Ready Score: 100 (Level 5 — Agent-Native). Discoverability 100 (3/3), Content 100 (1/1), Bot Access Control 100 (2/2).

---

## Contact

Start a project: https://devcatapult.com/#contact

The form on the homepage takes a name, email, project type (Website / SEO / AI / Multiple), and project details. Submissions route to the studio directly.

---

## Machine-readable surfaces

- robots.txt: https://devcatapult.com/robots.txt
- sitemap.xml: https://devcatapult.com/sitemap.xml
- This page in markdown: \`curl -H "Accept: text/markdown" https://devcatapult.com/\`
`;

const APPROX_TOKENS = Math.ceil(HOMEPAGE_MARKDOWN.length / 4);

function parseAccept(header) {
  return header.split(",").map((entry) => {
    const [rawType, ...params] = entry.trim().split(";").map((p) => p.trim());
    let q = 1;
    for (const p of params) {
      if (p.startsWith("q=")) {
        const parsed = parseFloat(p.slice(2));
        if (!Number.isNaN(parsed)) q = parsed;
      }
    }
    return { type: rawType.toLowerCase(), q };
  });
}

function prefersMarkdown(header) {
  if (!header) return false;
  const types = parseAccept(header);
  const md = types.find((t) => t.type === "text/markdown");
  if (!md || md.q <= 0) return false;
  const html = types.find((t) => t.type === "text/html");
  if (!html) return true;
  return md.q >= html.q;
}

export default function middleware(request) {
  if (request.method !== "GET" && request.method !== "HEAD") {
    return NextResponse.next();
  }
  const accept = request.headers.get("accept") || "";
  if (!prefersMarkdown(accept)) {
    return NextResponse.next();
  }
  return new NextResponse(request.method === "HEAD" ? null : HOMEPAGE_MARKDOWN, {
    status: 200,
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": "public, max-age=300, must-revalidate",
      "Vary": "Accept",
      "X-Markdown-Tokens": String(APPROX_TOKENS),
      "Link": '<https://devcatapult.com/>; rel="canonical"',
    },
  });
}
