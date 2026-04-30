import Container from "components/Container";
import Link from "next/link";
import AsciiField from "components/AsciiField";

export default function NotFound() {
  return (
    <Container title="404 — Catapult">
      <section className="px-5 md:px-10 max-w-[1440px] mx-auto pt-12 md:pt-20 pb-24 md:pb-40 min-h-[70vh] flex flex-col justify-center">
        <div className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.22em] text-ink-muted font-bold">
          <span className="w-2 h-2 bg-acid-deep block animate-pulse" aria-hidden />
          <span>ERR_404 / OFF THE MAP</span>
        </div>
        <AsciiField text={"NOTHING\nHERE"} className="mt-8" haloRadius={10} />
        <h1 className="sr-only">404 — Page not found</h1>
        <p className="mt-10 max-w-xl text-base md:text-lg text-ink leading-relaxed font-mono">
          <span className="text-ink-muted">[ &gt; ]</span> The page you&rsquo;re
          looking for has either moved, been retired, or never existed. Easy
          fix.
        </p>
        <div className="mt-12">
          <Link href="/" className="btn-acid">
            <span className="w-2 h-2 bg-ink block" aria-hidden />
            <span>Back to home</span>
            <span aria-hidden>→</span>
          </Link>
        </div>
      </section>
    </Container>
  );
}
