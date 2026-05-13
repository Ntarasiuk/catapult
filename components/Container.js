import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import Cursor from "./Cursor";

export default function Container(props) {
  const { children, ...customMeta } = props;
  const router = useRouter();
  const meta = {
    title: "Catapult — The intelligence layer for portfolio companies",
    description:
      "We build the intelligence layer for PE portfolio companies. Day one of ownership, the operating partner can see and ask anything. By exit, the portco is AI-native.",
    image: "https://devcatapult.com/static/og.png",
    type: "website",
    ...customMeta,
  };
  const url = `https://devcatapult.com${router.asPath}`;

  return (
    <>
      <Head>
        <title>{meta.title}</title>
        <meta name="robots" content="follow, index" />
        <meta name="description" content={meta.description} />
        <link rel="canonical" href={url} />
        <meta property="og:url" content={url} />
        <meta property="og:type" content={meta.type} />
        <meta property="og:site_name" content="Catapult" />
        <meta property="og:locale" content="en_US" />
        <meta property="og:title" content={meta.title} />
        <meta property="og:description" content={meta.description} />
        <meta property="og:image" content={meta.image} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content="Catapult — don't cut what you can't see." />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={meta.title} />
        <meta name="twitter:description" content={meta.description} />
        <meta name="twitter:image" content={meta.image} />
        <meta name="twitter:image:alt" content="Catapult — don't cut what you can't see." />
      </Head>
      <a href="#main" className="skip-nav">
        Skip to content
      </a>
      <Cursor />
      <SiteHeader currentPath={router.pathname} />
      <main id="main" className="flex-1">{children}</main>
      <SiteFooter />
    </>
  );
}

function SiteHeader({ currentPath }) {
  return (
    <header className="absolute top-0 left-0 right-0 z-30">
      <div className="max-w-[1320px] mx-auto px-8 md:px-14 lg:px-20 h-20 md:h-24 flex items-center justify-between">
        <Link
          href="/"
          className="text-[24px] md:text-[26px] leading-none tracking-[-0.01em] text-ink"
        >
          Catapult<span className="text-oxblood">.</span>
        </Link>
        <nav className="flex items-center gap-8 md:gap-12">
          <NavLink href="/engagement" active={currentPath === "/engagement"}>
            Engagement
          </NavLink>
          <NavLink href="/contact" active={currentPath === "/contact"}>
            Contact
          </NavLink>
        </nav>
      </div>
    </header>
  );
}

function NavLink({ href, children, active }) {
  return (
    <Link
      href={href}
      className={`text-[15px] md:text-[16px] leading-none transition-colors ${
        active ? "text-oxblood italic" : "text-ink hover:text-oxblood"
      }`}
    >
      {children}
    </Link>
  );
}

function SiteFooter() {
  return (
    <footer className="mt-32 md:mt-56 pb-12 md:pb-16">
      <div className="max-w-[1320px] mx-auto px-8 md:px-14 lg:px-20">
        <div className="border-t border-[var(--rule)] pt-8 flex flex-col md:flex-row md:items-baseline md:justify-between gap-3 text-[14px] text-ink-muted">
          <span>
            Catapult<span className="text-oxblood">.</span>{" "}
            <span className="text-ink-faint">— Sacramento, California.</span>
          </span>
          <span className="text-ink-faint italic">
            © {new Date().getFullYear()}
          </span>
        </div>
      </div>
    </footer>
  );
}
