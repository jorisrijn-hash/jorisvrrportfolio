import { Hero } from "@/components/modules/Hero";
import { Manifesto } from "@/components/modules/Manifesto";
import { Currently } from "@/components/modules/Currently";
import { FeaturedWork } from "@/components/modules/FeaturedWork";
import { LabPreview } from "@/components/modules/LabPreview";
import { ProfileTeaser } from "@/components/modules/ProfileTeaser";
import { ClosingCTA } from "@/components/modules/ClosingCTA";
import { Footer } from "@/components/modules/Footer";

export default function IndexPage() {
  return (
    <>
      <Hero />
      <Manifesto />
      <Currently />
      <FeaturedWork />
      <LabPreview />
      <ProfileTeaser />
      <ClosingCTA />
      <Footer />
    </>
  );
}
