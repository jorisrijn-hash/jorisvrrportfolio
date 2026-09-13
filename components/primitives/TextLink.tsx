"use client";

import Link from "next/link";
import { useSound } from "@/lib/sound";

type Props = {
  href: string;
  children: React.ReactNode;
  external?: boolean;
  className?: string;
};

/**
 * The site's single link affordance: mono, uppercase, with a rule that draws
 * itself on hover. No pill, no border, no icon decoration — an arrow is only
 * added where a link genuinely leaves the site.
 */
export function TextLink({ href, children, external, className }: Props) {
  const { cue } = useSound();

  const shared = {
    className: `link ${className ?? ""}`,
    onPointerEnter: () => cue("hover"),
    onPointerDown: () => cue("press"),
  };

  if (external) {
    return (
      <a href={href} target="_blank" rel="noreferrer noopener" {...shared}>
        {children}
      </a>
    );
  }

  return (
    <Link href={href} {...shared}>
      {children}
    </Link>
  );
}
