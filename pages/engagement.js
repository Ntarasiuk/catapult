import Link from "next/link";
import Container from "components/Container";
import useReveal from "lib/useReveal";

const PROBLEMS = [
  {
    stat: "$2–5M",
    unit: "per cut",
    name: "Legacy knowledge",
    body: "The 20-year service tech who knows which customers tolerate price increases. The admin who's load-bearing on the legacy ERP. Cut blindly, lose silently.",
  },
  {
    stat: "20–30%",
    unit: "attrition",
    name: "The Rolodex walks",
    body: "Top performers churn during the chaos and take their relationships with them. Their replacements take eighteen months to ramp.",
  },
  {
    stat: "$10M+",
    unit: "at exit",
    name: "Multiple compression",
    body: "A company that's been hollowed out trades for a lower multiple. The cuts captured savings but destroyed value the buyer was paying for.",
  },
];

const BLUNT = [
  "Cut 15% across the board",
  "Captures obvious savings",
  "Destroys load-bearing roles you couldn't see",
  "Top performers churn from the chaos",
  "Multiple compresses at exit",
];

const NUANCED = [
  "Cut the right 15%",
  "Keep the $80K admin running everything",
  "Cut the $200K director who isn't load-bearing",
  "Retain top performers with targeted incentives",
  "Renegotiate vendors instead of replacing them",
];

const PHASES = [
  {
    n: "01",
    name: "Diligence",
    body: "Bid with eyes open. Ingest the data room, surface deal-killers and pricing levers the deal team would miss.",
  },
  {
    n: "02",
    name: "100-Day",
    body: "Preserve what matters. Make the company legible. Cut waste, keep load-bearing people, retain the right talent.",
  },
  {
    n: "03",
    name: "Transform",
    body: "AI-first operations. The knowledge graph becomes the substrate for sales, service, and finance copilots.",
  },
  {
    n: "04",
    name: "Exit",
    body: "Premium multiple. An operationally legible company commands a higher multiple. The data room writes itself.",
  },
];

const DILIGENCE_FINDS = [
  {
    name: "Hidden contract risk",
    body: "Auto-escalators, exclusivity clauses, change-of-control triggers.",
  },
  {
    name: "Customer concentration signals",
    body: "Churn risk in support tickets, expiring contracts, sentiment trends.",
  },
  {
    name: "Vendor and SaaS bloat",
    body: "Duplicate tools, off-contract spend, auto-renewals nobody's watching.",
  },
  {
    name: "Workforce dynamics",
    body: "Span-of-control anomalies, comp drift, retention risk by role.",
  },
];

const QUERIES = [
  "Which employees show up most in cross-functional Slack threads about critical customers?",
  "Show me every vendor contract with a price increase above 8% in the last 18 months.",
  "Which roles are mentioned in our top 20 customers' email threads — and what happens if they leave?",
  "Rank our SaaS spend by actual usage data, not seat count.",
];

const VS_LEFT = [
  ["Pre-built tools", "generic copilots, retrofitted to your data"],
  ["12-month “data readiness” engagement first", "before any real work begins"],
  ["IP lives in their tool", "not in your portco"],
  ["Domain expertise resets every engagement", "no compounding learning"],
  ["Diligence, post-close, and transformation are separate practices", "with separate teams that barely coordinate"],
];

const VS_RIGHT = [
  ["Custom infrastructure, then tools", "built to your data as it actually is"],
  ["Working system in three weeks", "on the messy data as-is"],
  ["Knowledge graph belongs to the portco", "for the entire hold"],
  ["Sector depth compounds across engagements", "your fund gets sharper each one"],
  ["Single firm, single foundation", "from diligence through exit"],
];

const COMPONENTS = [
  {
    n: "01",
    name: "Diligence Build",
    unit: "3 weeks · one-time",
    body: "Custom investigation layer scoped to the target. Delivered during the LOI period. Outputs an evidence-backed bid memo and the foundation for everything that comes after close.",
  },
  {
    n: "02",
    name: "100-Day Extension",
    unit: "6 weeks · post-close",
    body: "The foundation extended with internal systems. Full preservation analysis, real-time operator Q&A, and the working artifact for the 100-day plan.",
  },
  {
    n: "03",
    name: "Continuous Access",
    unit: "Monthly · ongoing",
    body: "Data stays fresh. New investigation tools added as new questions arise. Quarterly readouts with the operating partner that feed the value-creation deck.",
  },
];

