import { Reveals } from "@/components/site/Reveals";
import { Nav } from "@/components/site/Nav";
import { Hero } from "@/components/site/Hero";
import { About } from "@/components/site/About";
import { Work } from "@/components/site/Work";
import { Statement } from "@/components/site/Statement";
import { Focus } from "@/components/site/Focus";
import { Process } from "@/components/site/Process";
import { Currently } from "@/components/site/Currently";
import { Contact } from "@/components/site/Contact";
import { Footer } from "@/components/site/Footer";

/**
 * The page is server-rendered HTML. Two small client components exist: the
 * observer that reveals sections as they are reached, and the hero object
 * that leans toward the pointer. Everything else is CSS.
 */
export default function IndexPage() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <About />
        <Work />
        <Statement />
        <Focus />
        <Process />
        <Currently />
        <Contact />
        {/* the page turns black here, and stays black */}
        <div className="dusk" aria-hidden="true" />
      </main>
      <Footer />
      <Reveals />
    </>
  );
}
