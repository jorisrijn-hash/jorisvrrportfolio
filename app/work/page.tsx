import type { Metadata } from "next";
import { PortfolioExperience } from "@/components/experience/PortfolioExperience";

export const metadata: Metadata = {
  title: "Work",
  description: "Selected experiments and case studies by Joris van Rijn.",
};

/** Deep link: boots the experience straight into the WORK state. */
export default function WorkPage() {
  return <PortfolioExperience initial="WORK" />;
}
