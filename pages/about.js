import Container from "components/Container";
import Subscribe from "components/Subscribe";

export default function About() {
  return (
    <Container title="About – Lee Robinson">
      <div className="flex flex-col justify-center items-start max-w-2xl mx-auto mb-16 w-full">
        <h1 className="font-bold text-3xl md:text-5xl tracking-tight mb-4 text-black dark:text-white">
          About Us
        </h1>
        <div className="mb-8 prose dark:prose-dark leading-6">
          <h2>Who are we?</h2>
          <p>
            Catapult ☄ is focused on the technical (read: software engineers)
            job market, of which there are 4.1 Million unfilled jobs.
            Specifically, <b>Front-end Engineers</b> and{" "}
            <b>Fullstack engineers</b> for now. There are lots of extremely
            talented software developers out there waiting to be hired, but they
            can&apos;t seem to be noticed.
          </p>
          <h2>What&apos;s the need?</h2>
          <p>
            Generally, recruiters have only a couple tools to work with before
            meeting a candidate: resume, job description, and some keywords to
            blindly search. It becomes really hard to figure out if a candidate
            can do what they <em>say they do</em> because there is a technical
            barrier. Filtering by &quot;hot buzzwords&quot; won&apos;t get you
            very far. Now they&apos;re left with 100s of candidates who are most
            likely unqualified and being thrown into long interviews. This will
            frusterate the recruiter, the developer, and more importantly the
            hiring client.
          </p>
          <h2>What&apos;s the solution?</h2>
          <p>
            Catapult will screen developers in both <b>hard skills</b> and{" "}
            <b>soft skills</b> to verify their skills, provide honest feedback
            to the developer, and a clear report to use and present to clients.
          </p>
        </div>
        <Subscribe />
      </div>
    </Container>
  );
}

