import type { Metadata } from "next";
import { PortfolioExperience } from "@/components/experience/PortfolioExperience";

export const metadata: Metadata = {
  title: "About",
  description:
    "Joris van Rijn — HBO-ICT Business & Data Management, with a background in visual design and digital media.",
};

/** Deep link: boots the experience straight into the ABOUT state. */
export default function AboutPage() {
  return <PortfolioExperience initial="ABOUT" />;
}
