import { Scroll } from "@/components/site/Scroll";
import { Crosshair } from "@/components/site/Crosshair";
import { Weight } from "@/components/site/Weight";
import { Nav } from "@/components/site/Nav";
import { Hero } from "@/components/site/Hero";
import { About } from "@/components/site/About";
import { Work } from "@/components/site/Work";
import { Focus } from "@/components/site/Focus";
import { Contact } from "@/components/site/Contact";
import { Footer } from "@/components/site/Footer";

/**
 * One page, read from a light state into a dark one.
 *
 * Everything is server-rendered HTML. Three small client components exist:
 * the scroll driver (one listener for the whole page), the portrait's
 * pointer lean, and the two sections that answer to a pointer.
 *
 * The last stretch sits inside `.descent`, which is what carries the page's
 * visual system from day into night as it is scrolled.
 */
export default function IndexPage() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <About />
        <Work />
        <div className="descent">
          {/* The page turns here. It is deliberately empty: the change from
              the light world to the dark one happens while there is nothing
              to read, so it is watched rather than read through. */}
          <div className="fall" data-fall aria-hidden="true" />
          <Focus />
          <Contact />
          <Footer />
        </div>
      </main>
      <Scroll />
      <Crosshair />
      <Weight />
    </>
  );
}
