import Link from "next/link";
import Container from "components/Container";

export default function Home() {
  return (
    <Container>
      <section className="min-h-screen flex items-center">
        <div className="max-w-[1320px] w-full mx-auto px-8 md:px-14 lg:px-20 pt-32 md:pt-40 pb-24">
          <p
            className="label animate-fade"
            style={{ animationDelay: "0.05s" }}
          >
            For operating partners
          </p>

          <h1
            className="mt-10 md:mt-14 text-[2.75rem] sm:text-[3.5rem] md:text-[5rem] lg:text-[6.25rem] xl:text-[7rem] leading-[1.02] tracking-[-0.025em] font-normal text-ink max-w-[14ch] animate-rise"
            style={{ animationDelay: "0.2s" }}
          >
            Don&rsquo;t cut what you{" "}
            <em className="italic font-medium text-oxblood">can&rsquo;t see.</em>
          </h1>

          <p
            className="mt-12 md:mt-16 text-[18px] md:text-[20px] leading-[1.6] text-ink-soft max-w-[58ch] animate-fade"
            style={{ animationDelay: "0.55s" }}
          >
            A hold-period intelligence layer for PE portfolio companies.
            Diligence through exit, on the same foundation.
          </p>

          <div
            className="mt-14 md:mt-20 flex flex-wrap items-baseline gap-x-10 gap-y-6 animate-fade"
            style={{ animationDelay: "0.85s" }}
          >
            <Link href="/engagement" className="cta">
              See the engagement <span aria-hidden>→</span>
            </Link>
            <Link href="/contact" className="ink-link text-[16px] italic">
              Or get in touch
            </Link>
          </div>
        </div>
      </section>
    </Container>
  );
}
