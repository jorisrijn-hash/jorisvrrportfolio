import { Hero } from "@/components/scenes/Hero";
import { Positioning } from "@/components/scenes/Positioning";
import { Statement } from "@/components/scenes/Statement";
import { Currently } from "@/components/scenes/Currently";
import { Work } from "@/components/scenes/Work";
import { Lab } from "@/components/scenes/Lab";
import { Profile } from "@/components/scenes/Profile";
import { Final } from "@/components/scenes/Final";
import { Footer } from "@/components/scenes/Footer";

/**
 * The homepage is a SEQUENCE OF SCENES, not a stack of sections. Each owns
 * 100vw, sets its own ground, and carries one memorable behaviour:
 *
 *   01 Hero         ink        ASSEMBLE
 *   02 Positioning  ivory      WEIGHT
 *   03 Statement    burgundy   MASK
 *   04 Currently    ink        STICKY TRANSFORM
 *   05 Work         ivory      restrained
 *   06 Lab          ink        SCROLL-LINKED HORIZONTAL
 *   07 Profile      ivory      MASK
 *   08 Final        burgundy   SILK
 */
export default function IndexPage() {
  return (
    <>
      <Hero />
      <Positioning />
      <Statement />
      <Currently />
      <Work />
      <Lab />
      <Profile />
      <Final />
      <Footer />
    </>
  );
}
