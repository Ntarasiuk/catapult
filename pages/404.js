import Container from "components/Container";
import Link from "next/link";

export default function NotFound() {
  return (
    <Container title="404 — Catapult">
      <section className="min-h-[70vh] flex items-center">
        <div className="max-w-[1320px] w-full mx-auto px-8 md:px-14 lg:px-20 pt-32 md:pt-40 pb-24">
          <p className="label">404 · Not found</p>
          <h1 className="mt-10 md:mt-14 text-[2.75rem] md:text-[4.5rem] lg:text-[5.5rem] leading-[1.02] tracking-[-0.025em] font-normal text-ink max-w-[16ch]">
            This page is{" "}
            <em className="italic font-medium text-oxblood">elsewhere.</em>
          </h1>
          <div className="mt-12 md:mt-16">
            <Link href="/" className="cta">
              Back to the start <span aria-hidden>→</span>
            </Link>
          </div>
        </div>
      </section>
    </Container>
  );
}
