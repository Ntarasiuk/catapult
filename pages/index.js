import { useState } from "react";
import AsciiField from "components/AsciiField";
import AsciiJoust from "components/AsciiJoust";
import Container from "components/Container";
import Magnetic from "components/Magnetic";
import Subscribe from "components/Subscribe";
import useReveal from "lib/useReveal";

function spotlight(e) {
  const el = e.currentTarget;
  const rect = el.getBoundingClientRect();
  el.style.setProperty("--mx", `${e.clientX - rect.left}px`);
  el.style.setProperty("--my", `${e.clientY - rect.top}px`);
}

export default function Home() {
  const [gameActive, setGameActive] = useState(false);
  return (
    <Container>
      {/* Game only mounts after the user clicks the marquee; until then,
          the hero shows the AsciiField "CATAPULT" watermark. */}
      {gameActive && <AsciiJoust startActive />}
      <Hero />
      <Marquee onActivate={() => setGameActive(true)} />
      <Services />
      <Work />
      <Manifesto />
      <Approach />
      <Contact />
    </Container>
  );
}

/* ---------- Hero ---------- */

function Hero() {
  return (
    <section
      id="top"
      className="relative px-5 md:px-10 max-w-[1440px] mx-auto pt-10 md:pt-16 pb-20 md:pb-32 overflow-hidden"
    >
      {/* Ambient ASCII watermark — passive brand decoration, replaced by the
          playable game once the user clicks the marquee strip. */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none opacity-[0.22] mix-blend-multiply animate-fade"
        style={{ animationDelay: "0.1s", animationDuration: "1.8s" }}
      >
        <AsciiField
          text="CATAPULT"
          haloRadius={14}
          disruptionRate={3}
          className="w-full h-full"
        />
      </div>

      {/* Eyebrow */}
      <div
        className="relative flex items-center justify-between gap-6 font-mono text-[11px] uppercase tracking-[0.22em] text-ink-muted animate-fade pointer-events-none"
        style={{ animationDelay: "0.05s" }}
      >
        <span className="flex items-center gap-3 font-bold">
          <span className="w-2 h-2 bg-acid block animate-pulse" aria-hidden />
          EST. 2026 / INDEPENDENT STUDIO
        </span>
        <span className="hidden md:flex items-center gap-3 font-bold">
          AVAILABLE FOR Q3 / 02 SLOTS LEFT
        </span>
      </div>

      <span
        className="rule mt-6 mb-12 md:mb-16 block animate-fade"
        style={{ animationDelay: "0.15s" }}
      />

      {/* Headline — no entrance animation: this is the LCP element, so we
          let it paint instantly. The surrounding eyebrow/sub/CTAs still
          stagger in with `animate-rise`/`animate-fade`. */}
      <h1 className="relative font-display font-black tracking-ultratight leading-[0.85] text-ink uppercase pointer-events-none">
        <span data-game-platform className="block text-[18vw] md:text-[14vw] lg:text-[12.5rem]">
          SITES THAT
        </span>
        <span className="block text-[18vw] md:text-[14vw] lg:text-[12.5rem]">
          <span data-game-platform className="bg-ink text-acid px-3 md:px-5 inline-block">
            RANK.
          </span>{" "}
          <span data-game-platform>AI</span>
        </span>
        <span data-game-platform className="block text-[18vw] md:text-[14vw] lg:text-[12.5rem]">
          THAT SHIPS.
        </span>
      </h1>

      {/* Sub */}
      <div className="grid md:grid-cols-12 gap-6 md:gap-12 mt-12 md:mt-20 pointer-events-none">
        <p
          className="md:col-start-7 md:col-span-6 text-base md:text-xl leading-relaxed text-ink font-mono max-w-2xl animate-rise"
          style={{ animationDelay: "0.95s" }}
        >
          <span className="text-ink-muted">[ &gt; ]</span> A studio for{" "}
          <span className="bg-acid px-1.5 font-bold">websites that convert</span>,{" "}
          <span className="bg-acid px-1.5 font-bold">search that ranks</span>,
          and <span className="bg-acid px-1.5 font-bold">AI that ships</span>.
          We handle the strategy, the build, and the long tail.
        </p>
      </div>

      {/* CTA */}
      <div
        className="mt-14 md:mt-20 flex flex-wrap items-center gap-5 md:gap-8 animate-rise"
        style={{ animationDelay: "1.15s" }}
      >
        <Magnetic strength={0.32} radius={140}>
          <a href="#contact" data-game-platform className="btn-acid">
            <span className="w-2 h-2 bg-ink block" aria-hidden />
            <span>Start a project</span>
            <span aria-hidden>→</span>
          </a>
        </Magnetic>
        <a href="#services" data-game-platform className="brutal-link inline-flex items-center gap-2 text-ink">
          <span>See services</span>
          <span aria-hidden>↓</span>
        </a>
      </div>

      {/* Bottom strip with stats */}
      <div className="mt-20 md:mt-28 grid grid-cols-2 md:grid-cols-4 gap-px bg-ink border-2 border-ink pointer-events-none">
        {[
          ["03", "Practices"],
          ["100%", "Custom"],
          ["2-12wk", "Engagements"],
          ["∞", "Compounding"],
        ].map(([n, label]) => (
          <div key={label} data-game-platform className="bg-bone p-5 md:p-6">
            <div className="font-display font-black text-5xl md:text-6xl leading-none tracking-ultratight text-ink">
              {n}
            </div>
            <div className="mt-3 font-mono text-[10px] md:text-[11px] uppercase tracking-[0.2em] text-ink-muted font-bold">
              {label}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ---------- Marquee strip ---------- */

function Marquee({ onActivate }) {
  const items = [
    "MARKETING SITES",
    "WEB APPS",
    "PROGRAMMATIC SEO",
    "TECHNICAL SEO",
    "AI AGENTS",
    "LLM FEATURES",
    "INTERNAL TOOLING",
    "CONVERSION DESIGN",
    "SCHEMA & STRUCTURED DATA",
    "CONTENT INFRASTRUCTURE",
    "MODEL EVALS",
    "WORKFLOW AUTOMATION",
  ];
  const doubled = [...items, ...items];
  return (
    <button
      type="button"
      onClick={onActivate}
      data-game-platform
      aria-label="Click to play Joust on this page"
      title="Click to play Joust"
      className="group relative block w-full bg-acid border-y-2 border-ink overflow-hidden cursor-pointer text-left"
    >
      <div className="marquee-track animate-marquee py-4 md:py-5 text-ink">
        {doubled.map((item, i) => (
          <span
            key={i}
            className="font-display font-black text-3xl md:text-5xl uppercase tracking-ultratight px-6 md:px-8 flex items-center gap-6 md:gap-8 whitespace-nowrap leading-none"
          >
            {item}
            <span aria-hidden className="text-ink-muted text-2xl md:text-4xl">
              ✺
            </span>
          </span>
        ))}
      </div>
      {/* Play hint — pulses softly to suggest interactivity */}
      <span className="pointer-events-none absolute right-3 md:right-5 top-1/2 -translate-y-1/2 z-10 inline-flex items-center gap-2 px-2.5 py-1 bg-ink text-acid font-mono text-[10px] md:text-[11px] uppercase tracking-[0.22em] font-bold animate-pulse">
        <span className="w-1.5 h-1.5 bg-acid block" aria-hidden />
        click to play joust
      </span>
    </button>
  );
}


/* ---------- Services ---------- */

function Services() {
  const services = [
    {
      number: "01",
      verb: "Build",
      title: "Websites & Web Apps",
      lede: "Custom marketing sites, product surfaces, and internal tools — designed for trust, speed, and conversion.",
      items: [
        "Marketing sites",
        "Product UI & dashboards",
        "Headless CMS & content infra",
        "Conversion-led design",
        "Performance & accessibility",
      ],
    },
    {
      number: "02",
      verb: "Rank",
      title: "SEO & Visibility",
      lede: "Technical SEO, programmatic content, and AI-search optimization. We make sure the right people find you — in Google and in ChatGPT.",
      items: [
        "Technical SEO audits",
        "Programmatic SEO at scale",
        "AI / LLM search optimization",
        "Schema & structured data",
        "Content & keyword strategy",
      ],
    },
    {
      number: "03",
      verb: "Automate",
      title: "AI & Systems",
      lede: "From LLM-powered features to internal automations — we ship AI that does real work, not demos.",
      items: [
        "LLM features & agents",
        "Workflow automation",
        "RAG & internal tooling",
        "Model evals & guardrails",
        "Custom integrations",
      ],
    },
  ];
  return (
    <section
      id="services"
      className="px-5 md:px-10 max-w-[1440px] mx-auto pt-28 md:pt-40"
    >
      <SectionHeader index="II" label="What we do" lines={["THREE", "PRACTICES.", "ONE STUDIO."]} />
      <div className="mt-14 md:mt-20 grid md:grid-cols-3 gap-px bg-ink border-2 border-ink">
        {services.map((s, i) => (
          <ServiceCard key={s.number} service={s} index={i} />
        ))}
      </div>
    </section>
  );
}

function ServiceCard({ service, index }) {
  const [ref, visible] = useReveal();
  return (
    <article
      ref={ref}
      onMouseMove={spotlight}
      data-game-platform
      className={`flip-card reveal-up ${
        visible ? "is-visible" : ""
      } p-7 md:p-9 lg:p-10 flex flex-col h-full`}
      style={{ transitionDelay: `${index * 110}ms` }}
    >
      <div className="flex items-baseline justify-between font-mono text-[11px] uppercase tracking-[0.22em] font-bold">
        <span className="flip-mark">{"// "}{service.number}</span>
        <span aria-hidden>—</span>
      </div>
      <div className="mt-10 md:mt-14">
        <div className="font-display font-black tracking-ultratight leading-[0.82] text-7xl md:text-[6rem] uppercase">
          {service.verb}
          <span className="flip-accent text-acid-deep">.</span>
        </div>
        <div className="mt-3 font-mono text-[11px] uppercase tracking-[0.22em] flip-mark font-bold">
          [ {service.title} ]
        </div>
      </div>
      <p className="mt-7 text-sm md:text-base leading-relaxed font-mono max-w-md">
        {service.lede}
      </p>
      <ul className="mt-8 pt-5 border-t-2 flip-rule space-y-2.5 text-sm font-mono">
        {service.items.map((item) => (
          <li key={item} className="flex items-start gap-3">
            <span className="flip-accent text-acid-deep font-bold mt-px" aria-hidden>
              →
            </span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </article>
  );
}

/* ---------- Work ---------- */

function Work() {
  return (
    <section
      id="work"
      className="px-5 md:px-10 max-w-[1440px] mx-auto pt-28 md:pt-40"
    >
      <SectionHeader index="III" label="Recent ship" lines={["RECENT", "SHIP."]} />
      <WorkCard />
    </section>
  );
}

function WorkCard() {
  const [ref, visible] = useReveal();
  return (
    <div
      ref={ref}
      data-game-platform
      className={`reveal-up ${
        visible ? "is-visible" : ""
      } mt-14 md:mt-20 border-2 border-ink bg-ink`}
    >
      {/* TOP — full-width thumbnail */}
      <a
        href="https://www.alphamechanicals.com"
        target="_blank"
        rel="noopener noreferrer"
        className="group relative block bg-ink overflow-hidden border-b-2 border-ink"
        aria-label="Visit Alpha Mechanical (opens in a new tab)"
      >
        <img
          src="/static/work/alphamechanical.webp"
          alt="Alpha Mechanical homepage — Fair Oaks' trusted HVAC experts"
          width={1600}
          height={848}
          loading="lazy"
          decoding="async"
          className="block w-full h-auto transition-transform duration-700 ease-out group-hover:scale-[1.015]"
        />
        <div className="absolute inset-0 flex items-center justify-center bg-acid/0 group-hover:bg-acid/15 transition-colors duration-300 pointer-events-none">
          <span className="opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300 inline-flex items-center gap-3 px-5 py-3 bg-acid text-ink border-2 border-ink font-mono text-[11px] font-bold uppercase tracking-[0.22em]">
            <span className="w-2 h-2 bg-ink block" aria-hidden />
            View live site
            <span aria-hidden>↗</span>
          </span>
        </div>
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between gap-3 px-4 md:px-5 py-2.5 bg-ink/85 backdrop-blur-sm font-mono text-[10px] md:text-[11px] uppercase tracking-[0.22em] font-bold text-bone">
          <span className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-acid block animate-pulse" aria-hidden />
            <span>alphamechanicals.com</span>
          </span>
          <span className="hidden sm:inline text-bone/60">{"// "}LIVE</span>
        </div>
      </a>

      {/* LIGHTHOUSE PROOF BAND — verified Google Lighthouse mobile scores */}
      <div className="border-t-2 border-ink">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-ink">
          {[
            ["99", "Performance"],
            ["100", "Accessibility"],
            ["100", "Best Practices"],
            ["100", "SEO"],
          ].map(([n, label]) => (
            <div key={label} className="bg-bone p-5 md:p-6">
              <div className="font-display font-black text-5xl md:text-6xl leading-none tracking-ultratight text-ink">
                {n}
              </div>
              <div className="mt-3 font-mono text-[10px] md:text-[11px] uppercase tracking-[0.2em] text-ink-muted font-bold">
                {label}
              </div>
            </div>
          ))}
        </div>
        <div className="border-t-2 border-ink bg-bone-soft px-5 md:px-7 lg:px-10 py-4 flex items-center justify-between gap-4">
          <span className="font-mono text-[10px] md:text-[11px] uppercase tracking-[0.22em] font-bold text-ink-muted">
            {"// "}google lighthouse — mobile, throttled
          </span>
          <a
            href="/static/images/perfect-score.webp"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 font-mono text-[10px] md:text-[11px] uppercase tracking-[0.22em] font-bold text-ink hover:text-acid-deep transition-colors"
          >
            <span>View report</span>
            <span aria-hidden>↗</span>
          </a>
        </div>
      </div>

      <div className="grid md:grid-cols-12 gap-px bg-ink border-t-2 border-ink">
      {/* LEFT — project meta */}
      <article className="bg-bone p-7 md:p-10 lg:p-12 md:col-span-7 flex flex-col">
        <div className="flex items-baseline justify-between font-mono text-[11px] uppercase tracking-[0.22em] font-bold text-ink-muted">
          <span>{"// "}01 / 01 — RECENT</span>
          <span aria-hidden>—</span>
        </div>

        <div className="mt-8 md:mt-10">
          <div className="font-display font-black uppercase tracking-ultratight leading-[0.84] text-6xl md:text-[5.5rem] lg:text-[6.5rem] text-ink">
            <span className="block">ALPHA</span>
            <span className="block">
              MECHANICAL<span className="text-acid-deep">.</span>
            </span>
          </div>
          <a
            href="https://www.alphamechanicals.com"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.22em] text-ink-muted font-bold hover:text-acid-deep transition-colors"
          >
            <span>[ alphamechanicals.com ]</span>
            <span aria-hidden>↗</span>
          </a>
        </div>

        <p className="mt-7 text-sm md:text-base leading-relaxed font-mono max-w-md text-ink">
          <span className="text-ink-muted">[ &gt; ]</span> A new marketing site
          engineered for both humans and agents. Custom build, technical SEO,
          and agent-ready content architecture — shipped at{" "}
          <span className="bg-acid px-1.5 font-bold">99 / 100 / 100 / 100</span>{" "}
          on Google Lighthouse and a perfect{" "}
          <span className="bg-acid px-1.5 font-bold">100 / Level 5</span>{" "}
          on isagentready.com.
        </p>

        <ul className="mt-8 pt-5 border-t-2 border-ink space-y-2.5 text-sm font-mono">
          {[
            "Marketing site & visual identity",
            "Technical SEO & schema",
            "Agent-ready content architecture",
            "Performance & accessibility",
          ].map((item) => (
            <li key={item} className="flex items-start gap-3">
              <span
                className="text-acid-deep font-bold mt-px"
                aria-hidden
              >
                →
              </span>
              <span>{item}</span>
            </li>
          ))}
        </ul>

        <div className="mt-10">
          <Magnetic strength={0.25} radius={120}>
            <a
              href="https://www.alphamechanicals.com"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-acid"
            >
              <span className="w-2 h-2 bg-ink block" aria-hidden />
              <span>Visit live site</span>
              <span aria-hidden>↗</span>
            </a>
          </Magnetic>
        </div>
      </article>

      {/* RIGHT — agent-ready score card */}
      <aside className="bg-bone-soft p-7 md:p-10 lg:p-12 md:col-span-5 flex flex-col">
        <div className="flex items-center justify-between font-mono text-[11px] uppercase tracking-[0.22em] font-bold text-ink-muted">
          <span>Agent-Ready Score</span>
          <span className="flex items-center gap-2">
            <span
              className="w-1.5 h-1.5 bg-acid-deep block animate-pulse"
              aria-hidden
            />
            <span className="text-ink">Verified</span>
          </span>
        </div>

        <div className="mt-6 border-2 border-ink bg-bone p-5 md:p-6 relative">
          <div className="font-display font-black tracking-ultratight leading-[0.85] text-[10rem] md:text-[12rem] text-ink">
            <span className="bg-acid inline-block px-3">100</span>
          </div>
          <div className="mt-5 flex items-center flex-wrap gap-2 font-mono text-[11px] uppercase tracking-[0.22em] font-bold">
            <span className="bg-ink text-acid px-2 py-1">LEVEL 5</span>
            <span className="text-ink">Agent-Native</span>
          </div>
        </div>

        <ul className="mt-8 space-y-0">
          {[
            ["Discoverability", "100", "3 / 3"],
            ["Content", "100", "1 / 1"],
            ["Bot Access Control", "100", "2 / 2"],
          ].map(([label, score, count]) => (
            <li
              key={label}
              className="flex items-center justify-between gap-4 border-b-2 border-ink py-3"
            >
              <div className="flex flex-col gap-1">
                <span className="font-mono text-[11px] uppercase tracking-[0.16em] font-bold text-ink">
                  {label}
                </span>
                <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-muted">
                  {count} checks
                </span>
              </div>
              <div className="font-display font-black text-4xl md:text-5xl tracking-ultratight leading-none text-ink">
                {score}
              </div>
            </li>
          ))}
        </ul>

        <div className="mt-6 font-mono text-[10px] uppercase tracking-[0.22em] text-ink-muted">
          [ Partial scan — 6 of 17 checks enabled ]
        </div>
      </aside>
      </div>
    </div>
  );
}

/* ---------- Manifesto ---------- */

function Manifesto() {
  const [ref, visible] = useReveal();
  return (
    <section className="px-5 md:px-10 max-w-[1440px] mx-auto pt-28 md:pt-40">
      <div
        ref={ref}
        className={`reveal-up ${
          visible ? "is-visible" : ""
        } grid md:grid-cols-12 gap-6 md:gap-12 items-end`}
      >
        <div className="md:col-span-3 font-mono text-[11px] uppercase tracking-[0.22em] text-ink-muted font-bold">
          §&nbsp;MANIFESTO
        </div>
        <blockquote className="md:col-span-9 font-display font-black uppercase tracking-ultratight text-4xl md:text-7xl lg:text-[5.25rem] leading-[0.95] text-ink">
          “Good consulting{" "}
          <span className="text-ink-muted">is a forcing function for</span> good
          thinking
          <span className="text-acid-deep">—</span> the deliverable is{" "}
          <span className="bg-acid text-ink px-2">clarity</span>, the artifact
          is what compounds.”
        </blockquote>
      </div>
    </section>
  );
}

/* ---------- Approach / principles ---------- */

function Approach() {
  const principles = [
    {
      n: "i",
      title: "Outcome over output",
      body: "We measure ourselves on revenue, rankings, and usage — not deliverables. If it doesn't move the number, we don't ship it.",
    },
    {
      n: "ii",
      title: "Beauty is not optional",
      body: "Pixel-level craft compounds trust. Polish is part of the function, not a finishing touch we add at the end.",
    },
    {
      n: "iii",
      title: "Ship in weeks, not quarters",
      body: "Small, opinionated teams move faster than agencies. Our default engagement is two to twelve weeks — and we keep it that way.",
    },
    {
      n: "iv",
      title: "Measure what compounds",
      body: "Every project ships with the analytics, schema, and infrastructure to keep getting better long after we hand off the keys.",
    },
  ];
  return (
    <section
      id="approach"
      className="px-5 md:px-10 max-w-[1440px] mx-auto pt-28 md:pt-40"
    >
      <SectionHeader index="IV" label="How we work" lines={["WORKING", "PRINCIPLES."]} />
      <div className="mt-14 md:mt-20 grid md:grid-cols-2 gap-px bg-ink border-2 border-ink">
        {principles.map((p, i) => (
          <Principle key={p.n} p={p} index={i} />
        ))}
      </div>
    </section>
  );
}

function Principle({ p, index }) {
  const [ref, visible] = useReveal();
  return (
    <div
      ref={ref}
      onMouseMove={spotlight}
      data-game-platform
      className={`flip-card reveal-up ${
        visible ? "is-visible" : ""
      } p-7 md:p-10 lg:p-12 relative`}
      style={{ transitionDelay: `${index * 90}ms` }}
    >
      <div className="absolute top-5 right-5 md:top-7 md:right-7 font-mono text-[10px] uppercase tracking-[0.22em] flip-mark font-bold">
        {String(index + 1).padStart(2, "0")}/04
      </div>
      <div className="font-mono text-[11px] uppercase tracking-[0.22em] flip-accent text-acid-deep font-bold">
        {"// "}{p.n}
      </div>
      <div className="mt-6 font-display font-black uppercase tracking-ultratight text-4xl md:text-[2.75rem] lg:text-[3.25rem] leading-[0.95]">
        {p.title}
      </div>
      <p className="mt-5 text-sm md:text-base leading-relaxed font-mono max-w-xl">
        {p.body}
      </p>
    </div>
  );
}

/* ---------- Contact ---------- */

function Contact() {
  return (
    <section
      id="contact"
      className="px-5 md:px-10 max-w-[1440px] mx-auto pt-28 md:pt-40"
    >
      <SectionHeader index="V" label="Start something" lines={["HAVE A", "PROJECT?"]} />
      <div className="mt-14 md:mt-20 grid md:grid-cols-12 gap-10 md:gap-16">
        <div className="md:col-span-5">
          <p className="text-base md:text-lg text-ink leading-relaxed font-mono max-w-md">
            <span className="text-ink-muted">[ &gt; ]</span> Tell us about the
            work. We&rsquo;ll reply within two business days with a take, a
            rough scope, and what it looks like to move forward.
          </p>
          <dl className="mt-10 font-mono text-[11px] uppercase tracking-[0.18em] text-ink-muted font-bold border-t-2 border-ink">
            <ContactRow label="Email">
              <a
                href="mailto:hello@devcatapult.com"
                className="text-ink hover:text-acid-deep transition-colors lowercase tracking-normal"
              >
                hello@devcatapult.com
              </a>
            </ContactRow>
            <ContactRow label="Reply">
              <span className="text-ink">~ 2 business days</span>
            </ContactRow>
            <ContactRow label="Engagements">
              <span className="text-ink">2 — 12 weeks</span>
            </ContactRow>
            <ContactRow label="Based">
              <span className="text-ink">Remote / worldwide</span>
            </ContactRow>
          </dl>
        </div>
        <div data-game-platform className="md:col-span-7 border-2 border-ink bg-bone p-6 md:p-10">
          <Subscribe />
        </div>
      </div>
    </section>
  );
}

function ContactRow({ label, children }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b-2 border-ink py-4">
      <dt>{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

/* ---------- Section header ---------- */

function SectionHeader({ index, label, lines }) {
  const [ref, visible] = useReveal();
  return (
    <div
      ref={ref}
      className={`reveal-up ${visible ? "is-visible" : ""}`}
    >
      <div className="flex items-center gap-6 font-mono text-[11px] uppercase tracking-[0.22em] text-ink font-bold">
        <span>§ {index}</span>
        <span className="flex-1 h-[2px] bg-ink" />
        <span>[ {label} ]</span>
      </div>
      <h2 className="mt-8 md:mt-10 font-display font-black uppercase tracking-ultratight leading-[0.86] text-[14vw] md:text-[8vw] lg:text-[7rem] text-ink max-w-[16ch]">
        {lines.map((line, i) => (
          <span key={i} className="block">
            {line}
          </span>
        ))}
      </h2>
    </div>
  );
}
