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
            <p className="text-gray-600 dark:text-gray-400 mb-16">
              Helping companies find the right developers, and helping
              developers present their best
            </p>
          </div>
        </div>

        <span className="h-16" />
        <Subscribe />
      </div>
    </Container>
  );
}