export default function Engagement() {
  return (
    <Container
      title="Catapult — The engagement"
      description="A hold-period intelligence layer for PE portfolio companies. Diligence through exit, on the same foundation."
    >
      <Hero />
      <Insight />
      <Arc />
      <Diligence />
      <HundredDay />
      <TransformExit />
      <WhyDifferent />
      <Structure />
      <TheMath />
      <Closing />
    </Container>
  );
}

/* ─── 01 · The problem (hero) ─────────────────────────────── */

function Hero() {
  return (
    <section>
      <div className="max-w-[1320px] mx-auto px-8 md:px-14 lg:px-20 pt-40 md:pt-56 pb-20 md:pb-28">
        <p
          className="label animate-fade"
          style={{ animationDelay: "0.05s" }}
        >
          The problem
        </p>
        <h1
          className="mt-10 md:mt-14 text-[2.75rem] sm:text-[3.5rem] md:text-[5rem] lg:text-[6rem] leading-[1.02] tracking-[-0.025em] font-normal text-ink max-w-[18ch] animate-rise"
          style={{ animationDelay: "0.2s" }}
        >
          The 100-day plan is a{" "}
          <em className="italic font-medium text-oxblood">
            blunt instrument.
          </em>
        </h1>
        <p
          className="mt-12 md:mt-16 text-[18px] md:text-[20px] leading-[1.6] text-ink-soft max-w-[58ch] animate-fade"
          style={{ animationDelay: "0.55s" }}
        >
          New ownership shows up, doesn&rsquo;t have time to understand what
          the company actually has, and cuts broadly. The savings are
          visible. The destruction isn&rsquo;t.
        </p>
      </div>

      <div className="max-w-[1320px] mx-auto px-8 md:px-14 lg:px-20 pb-24 md:pb-40">
        <ol className="border-t border-[var(--rule)]">
          {PROBLEMS.map((p) => (
            <ProblemRow key={p.name} p={p} />
          ))}
        </ol>
      </div>
    </section>
  );
}

function ProblemRow({ p }) {
  const [ref, visible] = useReveal();
  return (
    <li
      ref={ref}
      className={`reveal-up ${visible ? "is-visible" : ""} border-b border-[var(--rule)] py-12 md:py-20`}
    >
      <div className="grid grid-cols-12 gap-x-6 md:gap-x-12 items-baseline">
        <div className="col-span-12 md:col-span-3 mb-4 md:mb-0">
          <div className="text-[2rem] md:text-[2.75rem] leading-[1.05] tracking-[-0.02em] font-normal text-ink">
            {p.stat}
          </div>
          <div className="mt-2 label text-ink-soft">{p.unit}</div>
        </div>
        <div className="col-span-12 md:col-span-9 max-w-[58ch]">
          <h3 className="text-[1.25rem] md:text-[1.5rem] leading-[1.2] text-ink font-medium">
            {p.name}
            <span className="text-oxblood">.</span>
          </h3>
          <p className="mt-3 md:mt-4 text-[16px] md:text-[18px] leading-[1.65] text-ink-soft">
            {p.body}
          </p>
        </div>
      </div>
    </li>
  );
}

/* ─── 02 · The insight ────────────────────────────────────── */

function Insight() {
  return (
    <section className="border-t border-[var(--rule)]">
      <div className="max-w-[1320px] mx-auto px-8 md:px-14 lg:px-20 pt-24 md:pt-40 pb-12 md:pb-20">
        <p className="label">The insight</p>
        <h2 className="mt-10 md:mt-14 text-[2.25rem] md:text-[3.25rem] lg:text-[4rem] leading-[1.04] tracking-[-0.02em] font-normal text-ink max-w-[20ch]">
          Make the company legible{" "}
          <em className="italic font-medium text-oxblood">
            before the cuts.
          </em>
        </h2>
        <p className="mt-10 md:mt-14 text-[17px] md:text-[19px] leading-[1.65] text-ink-soft max-w-[58ch]">
          Every contract. Every vendor. Every Slack channel. Every service
          ticket. Every employee. Surfaced before the 100-day plan is locked.
        </p>
      </div>
      <div className="max-w-[1320px] mx-auto px-8 md:px-14 lg:px-20 pb-24 md:pb-40">
        <BluntVsNuanced />
      </div>
    </section>
  );
}

