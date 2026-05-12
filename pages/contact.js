import Container from "components/Container";
import Subscribe from "components/Subscribe";

export default function Contact() {
  return (
    <Container
      title="Catapult — Get in touch"
      description="Tell us about the portfolio company. We'll reply within two business days."
    >
      <section>
        <div className="max-w-[1320px] mx-auto px-8 md:px-14 lg:px-20 pt-40 md:pt-56 pb-16 md:pb-24">
          <p
            className="label animate-fade"
            style={{ animationDelay: "0.05s" }}
          >
            Get in touch
          </p>

          <h1
            className="mt-10 md:mt-14 text-[2.75rem] sm:text-[3.5rem] md:text-[5rem] lg:text-[6rem] leading-[1.02] tracking-[-0.025em] font-normal text-ink max-w-[16ch] animate-rise"
            style={{ animationDelay: "0.2s" }}
          >
            Tell us about the{" "}
            <em className="italic font-medium text-oxblood">portfolio.</em>
          </h1>

          <p
            className="mt-12 md:mt-16 text-[18px] md:text-[20px] leading-[1.6] text-ink-soft max-w-[48ch] animate-fade"
            style={{ animationDelay: "0.55s" }}
          >
            Operating partners, deal teams, value-creation leads. We&rsquo;ll
            reply within two business days.
          </p>
        </div>
      </section>

      <section>
        <div className="max-w-[1320px] mx-auto px-8 md:px-14 lg:px-20 pb-8 md:pb-16">
          <div className="max-w-[640px]">
            <Subscribe />
          </div>
          <p className="mt-16 md:mt-20 text-[15px] text-ink-faint italic">
            Or write directly —{" "}
            <a href="mailto:hello@devcatapult.com" className="ink-link not-italic">
              hello@devcatapult.com
            </a>
          </p>
        </div>
      </section>
    </Container>
  );
}
