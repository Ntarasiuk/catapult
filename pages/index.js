import Container from "components/Container";
import Subscribe from "components/Subscribe";

export default function Home() {
  return (
    <Container>
      <div className="flex flex-col justify-center items-start max-w-2xl border-gray-200 dark:border-gray-700 mx-auto pb-16">
        <div className="flex flex-col-reverse sm:flex-row items-start">
          <div className="flex flex-col pr-8">
            <h1
              className="font-bold text-4xl md:text-5xl tracking-tight mb-1 text-black dark:text-white"
              style={{ lineHeight: 2 }}
            >
              Catapult ☄
            </h1>
            <h2 className="text-gray-700 dark:text-gray-200 mb-4">
              Find the developer you&apos;re looking for
            </h2>
          </div>
        </div>
        <span className="h-8" />

        <div className="flex flex-col justify-center items-start max-w-2xl mx-auto mb-16 w-full">
          <div id="about" className="mb-8 prose dark:prose-dark leading-6">
            <h2>Who are we?</h2>
            <p>
              Catapult ☄ is focused on the technical job market (specifically,{" "}
              <b>Front-end Engineers</b> and <b>Fullstack engineers</b>) of
              which there are a staggering 4.1 Million unfilled jobs. Despite
              the abundance of highly skilled software developers ready to be
              hired, they remain unnoticed and unable to find employment.
            </p>
            <h2>What&apos;s the need?</h2>
            <p>
              Generally, recruiters only have a few resources available to them
              before meeting a candidate such as a resume, job description, and
              some keyword search terms. As a result, it can be difficult to
              ascertain if a candidate possesses the skills they{" "}
              <em>say they have</em>, as simply relying on &quot;hot
              buzzwords&quot; is not enough. This can leave recruiters with
              hundreds of candidates who are likely unqualified, leading to
              lengthy interviews that can be incredibly frustrating for the
              recruiter, developer and, most importantly, the hiring client.
            </p>
            <h2>What&apos;s the solution?</h2>
            <p>
              Catapult will rigorously evaluate developers in both technical and
              interpersonal competencies, provide candid, constructive feedback,
              and produce a comprehensive report to be used and shared with
              clients.
            </p>
          </div>
        </div>

        <span className="h-16" />
        <Subscribe />
      </div>
    </Container>
  );
}