function BluntVsNuanced() {
  const [ref, visible] = useReveal();
  return (
    <div
      ref={ref}
      className={`reveal-up ${visible ? "is-visible" : ""} grid md:grid-cols-2 gap-x-12 gap-y-12 border-t border-[var(--rule)] pt-12 md:pt-16`}
    >
      <div className="md:border-r md:border-[var(--rule)] md:pr-12">
        <p className="label">Blunt</p>
        <ol className="mt-6 space-y-4">
          {BLUNT.map((line, i) => (
            <li
              key={i}
              className="text-[16px] md:text-[17.5px] leading-[1.55] text-ink-soft"
            >
              {line}
            </li>
          ))}
        </ol>
      </div>
      <div>
        <p className="label text-oxblood">Nuanced</p>
        <ol className="mt-6 space-y-4">
          {NUANCED.map((line, i) => (
            <li
              key={i}
              className="text-[16px] md:text-[17.5px] leading-[1.55] text-ink"
            >
              {line}
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

/* ─── 03 · The arc ────────────────────────────────────────── */

function Arc() {
  return (
    <section className="border-t border-[var(--rule)]">
      <div className="max-w-[1320px] mx-auto px-8 md:px-14 lg:px-20 pt-24 md:pt-40 pb-12 md:pb-20">
        <p className="label">The arc</p>
        <h2 className="mt-10 md:mt-14 text-[2.25rem] md:text-[3.25rem] lg:text-[4rem] leading-[1.04] tracking-[-0.02em] font-normal text-ink max-w-[24ch]">
          Build it once.{" "}
          <em className="italic font-medium text-oxblood">
            Compound it for five years.
          </em>
        </h2>
        <p className="mt-10 md:mt-14 text-[17px] md:text-[19px] leading-[1.65] text-ink-soft max-w-[58ch]">
          The same knowledge graph and tooling that powers diligence becomes
          the foundation for the 100-day plan, the AI transformation, and
          exit prep. Each phase makes the next one cheaper.
        </p>
      </div>
      <div className="max-w-[1320px] mx-auto px-8 md:px-14 lg:px-20 pb-24 md:pb-40">
        <ol className="border-t border-[var(--rule)]">
          {PHASES.map((p) => (
            <PhaseRow key={p.n} p={p} />
          ))}
        </ol>
      </div>
    </section>
  );
}

function PhaseRow({ p }) {
  const [ref, visible] = useReveal();
  return (
    <li
      ref={ref}
      className={`reveal-up ${visible ? "is-visible" : ""} border-b border-[var(--rule)] py-10 md:py-16`}
    >
      <div className="grid grid-cols-12 gap-x-6 md:gap-x-12 items-baseline">
        <div className="col-span-12 md:col-span-3 mb-4 md:mb-0">
          <div className="label">{p.n}</div>
          <div className="mt-2 text-[1.5rem] md:text-[1.875rem] leading-[1.1] text-ink font-medium">
            {p.name}
            <span className="text-oxblood">.</span>
          </div>
        </div>
        <div className="col-span-12 md:col-span-9 max-w-[58ch]">
          <p className="text-[17px] md:text-[19px] leading-[1.65] text-ink-soft">
            {p.body}
          </p>
        </div>
      </div>
    </li>
  );
}

/* ─── 04 · Diligence ──────────────────────────────────────── */

function Diligence() {
  return (
    <section className="border-t border-[var(--rule)]">
      <div className="max-w-[1320px] mx-auto px-8 md:px-14 lg:px-20 pt-24 md:pt-40 pb-12 md:pb-20">
        <p className="label">Phase 01 · Diligence</p>
        <h2 className="mt-10 md:mt-14 text-[2.25rem] md:text-[3.25rem] lg:text-[4rem] leading-[1.04] tracking-[-0.02em] font-normal text-ink max-w-[20ch]">
          Bid with{" "}
          <em className="italic font-medium text-oxblood">eyes open.</em>
        </h2>
        <p className="mt-10 md:mt-14 text-[17px] md:text-[19px] leading-[1.65] text-ink-soft max-w-[58ch]">
          During the LOI period, AI reads the entire data room, surfaces what
          diligence teams typically miss, and gives the deal team an
          evidence-backed view of risks and upside.
        </p>
      </div>
      <div className="max-w-[1320px] mx-auto px-8 md:px-14 lg:px-20 pb-24 md:pb-40">
        <p className="label mb-8">What we find</p>
        <ol className="border-t border-[var(--rule)]">
          {DILIGENCE_FINDS.map((f) => (
            <FindRow key={f.name} f={f} />
          ))}
        </ol>
      </div>
    </section>
  );
}

function FindRow({ f }) {
  const [ref, visible] = useReveal();
  return (
    <li
      ref={ref}
      className={`reveal-up ${visible ? "is-visible" : ""} border-b border-[var(--rule)] py-8 md:py-12`}
    >
      <div className="grid grid-cols-12 gap-x-6 md:gap-x-12 items-baseline">
        <div className="col-span-12 md:col-span-5 mb-3 md:mb-0">
          <h3 className="text-[1.25rem] md:text-[1.5rem] leading-[1.2] text-ink font-medium">
            {f.name}
            <span className="text-oxblood">.</span>
          </h3>
        </div>
        <div className="col-span-12 md:col-span-7 max-w-[52ch]">
          <p className="text-[16px] md:text-[17.5px] leading-[1.6] text-ink-soft">
            {f.body}
          </p>
        </div>
      </div>
    </li>
  );
}

/* ─── 05 · 100-Day ────────────────────────────────────────── */

function HundredDay() {
  return (
    <section className="border-t border-[var(--rule)]">
      <div className="max-w-[1320px] mx-auto px-8 md:px-14 lg:px-20 pt-24 md:pt-40 pb-12 md:pb-20">
        <p className="label">Phase 02 · 100-Day</p>
        <h2 className="mt-10 md:mt-14 text-[2.25rem] md:text-[3.25rem] lg:text-[4rem] leading-[1.04] tracking-[-0.02em] font-normal text-ink max-w-[20ch]">
          Preserve{" "}
          <em className="italic font-medium text-oxblood">what matters.</em>
        </h2>
        <p className="mt-10 md:mt-14 text-[17px] md:text-[19px] leading-[1.65] text-ink-soft max-w-[58ch]">
          The same data foundation, now extended with internal systems. The
          operating partner can ask any question and get an answer in hours,
          not weeks.
        </p>
      </div>
      <div className="max-w-[1320px] mx-auto px-8 md:px-14 lg:px-20 pb-24 md:pb-40">
        <p className="label mb-8">Questions you can actually ask</p>
        <ol className="border-t border-[var(--rule)]">
          {QUERIES.map((q, i) => (
            <QueryRow key={i} q={q} index={i} />
          ))}
        </ol>
      </div>
    </section>
  );
}

function QueryRow({ q, index }) {
  const [ref, visible] = useReveal();
  return (
    <li
      ref={ref}
      className={`reveal-up ${visible ? "is-visible" : ""} border-b border-[var(--rule)] py-8 md:py-12`}
    >
      <div className="grid grid-cols-12 gap-x-6 md:gap-x-12 items-baseline">
        <div className="col-span-1 md:col-span-1">
          <span aria-hidden className="text-oxblood text-[1.25rem] md:text-[1.5rem] leading-none">
            →
          </span>
        </div>
        <div className="col-span-11 md:col-span-11 max-w-[60ch]">
          <p className="italic text-[1.15rem] md:text-[1.4rem] leading-[1.45] text-ink">
            &ldquo;{q}&rdquo;
          </p>
        </div>
      </div>
    </li>
  );
}

/* ─── 06 · Transform + Exit ───────────────────────────────── */

function TransformExit() {
  return (
    <section className="border-t border-[var(--rule)]">
      <div className="max-w-[1320px] mx-auto px-8 md:px-14 lg:px-20 pt-24 md:pt-40 pb-12 md:pb-20">
        <p className="label">Phases 03 + 04 · Transform + Exit</p>
        <h2 className="mt-10 md:mt-14 text-[2.25rem] md:text-[3.25rem] lg:text-[4rem] leading-[1.04] tracking-[-0.02em] font-normal text-ink max-w-[22ch]">
          The same foundation{" "}
          <em className="italic font-medium text-oxblood">
            carries you to exit.
          </em>
        </h2>
      </div>
      <div className="max-w-[1320px] mx-auto px-8 md:px-14 lg:px-20 pb-24 md:pb-40">
        <div className="grid md:grid-cols-2 gap-x-12 gap-y-12 border-t border-[var(--rule)] pt-12 md:pt-16">
          <div className="md:border-r md:border-[var(--rule)] md:pr-12">
            <p className="label">03 · Transform</p>
            <h3 className="mt-4 text-[1.5rem] md:text-[1.875rem] leading-[1.15] text-ink font-medium">
              AI-first operations
              <span className="text-oxblood">.</span>
            </h3>
            <p className="mt-5 text-[16px] md:text-[17.5px] leading-[1.6] text-ink-soft">
              The knowledge graph exists. The integrations work. The team is
              comfortable querying. The same substrate now powers
              customer-facing and operational AI.
            </p>
            <ul className="mt-6 space-y-3 text-[15.5px] md:text-[16.5px] leading-[1.55] text-ink">
              <li>Sales tools that know every customer.</li>
              <li>Service agents that know every contract.</li>
              <li>Finance copilots that know every vendor.</li>
            </ul>
          </div>
          <div>
            <p className="label text-oxblood">04 · Exit</p>
            <h3 className="mt-4 text-[1.5rem] md:text-[1.875rem] leading-[1.15] text-ink font-medium">
              Premium multiple
              <span className="text-oxblood">.</span>
            </h3>
            <p className="mt-5 text-[16px] md:text-[17.5px] leading-[1.6] text-ink-soft">
              A company with five years of operational legibility commands a
              higher multiple. The same system that ran the hold produces the
              exit story.
            </p>
            <ul className="mt-6 space-y-3 text-[15.5px] md:text-[16.5px] leading-[1.55] text-ink">
              <li>CIM data with verifiable evidence.</li>
              <li>Growth narratives backed by query history.</li>
              <li>A buyer&rsquo;s data room that writes itself.</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── 07 · Why different ──────────────────────────────────── */

function WhyDifferent() {
  return (
    <section className="border-t border-[var(--rule)]">
      <div className="max-w-[1320px] mx-auto px-8 md:px-14 lg:px-20 pt-24 md:pt-40 pb-12 md:pb-20">
        <p className="label">Why this is different</p>
        <h2 className="mt-10 md:mt-14 text-[2.25rem] md:text-[3.25rem] lg:text-[4rem] leading-[1.04] tracking-[-0.02em] font-normal text-ink max-w-[24ch]">
          AI firms bring tools looking for data.{" "}
          <em className="italic font-medium text-oxblood">
            We do the opposite.
          </em>
        </h2>
        <p className="mt-10 md:mt-14 text-[17px] md:text-[19px] leading-[1.65] text-ink-soft max-w-[58ch]">
          Most AI firms sell a product that only works once the data is
          ready. Portcos never have the data ready. That&rsquo;s the entire
          problem.
        </p>
      </div>
      <div className="max-w-[1320px] mx-auto px-8 md:px-14 lg:px-20 pb-12 md:pb-20">
        <div className="grid md:grid-cols-2 gap-x-12 gap-y-12 border-t border-[var(--rule)] pt-12 md:pt-16">
          <div className="md:border-r md:border-[var(--rule)] md:pr-12">
            <p className="label">AI consultancies</p>
            <ol className="mt-6 space-y-5">
              {VS_LEFT.map(([head, body], i) => (
                <li key={i}>
                  <div className="text-[16px] md:text-[17.5px] leading-[1.45] text-ink-soft">
                    {head}
                    <span className="text-ink-faint italic"> — {body}</span>
                  </div>
                </li>
              ))}
            </ol>
          </div>
          <div>
            <p className="label text-oxblood">Catapult</p>
            <ol className="mt-6 space-y-5">
              {VS_RIGHT.map(([head, body], i) => (
                <li key={i}>
                  <div className="text-[16px] md:text-[17.5px] leading-[1.45] text-ink font-medium">
                    {head}
                    <span className="text-ink-soft font-normal italic">
                      {" "}
                      — {body}
                    </span>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
      <div className="max-w-[1320px] mx-auto px-8 md:px-14 lg:px-20 pb-24 md:pb-40">
        <p className="max-w-[68ch] text-[17px] md:text-[19px] leading-[1.6] text-ink italic border-t border-[var(--rule)] pt-12 md:pt-16">
          The moat — the portco&rsquo;s data made legible{" "}
          <span className="text-oxblood not-italic">is</span> the product.
          That&rsquo;s not replicable from a vendor.
        </p>
      </div>
    </section>
  );
}

/* ─── 08 · Engagement structure ───────────────────────────── */

function Structure() {
  return (
    <section className="border-t border-[var(--rule)]">
      <div className="max-w-[1320px] mx-auto px-8 md:px-14 lg:px-20 pt-24 md:pt-40 pb-12 md:pb-20">
        <p className="label">Engagement</p>
        <h2 className="mt-10 md:mt-14 text-[2.25rem] md:text-[3.25rem] lg:text-[4rem] leading-[1.04] tracking-[-0.02em] font-normal text-ink max-w-[22ch]">
          Structured to{" "}
          <em className="italic font-medium text-oxblood">fit the fund.</em>
        </h2>
        <p className="mt-10 md:mt-14 text-[17px] md:text-[19px] leading-[1.65] text-ink-soft max-w-[58ch]">
          Three components. Scoped per portco. Priced against the value being
          preserved, not the hours being billed.
        </p>
      </div>
      <div className="max-w-[1320px] mx-auto px-8 md:px-14 lg:px-20 pb-24 md:pb-40">
        <ol className="border-t border-[var(--rule)]">
          {COMPONENTS.map((c) => (
            <ComponentRow key={c.n} c={c} />
          ))}
        </ol>
      </div>
    </section>
  );
}

function ComponentRow({ c }) {
  const [ref, visible] = useReveal();
  return (
    <li
      ref={ref}
      className={`reveal-up ${visible ? "is-visible" : ""} border-b border-[var(--rule)] py-14 md:py-24`}
    >
      <div className="grid grid-cols-12 gap-x-6 md:gap-x-12 items-baseline">
        <div className="col-span-12 md:col-span-3 mb-6 md:mb-0">
          <div className="label">{c.n}</div>
          <div className="mt-3 label text-ink-soft">{c.unit}</div>
        </div>
        <div className="col-span-12 md:col-span-9 max-w-[58ch]">
          <h3 className="text-[2rem] md:text-[3rem] lg:text-[3.5rem] leading-[1.04] tracking-[-0.02em] font-normal text-ink">
            {c.name}
            <span className="text-oxblood">.</span>
          </h3>
          <p className="mt-6 md:mt-8 text-[17px] md:text-[19px] leading-[1.65] text-ink-soft">
            {c.body}
          </p>
        </div>
      </div>
    </li>
  );
}

/* ─── 09 · The math ───────────────────────────────────────── */

function TheMath() {
  const [ref, visible] = useReveal();
  return (
    <section className="border-t border-[var(--rule)]">
      <div className="max-w-[1320px] mx-auto px-8 md:px-14 lg:px-20 py-24 md:py-40">
        <div
          ref={ref}
          className={`reveal-up ${visible ? "is-visible" : ""}`}
        >
          <p className="label">The math</p>
          <p className="mt-10 md:mt-14 text-[2rem] md:text-[3rem] lg:text-[3.75rem] leading-[1.1] tracking-[-0.02em] font-normal text-ink max-w-[22ch]">
            Preserve <span className="italic font-medium text-oxblood">$2M</span>{" "}
            of legacy value, at a 10× multiple, and you&rsquo;ve created{" "}
            <span className="italic font-medium text-oxblood">$20M</span> of
            enterprise value.
          </p>
          <p className="mt-10 md:mt-14 text-[17px] md:text-[19px] leading-[1.65] text-ink-soft max-w-[58ch]">
            The engagement is a small fraction of that surface — on either
            side of the range.
          </p>
        </div>
      </div>
    </section>
  );
}

/* ─── 10 · Closing CTA ────────────────────────────────────── */

function Closing() {
  return (
    <section className="border-t border-[var(--rule)]">
      <div className="max-w-[1320px] mx-auto px-8 md:px-14 lg:px-20 py-24 md:py-40">
        <p className="label">Next step</p>
        <h2 className="mt-10 md:mt-14 text-[2.5rem] sm:text-[3rem] md:text-[4.5rem] lg:text-[5.5rem] leading-[1.02] tracking-[-0.025em] font-normal text-ink max-w-[18ch]">
          Pick a target in{" "}
          <em className="italic font-medium text-oxblood">active diligence.</em>
        </h2>
        <p className="mt-10 md:mt-14 text-[17px] md:text-[19px] leading-[1.65] text-ink-soft max-w-[58ch]">
          We&rsquo;ll deliver Phase 01 during the LOI period. The same
          foundation extends through the 100-day plan, transformation, and
          exit prep.
        </p>
        <div className="mt-12 md:mt-16">
          <Link href="/contact" className="cta">
            Brief us on the portfolio <span aria-hidden>→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
